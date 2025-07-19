import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  NativeModules,
} from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';

const { DeviceAdmin, AudioFocusManager } = NativeModules;

export default function App() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(10); // saniye cinsinden

  useEffect(() => {
    if (!timerActive || secondsLeft === null) return;

    if (secondsLeft === 0) {
      console.log('⏱ Süre doldu. Ekran kilitleniyor...');

      try {
        DeviceAdmin.lockScreen();
      } catch (error) {
        Alert.alert('Hata', 'Ekran kilitlenemedi.');
      }

      try {
        AudioFocusManager.abandonAudioFocus();
      } catch (error) {
        console.log('Ses odağı bırakılamadı:', error);
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
    try {
      AudioFocusManager.requestAudioFocus();
    } catch (error) {
      console.log('Ses odağı alınamadı:', error);
    }

    setSecondsLeft(selectedDuration);
    setTimerActive(true);
  };

  const requestPermission = () => {
    try {
      DeviceAdmin.requestAdminPermission();
    } catch (error) {
      Alert.alert('Hata', 'Yönetici yetkisi istenirken hata oluştu.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleeptune ⏱</Text>

      <Text style={styles.label}>Süre: {selectedDuration} saniye</Text>
      <Slider
        value={[selectedDuration]}
        onValueChange={(val) => setSelectedDuration(Math.round(val[0]))}
        minimumValue={5}
        maximumValue={600}
        step={5}
        disabled={timerActive}
        containerStyle={{ width: 300 }}
        trackStyle={{ height: 6, backgroundColor: '#ccc' }}
        minimumTrackTintColor="#FF69B4"
        thumbTintColor="#FF69B4"
      />

      <Text style={styles.time}>
        {secondsLeft !== null ? `${secondsLeft}s` : 'Hazır'}
      </Text>

      <Button
        title="⏱️ Zamanlayıcıyı Başlat"
        onPress={startTimer}
        disabled={timerActive}
      />

      <View style={{ height: 20 }} />

      <Button
        title="📲 Yönetici Yetkisi Al"
        onPress={requestPermission}
      />
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
    color: '#ccc', fontSize: 16, marginBottom: 5,
  },
  time: {
    fontSize: 48, marginVertical: 20, color: '#fff',
  },
});
