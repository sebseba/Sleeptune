import React from 'react';
import { useColorScheme } from 'react-native';
import { TimerPickerModal } from 'react-native-timer-picker';

type Props = {
  visible: boolean;
  setIsVisible: (v: boolean) => void;
  onConfirm: (data: { hours: number; minutes: number; seconds: number }) => void;
};

export default function TimerPickerModalComponent({
  visible,
  setIsVisible,
  onConfirm
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TimerPickerModal
      visible={visible}
      onConfirm={onConfirm}
      onCancel={() => setIsVisible(false)}
      hideDays={true}
      // @ts-ignore
      maximum={23 * 3600 + 59 * 60 + 59}
      closeOnOverlayPress={true}
      modalTitle="⏰ Süre Ayarla"
      textColor={isDark ? '#ffffff' : '#000000'}
      pickerStyle={{
        backgroundColor: isDark ? '#222' : '#fff',
      }}
      buttonStyle={{
        backgroundColor: isDark ? '#333' : '#eee',
      }}
    />
  );
}
