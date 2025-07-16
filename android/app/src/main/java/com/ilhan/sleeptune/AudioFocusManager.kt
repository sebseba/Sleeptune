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
                    AudioManager.AUDIOFOCUS_GAIN -> {
                        Log.d("AudioFocusManager", "Audio focus gained")
                    }
                    AudioManager.AUDIOFOCUS_LOSS -> {
                        Log.d("AudioFocusManager", "Audio focus lost")
                    }
                    AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                        Log.d("AudioFocusManager", "Audio focus lost transiently")
                    }
                    AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                        Log.d("AudioFocusManager", "Audio focus lost with duck")
                    }
                }
            },
            AudioManager.STREAM_MUSIC,
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
        )

        if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            Log.d("AudioFocusManager", "Audio focus granted, other apps should pause")
        } else {
            Log.d("AudioFocusManager", "Audio focus request failed")
        }
    }
}
