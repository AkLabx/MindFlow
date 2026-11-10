# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve stack trace metadata for Play Console crash deobfuscation
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*,JavascriptInterface,Signature

# Capacitor Core Bridge & Plugin Reflection
-keep class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin
-keep public class * extends com.getcapacitor.PluginCall
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
}
-keepclassmembers class * extends com.getcapacitor.Plugin {
    <init>(...);
}

# Android WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class com.getcapacitor.BridgeWebChromeClient { *; }

# Capacitor Google Auth & Google Play Services
-keep class com.codetrixstudio.capacitor.GoogleAuth.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Cordova Plugin Bridge Compatibility
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**
