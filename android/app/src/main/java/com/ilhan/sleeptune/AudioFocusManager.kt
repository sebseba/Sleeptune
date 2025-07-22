package com.ilhan.sleeptune

import android.content.Context
import android.media.AudioManager
import android.util.Log

object AudioFocusManager {
    fun requestAudioFocus(context: Context) {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

        val result = audioManager.requestAudioFocus(
            { focusChange ->
                when (focusChange) {
                    AudioManager.AUDIOFOCUS_GAIN -> Log.d("AudioFocusManager", "Audio focus gained")
                    AudioManager.AUDIOFOCUS_LOSS -> Log.d("AudioFocusManager", "Audio focus lost")
                    AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> Log.d("AudioFocusManager", "Audio focus lost transiently")
                    AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> Log.d("AudioFocusManager", "Audio focus duck")
                }
            },
            AudioManager.STREAM_MUSIC,
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
        )

        if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            Log.d("AudioFocusManager", "Audio focus granted.")
        } else {
            Log.d("AudioFocusManager", "Audio focus request failed.")
        }
    }

    fun abandonAudioFocus(context: Context) {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioManager.abandonAudioFocus(null)
        Log.d("AudioFocusManager", "Audio focus abandoned.")
    }

    fun fadeOutVolume(context: Context, onDone: (() -> Unit)? = null) {
    val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val streamType = AudioManager.STREAM_MUSIC
    val originalVolume = audioManager.getStreamVolume(streamType)

    val steps = 10
    val intervalMs = 300L

    for (i in 0..steps) {
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            val newVolume = (originalVolume * (steps - i)) / steps
            audioManager.setStreamVolume(streamType, newVolume.coerceAtLeast(0), 0)
            if (i == steps) {
                onDone?.invoke()
            }
        }, i * intervalMs)
    }
}

}
