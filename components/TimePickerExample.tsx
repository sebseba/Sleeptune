// components/TimePickerExample.tsx

import React, { useState } from 'react';
import { Button, View } from 'react-native';
import DatePicker from 'react-native-date-picker';

const TimePickerExample = () => {
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Zaman Seçiciyi Aç" onPress={() => setOpen(true)} />
      <DatePicker
        modal
        open={open}
        date={date}
        mode="time" // Bu satır sadece saat seçiciyi gösterir
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
          console.log(selectedDate); // Seçilen zamanı konsolda gör
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </View>
  );
};

export default TimePickerExample;