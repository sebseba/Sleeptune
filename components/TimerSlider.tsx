import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';

type Props = {
  onValueChange: (value: number) => void;
};

const TimerSlider: React.FC<Props> = ({ onValueChange }) => {
  const [minutes, setMinutes] = useState(1);

  const handleSliderChange = (value: number[]) => {
    const rounded = Math.round(value[0]);
    setMinutes(rounded);
    onValueChange(rounded);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Timer: {minutes} min</Text>
      <Slider
        value={[minutes]}
        minimumValue={1}
        maximumValue={120}
        step={1}
        minimumTrackTintColor="#9c27b0"
        maximumTrackTintColor="#ddd"
        thumbTintColor="#9c27b0"
        onValueChange={handleSliderChange}
        containerStyle={{ width: 300 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  label: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
});

export default TimerSlider;
