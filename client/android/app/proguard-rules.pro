# Proguard rules for Capacitor
-keep class com.getcapacitor.** { *; }
-keep  class **.R$* {
    <fields>;
}
-keepattributes EnclosingMethod
