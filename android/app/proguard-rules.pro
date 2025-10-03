# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Google Maps
-keep class com.google.android.gms.maps.** { *; }
-keep interface com.google.android.gms.maps.** { *; }
-keep class com.google.android.gms.common.** { *; }

# React Native Maps
-keep class com.airbnb.android.react.maps.** { *; }

# React Native specific rules
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.reactexecutor.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep React Native modules and native modules
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.modules.** { *; }

# Firebase and React Native Firebase
-keep class com.google.firebase.** { *; }
-keep class io.invertase.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep classes that are used via reflection
-keepattributes Signature,RuntimeVisibleAnnotations,AnnotationDefault

# React Native specific serialization
-keep class com.facebook.react.bridge.Arguments { *; }
-keep class com.facebook.react.bridge.WritableNativeMap { *; }
-keep class com.facebook.react.bridge.ReadableNativeMap { *; }
-keep class com.facebook.react.bridge.WritableNativeArray { *; }
-keep class com.facebook.react.bridge.ReadableNativeArray { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native Permissions
-keep class com.zoontek.rnpermissions.** { *; }

# React Native Image Picker
-keep class com.imagepicker.** { *; }

# Hermes
-keep class com.facebook.hermes.** { *; }

# OkHttp
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Keep all BuildConfig classes
-keep class **.BuildConfig { *; }

# JSC
-keep class org.webkit.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }
