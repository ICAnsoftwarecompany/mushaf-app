package expo.modules.yatlualarms

import android.app.AlarmManager
import android.content.Context
import android.os.Build
import android.os.PowerManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * يتلو: حالة إعدادات أندرويد اللي بتأثر على الأذان والتطبيق مقفول.
 * - canScheduleExactAlarms: «المنبهات والتذكيرات» (أندرويد ١٢+). أقدم من ١٢ = مسموح دايمًا.
 * - isIgnoringBatteryOptimizations: البطارية «غير مقيّد» / «عدم التحسين».
 * لو مفيش context بنرجّع true علشان ما نطلعش تنبيه غلط.
 */
class YatluAlarmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("YatluAlarms")

    Function("canScheduleExactAlarms") {
      canExact()
    }

    Function("isIgnoringBatteryOptimizations") {
      ignoringBattery()
    }
  }

  private fun canExact(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    val ctx: Context = appContext.reactContext ?: return true
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return true
    return am.canScheduleExactAlarms()
  }

  private fun ignoringBattery(): Boolean {
    val ctx: Context = appContext.reactContext ?: return true
    val pm = ctx.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return true
    return pm.isIgnoringBatteryOptimizations(ctx.packageName)
  }
}
