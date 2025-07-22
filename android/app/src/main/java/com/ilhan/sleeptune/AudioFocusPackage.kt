// android/app/src/main/java/com/ilhan/sleeptune/AudioFocusPackage.kt

package com.ilhan.sleeptune

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.ilhan.sleeptune.AudioFocusModule
import com.ilhan.sleeptune.TimerModule
class AudioFocusPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(
      AudioFocusModule(reactContext),
      TimerModule(reactContext)          // ← Bunu ekliyoruz
    )
  }

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = emptyList()
}
