package com.ilhan.sleeptune

import android.app.Activity
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ActivityEventListener

class DeviceAdminModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DeviceAdmin"
    }

    @ReactMethod
    fun requestAdminPermission() {
        val activity: Activity? = currentActivity
        if (activity != null) {
            DeviceAdminHelper.requestDeviceAdminPermission(activity)
        }
    }

    @ReactMethod
    fun lockScreen() {
        val context: Context = reactContext.applicationContext
        DeviceAdminHelper.lockDeviceIfPermitted(context)
    }
}
