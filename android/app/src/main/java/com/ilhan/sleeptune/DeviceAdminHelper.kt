package com.ilhan.sleeptune

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import com.ilhan.sleeptune.AudioFocusManager

object DeviceAdminHelper {
    private const val REQUEST_CODE_ENABLE_ADMIN = 1001

    fun requestDeviceAdminPermission(activity: Activity) {
        val componentName = ComponentName(activity, MyDeviceAdminReceiver::class.java)
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName)
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Zamanlayıcı sona erdiğinde ekranı kapatmak için izin gerekli.")
        activity.startActivityForResult(intent, REQUEST_CODE_ENABLE_ADMIN)
    }

    fun lockDeviceIfPermitted(context: Context) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val componentName = ComponentName(context, MyDeviceAdminReceiver::class.java)

        if (dpm.isAdminActive(componentName)) {
            Log.d("DeviceAdminHelper", "Yetki var, ekran kilitleniyor...")
            AudioFocusManager.requestAudioFocus(context)
            dpm.lockNow()
        } else {
            Toast.makeText(context, "Cihaz yöneticisi izni verilmemiş.", Toast.LENGTH_SHORT).show()
            Log.d("DeviceAdminHelper", "Cihaz yöneticisi izni yok.")
        }
    }
}
