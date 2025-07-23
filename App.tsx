import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  NativeModules,
  AppState,
  DeviceEventEmitter
} from 'react-native';
import TimerPickerModalComponent from './components/TimerPickerModal';

const { DeviceAdmin, AudioFocusModule, TimerModule } = NativeModules;

export default function App() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [duration, setDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Başlat tuşu
  const startTimer = () => {
    const totalSec = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
    const now = Date.now();
    setEndTimestamp(now + totalSec * 1000);
    setSecondsLeft(totalSec);
    TimerModule.startTimer(totalSec * 1000);
  };

  // Her saniye kalan süreci hesapla
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

  // AppState değişiminde de anlık güncelle
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && endTimestamp !== null) {
        const diff = Math.ceil((endTimestamp - Date.now()) / 1000);
        setSecondsLeft(diff > 0 ? diff : 0);
      }
    });
    return () => sub.remove();
  }, [endTimestamp]);

  // Native bitti broadcast’ini dinle
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('TimerFinished', () => {
      setEndTimestamp(null);
      setSecondsLeft(0);
    });
    return () => sub.remove();
  }, []);

  const fadeOutAndLock = async () => {
    try {
      await AudioFocusModule.fadeOutVolume();
      DeviceAdmin.lockScreen();
    } catch (e) {
      console.log('Hata:', e);
    }
  };

  const requestPermission = () => {
    try {
      DeviceAdmin.requestAdminPermission();
    } catch {
      Alert.alert('Hata', 'Yönetici yetkisi alınamadı.');
    }
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
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

      <View style={{ height: 20 }} />
      <Button title="📲 YÖNETİCİ YETKİSİ AL" onPress={requestPermission} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#111', padding:20 },
  title: { fontSize:32, marginBottom:20, color:'#fff' },
  label: { color:'#ccc', fontSize:16, marginVertical:10 },
  timer: { fontSize:48, marginVertical:30, color:'#fff' },
});
