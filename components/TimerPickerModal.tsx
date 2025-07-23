// components/TimerPickerModal.tsx

import React from 'react'
import { useColorScheme } from 'react-native'
import { TimerPickerModal } from 'react-native-timer-picker'

type Props = {
  visible: boolean
  setIsVisible: (v: boolean) => void
  onConfirm: (data: { hours: number; minutes: number; seconds: number }) => void
}

export default function TimerPickerModalComponent({
  visible,
  setIsVisible,
  onConfirm,
}: Props) {
  const isDark = useColorScheme() === 'dark'

  return (
    <TimerPickerModal
      visible={visible}
      setIsVisible={setIsVisible}
      onConfirm={(picked) => {
        onConfirm(picked)
        setIsVisible(false)
      }}
      onCancel={() => setIsVisible(false)}
      hideDays={true}
      maximumHours={23}
      maximumMinutes={59}
      maximumSeconds={59}
      closeOnOverlayPress={true}
      modalTitle="⏰ Süre Ayarla"
      confirmButtonText="Tamam"
      cancelButtonText="İptal"
    />
  )
}
