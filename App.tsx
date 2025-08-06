// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  Platform,
  NativeModules,
  AppState,
  DeviceEventEmitter,
  PermissionsAndroid,
  Pressable,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import TimerPickerModalComponent from './components/TimerPickerModal';

const { DeviceAdmin, AudioFocusModule, TimerModule } = NativeModules;

export default function App() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [duration, setDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1) İlk açılışta bildirim + yönetici izni
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (res !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Bildirim İzni Gerekli',
            'Arka planda canlı sayaç ve kapanış aksiyonu için bildirim izni gereklidir.'
          );
        }
      }
      const asked = await AsyncStorage.getItem('adminAsked');
      if (asked !== 'true') {
        Alert.alert(
          'Yönetici Yetkisi Gerekli',
          'Uygulamayı tam fonksiyonla kullanmak için yönetici yetkisi vermeniz gerekiyor.',
          [
            {
              text: 'İzin Ver',
              onPress: async () => {
                try {
                  await DeviceAdmin.requestAdminPermission();
                  await AsyncStorage.setItem('adminAsked', 'true');
                } catch {
                  Alert.alert('Hata', 'Yönetici yetkisi alınamadı.');
                }
              },
            },
          ],
          { cancelable: false }
        );
      }
    })();
  }, []);

  // Başlat
  const startTimer = () => {
    const totalSec =
      duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
    if (totalSec === 0) return;
    const ms = totalSec * 1000;
    setPaused(false);
    setEndTimestamp(Date.now() + ms);
    setSecondsLeft(totalSec);
    TimerModule.startTimer(ms);
  };

  // Duraklat
  const pauseTimer = () => {
    clearInterval(intervalRef.current!);
    setPaused(true);
    TimerModule.pauseTimer?.();
  };

  // Devam Et
  const resumeTimer = () => {
    const ms = secondsLeft * 1000;
    setPaused(false);
    setEndTimestamp(Date.now() + ms);
    TimerModule.startTimer(ms);
  };

  // Durdur
  const stopTimer = () => {
    clearInterval(intervalRef.current!);
    setPaused(false);
    setEndTimestamp(null);
    setSecondsLeft(0);
    TimerModule.stopTimer?.();
  };

  // Her saniye güncelle
  useEffect(() => {
    if (endTimestamp === null || paused) return;
    clearInterval(intervalRef.current!);
    intervalRef.current = setInterval(() => {
      const diff = Math.ceil((endTimestamp - Date.now()) / 1000);
      if (diff <= 0) {
        clearInterval(intervalRef.current!);
        setEndTimestamp(null);
        setSecondsLeft(0);
      } else {
        setSecondsLeft(diff);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [endTimestamp, paused]);

  // AppState değişince güncelle
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && endTimestamp !== null && !paused) {
        const diff = Math.ceil((endTimestamp - Date.now()) / 1000);
        setSecondsLeft(diff > 0 ? diff : 0);
      }
    });
    return () => sub.remove();
  }, [endTimestamp, paused]);

  // Bittiğinde JS aksiyon & UI sıfırla
  const fadeOutAndLock = async () => {
    try {
      await AudioFocusModule.fadeOutVolume();
      DeviceAdmin.lockScreen();
    } catch (e) {
      console.warn('fadeOutAndLock error:', e);
    }
  };
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('TimerFinished', () => {
      setPaused(false);
      setEndTimestamp(null);
      setSecondsLeft(0);
      fadeOutAndLock();
    });
    return () => sub.remove();
  }, []);

  // HH:MM:SS
  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600),
      m = Math.floor((sec % 3600) / 60),
      s = sec % 60;
    return `${h.toString().padStart(2,'0')}:${m
      .toString()
      .padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const initialSeconds =
    duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
  const displaySeconds =
    endTimestamp !== null ? secondsLeft : initialSeconds;

  return (
    <LinearGradient
      colors={['#4B0082', '#000']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Sleeptune ⏱</Text>

      {/* Sayaç gövdesi */}
      <Pressable
        onPress={() => setPickerVisible(true)}
        style={styles.timerWrapper}
      >
        <Text style={styles.timerText}>{formatTime(displaySeconds)}</Text>
      </Pressable>

      <View style={{ height: 24 }} />

      {/* Duruma göre buton satırı */}
      {endTimestamp === null ? (
        <Pressable
          style={[styles.btn, initialSeconds === 0 && styles.btnDisabled]}
          onPress={startTimer}
          disabled={initialSeconds === 0}
        >
          <Text style={styles.btnText}>⏱️ BAŞLAT</Text>
        </Pressable>
      ) : paused ? (
        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={resumeTimer}>
            <Text style={styles.btnText}>▶️ DEVAM ET</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={stopTimer}>
            <Text style={styles.btnText}>⏹️ DURDUR</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={pauseTimer}>
            <Text style={styles.btnText}>⏸️ DURAKLAT</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={stopTimer}>
            <Text style={styles.btnText}>⏹️ DURDUR</Text>
          </Pressable>
        </View>
      )}

      {/* Modal */}
      <TimerPickerModalComponent
        visible={pickerVisible}
        setIsVisible={setPickerVisible}
        onConfirm={data => setDuration(data)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    width: 260,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    marginBottom: 24,
    color: '#fff',
  },
  timerWrapper: {
    borderWidth: 4,
    borderColor: '#6A5ACD',
    borderRadius: 120,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    color: '#fff',
  },
  btn: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginHorizontal: 8,
  },
  btnDisabled: {
    backgroundColor: '#444',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
