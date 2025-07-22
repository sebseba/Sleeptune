// SLEEPTUNE/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  NativeModules,
} from 'react-native';
import TimerPickerModalComponent from './components/TimerPickerModal';

// NativeModules içinden artık TimerModule de geliyor
const { DeviceAdmin, AudioFocusModule, TimerModule } = NativeModules;

export default function App() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [duration, setDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!timerActive || secondsLeft === null) return;

    if (secondsLeft === 0) {
      fadeOutAndLock();
      setTimerActive(false);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft, timerActive]);

  const startTimer = () => {
    
    const totalSeconds =
      duration.hours * 3600 + duration.minutes * 60 + duration.seconds;

    setSecondsLeft(totalSeconds);
    setTimerActive(true);

    // → Burada native foreground service'i başlatıyoruz:
    try {
      // totalSeconds saniye cinsinden, native ms beklediği için *1000
      TimerModule.startTimer(totalSeconds * 1000);
    } catch (e) {
      console.log('Servis başlatılamadı:', e);
    }
  };

  const fadeOutAndLock = async () => {
    try {
      await AudioFocusModule.fadeOutVolume();
      DeviceAdmin.lockScreen();
    } catch (e) {
      console.log('Ses fade-out veya ekran kilitleme hatası:', e);
    }
  };

  const requestPermission = () => {
    try {
      DeviceAdmin.requestAdminPermission();
    } catch (error) {
      Alert.alert('Hata', 'Yönetici yetkisi istenirken hata oluştu.');
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')} : ${minutes
      .toString()
      .padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleeptune ⏱</Text>

      <Button title="SÜREYİ AYARLA" onPress={() => setPickerVisible(true)} />

      <Text style={styles.label}>
        Seçilen Süre: {duration.hours} saat {duration.minutes} dk {duration.seconds} sn
      </Text>

      <TimerPickerModalComponent
        visible={pickerVisible}
        setIsVisible={setPickerVisible}
        onConfirm={(data) => {
          setPickerVisible(false);
          setDuration({
            hours: data.hours,
            minutes: data.minutes,
            seconds: data.seconds,
          });
        }}
      />

      <Text style={styles.timer}>
        {secondsLeft !== null ? formatTime(secondsLeft) : 'Hazır'}
      </Text>

      <Button
        title="⏱️ ZAMANLAYICIYI BAŞLAT"
        onPress={startTimer}
        disabled={timerActive}
      />

      <View style={{ height: 20 }} />

      <Button title="📲 YÖNETİCİ YETKİSİ AL" onPress={requestPermission} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#111', padding: 20,
  },
  title: {
    fontSize: 32, marginBottom: 20, color: '#fff',
  },
  label: {
    color: '#ccc', fontSize: 16, marginVertical: 10,
  },
  timer: {
    fontSize: 48, marginVertical: 30, color: '#fff',
  },
});
