import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, NativeModules } from 'react-native';

const { DeviceAdmin } = NativeModules;

export default function App() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive || secondsLeft === null) return;

    if (secondsLeft === 0) {
      console.log('Süre doldu. Ekran kilitleniyor...');
      try {
        DeviceAdmin.lockScreen();
      } catch (error) {
        Alert.alert("Hata", "Ekran kilitlenemedi.");
      }
      setTimerActive(false);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, timerActive]);

  const startTimer = () => {
    setSecondsLeft(10); // test için 10 saniye
    setTimerActive(true);
  };

  const requestPermission = () => {
    try {
      DeviceAdmin.requestAdminPermission();
    } catch (error) {
      Alert.alert("Hata", "Yönetici yetkisi istenirken hata oluştu.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.time}>
        {secondsLeft !== null ? `${secondsLeft}s` : 'Hazır'}
      </Text>
      <Button title="⏱️ Zamanlayıcıyı Başlat" onPress={startTimer} />
      <View style={{ height: 20 }} />
      <Button title="📲 Yönetici Yetkisi Al" onPress={requestPermission} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  time: { fontSize: 48, marginBottom: 20, color: '#fff' },
});
