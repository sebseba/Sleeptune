// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  NativeModules,
  AppState,
  DeviceEventEmitter,
  PermissionsAndroid,
  TouchableOpacity,
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // — 1) İlk açılışta: Android13+ bildirim izni iste
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
      // — 2) Yönetici izni Alert’ini göster (sadece bir kez)
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

  // — Timer başlat
  const startTimer = () => {
    const totalSec = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
    const ms = totalSec * 1000;
    setEndTimestamp(Date.now() + ms);
    setSecondsLeft(totalSec);
    TimerModule.startTimer(ms);
  };

  // — Her saniye güncelle
  useEffect(() => {
    if (endTimestamp === null) return;
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
  }, [endTimestamp]);

  // — Uygulama ön plana geldiğinde de güncelle
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && endTimestamp !== null) {
        const diff = Math.ceil((endTimestamp - Date.now()) / 1000);
        setSecondsLeft(diff > 0 ? diff : 0);
      }
    });
    return () => sub.remove();
  }, [endTimestamp]);

  // — Zamanlayıcı bittiğinde JS aksiyonu tetikleyip UI sıfırla
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
      setEndTimestamp(null);
      setSecondsLeft(0);
      fadeOutAndLock();
    });
    return () => sub.remove();
  }, []);

  // — Sadece MM:SS gösteren format
  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  return (
    <LinearGradient
      colors={['#4B0082', '#000']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Sleeptune</Text>

      <View style={styles.circle}>
        <Text style={styles.timeText}>
          {endTimestamp === null ? '00:00:00' : formatTime(secondsLeft)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={startTimer}
        disabled={endTimestamp !== null}
      >
        <LinearGradient
          colors={['#00E5FF', '#6200EA']}
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.buttonText}>⏱️ BAŞLAT</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={() => setPickerVisible(true)}
      >
        <LinearGradient
          colors={['#00E5FF', '#6200EA']}
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.buttonText}>⏲️ SÜREYİ AYARLA</Text>
        </LinearGradient>
      </TouchableOpacity>

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
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    color: '#fff',
    marginBottom: 24,
    fontWeight: '600',
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  timeText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '500',
  },
  buttonWrapper: {
    width: '80%',
    marginVertical: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
});
