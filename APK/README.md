# LAGO Android (APK)

LAGO 웹앱을 전체 화면으로 여는 안드로이드 앱이에요. LAGO 주소와 로그인 주소만 앱 안에서 열고, 다른 링크는 브라우저로 보내요.

- 받기: Releases의 `LAGO-Android.apk` → 열어서 설치 (‘출처를 알 수 없는 앱 설치’ 허용)
- 직접 빌드: Android SDK · JDK 17 · Gradle 8.9에서 `gradle assembleRelease`

## 서명 키

GitHub 저장소 Secrets에 아래 두 개를 넣으면 그 키로 서명해요.

- `ANDROID_KEYSTORE_B64`: 키 저장소 파일을 base64로 바꾼 글 (키 별칭은 `lago`)
- `ANDROID_KEYSTORE_PASS`: 비밀번호

넣지 않으면 빌드할 때마다 새로 만들어지는 디버그 키로 서명해요. 이 경우 새 버전을 깔려면 **이전 앱을 지우고** 깔아야 해요.

```bash
keytool -genkeypair -v -keystore lago.jks -alias lago -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 lago.jks   # 이 출력을 ANDROID_KEYSTORE_B64 에 넣어요
```
