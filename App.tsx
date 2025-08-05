import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  Platform,
  NativeModules,
  AppState,
  DeviceEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TimerPickerModalComponent from './components/TimerPickerModal';

const { DeviceAdmin, AudioFocusModule, TimerModule } = NativeModules;

export default function App() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [duration, setDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // —————— 1) İlk açılışta: bildirim izni iste
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

      // —————— 2) Bildirimden hemen sonra: yönetici izni Alert’ini göster (eğer daha önce sormadıysak)
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
              }
            }
          ],
          { cancelable: false }
        );
      }
    })();
  }, []);

  // —————— Timer kontrol + UI güncellemeleri
  const startTimer = () => {
    const totalSec = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
    const ms = totalSec * 1000;
    setEndTimestamp(Date.now() + ms);
    setSecondsLeft(totalSec);
    TimerModule.startTimer(ms);
  };

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

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && endTimestamp !== null) {
        const diff = Math.ceil((endTimestamp - Date.now()) / 1000);
        setSecondsLeft(diff > 0 ? diff : 0);
      }
    });
    return () => sub.remove();
  }, [endTimestamp]);

  // —————— Zamanlayıcı bittiğinde hem JS aksiyonu hem de UI sıfırla
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

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600),
          m = Math.floor((sec % 3600) / 60),
          s = sec % 60;
    return `${h.toString().padStart(2,'0')} : ${m.toString().padStart(2,'0')} : ${s.toString().padStart(2,'0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleeptune ⏱</Text>

      <Button title="SÜREYİ AYARLA" onPress={() => setPickerVisible(true)} />
      <Text style={styles.label}>
        Seçilen: {duration.hours} saat {duration.minutes} dk {duration.seconds} sn
      </Text>

      <TimerPickerModalComponent
        visible={pickerVisible}
        setIsVisible={setPickerVisible}
        onConfirm={data => setDuration(data)}
      />

      <Text style={styles.timer}>
        {endTimestamp === null ? 'Hazır' : formatTime(secondsLeft)}
      </Text>

      <Button
        title="⏱️ BAŞLAT"
        onPress={startTimer}
        disabled={endTimestamp !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title:   { fontSize: 32, marginBottom: 20, color: '#fff' },
  label:   { color: '#ccc', fontSize: 16, marginVertical: 10 },
  timer:   { fontSize: 48, marginVertical: 30, color: '#fff' },
});
