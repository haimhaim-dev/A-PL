# Add project specific ProGuard rules here.

# 전체적으로 보수적인 접근 - 중요한 클래스들 보존
-keep class com.haimhaim.APL.** { *; }

# Capacitor WebView 관련 규칙
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor 플러그인 보존
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-dontwarn com.getcapacitor.**
-dontwarn com.capacitorjs.plugins.**

# Firebase/Google Services 관련 - 모든 클래스 보존
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keepclassmembers class com.google.firebase.** { *; }
-keepclassmembers class com.google.android.gms.** { *; }

# Firebase KTX 및 Kotlin 관련 경고 무시
-dontwarn com.google.firebase.ktx.**
-dontwarn kotlin.**
-dontwarn kotlinx.**
-dontwarn org.jetbrains.annotations.**

# Firebase 설치 관련
-keep class com.google.firebase.installations.** { *; }
-dontwarn com.google.firebase.installations.**

# Google Play Services
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.tasks.** { *; }

# AndroidX 관련
-keep class androidx.** { *; }
-dontwarn androidx.**

# WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 일반적인 경고 무시
-dontwarn com.google.errorprone.annotations.**
-dontwarn java.lang.instrument.ClassFileTransformer
-dontwarn sun.misc.SignalHandler
-dontwarn retrofit2.**
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn com.fasterxml.jackson.databind.**

# 디버깅을 위한 속성 보존
-keepattributes SourceFile,LineNumberTable,Signature,*Annotation*

# 소스 파일 이름 숨기기
-renamesourcefileattribute SourceFile

# 기본 Android 클래스 보존
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
