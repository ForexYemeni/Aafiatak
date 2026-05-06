# 🚀 دليل نشر تطبيق عافيتك على Vercel (مجاني مدى الحياة)

## الخطوات:

### 1️⃣ افتح موقع Vercel
اذهب إلى: https://vercel.com/signup

### 2️⃣ سجل بحساب GitHub
- اضغط **"Continue with GitHub"**
- اختر حسابك: ForexYemeni
- وافق على الصلاحيات

### 3️⃣ استورد المشروع
- من لوحة التحكم اضغط **"Add New"** → **"Project"**
- اختر مستودع **Aafiatak** من القائمة
- اضغط **"Import"**

### 4️⃣ إعداد متغيرات البيئة
قبل النشر، أضف متغيرات البيئة:

في قسم **"Environment Variables"** أضف:

| الاسم | القيمة |
|-------|--------|
| `FIREBASE_PROJECT_ID` | `aafiatak-26439` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@aafiatak-26439.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | انسخ المفتاح الكامل من ملف .env.local |

### 5️⃣ انشر المشروع
- اضغط **"Deploy"**
- انتظر 2-3 دقائق
- 🎉 ستحصل على رابط مثل: `aafiatak.vercel.app`

---

## 🔄 النشر التلقائي
بعد الإعداد الأول، كل ما تدفع تحديثات إلى GitHub سيتم نشرها تلقائياً على Vercel!

## 📱 رابط مخصص (اختياري)
- من إعدادات المشروع → Domains
- يمكنك ربط نطاقك الخاص مثل: `aafiatak.com`
