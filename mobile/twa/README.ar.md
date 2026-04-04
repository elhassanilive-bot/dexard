# بناء APK عبر TWA (الطريقة الأنسب)

## 1) المتطلبات

- Java JDK
- Android Studio (أو Android SDK + build-tools)
- Node.js
- موقعك منشور عبر HTTPS

## 2) جهّز النطاق

عدّل القيم في:
- `mobile/twa/twa-manifest.template.json`
- `package.json` في `twa:init`

واستبدل `YOUR_DOMAIN.com` بالدومين الحقيقي.

## 3) توليد بصمة التوقيع SHA-256

بعد إنشاء keystore الخاص بالتطبيق، استخرج البصمة:

```bash
keytool -list -v -keystore <your-keystore.jks> -alias <alias>
```

ثم ضعها في:
- `public/.well-known/assetlinks.json`

بدل:
- `REPLACE_WITH_YOUR_SHA256_FINGERPRINT`

## 4) شغّل الفحص

```bash
npm run twa:doctor
```

## 5) أنشئ مشروع أندرويد من الـPWA

```bash
npm run twa:init
```

> عند طلب الملف، استخدم القالب:
> `mobile/twa/twa-manifest.template.json`

## 6) ابنِ الـAPK

```bash
npm run twa:build
```

سيتم إخراج APK/AAB داخل مشروع Android الذي ينشئه Bubblewrap.

## 7) ملاحظة مهمة

أي تعديل على الدومين/البصمة/اسم الحزمة يلزم تحديث:
- `assetlinks.json`
- إعدادات TWA
