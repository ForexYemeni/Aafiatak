module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/firebase-admin.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "firebaseInitialized",
    ()=>firebaseInitialized,
    "firestore",
    ()=>firestore,
    "initializationError",
    ()=>initializationError
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__ = __turbopack_context__.i("[externals]/firebase-admin [external] (firebase-admin, cjs, [project]/node_modules/firebase-admin)");
;
let firebaseInitialized = false;
let initializationError = null;
let firestoreInstance = null;
function parsePrivateKey(key) {
    if (!key) return undefined;
    let parsed = key.trim();
    // If the key is base64 encoded (for Netlify compatibility)
    if (!parsed.includes('-----BEGIN')) {
        try {
            const decoded = Buffer.from(parsed, 'base64').toString('utf-8');
            if (decoded.includes('-----BEGIN')) {
                parsed = decoded;
            }
        } catch  {
        // Not base64, continue with as-is
        }
    }
    // Replace escaped newlines with actual newlines
    parsed = parsed.replace(/\\n/g, '\n').replace(/\\r\\n/g, '\n').replace(/\r\n/g, '\n');
    // Clean up any extra whitespace around the header/footer
    parsed = parsed.replace(/-----BEGIN PRIVATE KEY-----\s+/g, '-----BEGIN PRIVATE KEY-----\n').replace(/\s+-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');
    return parsed.trim();
}
const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
};
// Only initialize if ALL required credentials are present AND look valid
const hasValidConfig = firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey && firebaseConfig.projectId !== 'your-project-id' && firebaseConfig.privateKey.includes('-----BEGIN');
if (!__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["apps"].length) {
    if (hasValidConfig) {
        try {
            __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["initializeApp"]({
                credential: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["credential"].cert({
                    projectId: firebaseConfig.projectId,
                    clientEmail: firebaseConfig.clientEmail,
                    privateKey: firebaseConfig.privateKey
                })
            });
            firebaseInitialized = true;
            firestoreInstance = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["firestore"]();
            console.log('✅ Firebase Admin SDK initialized successfully');
        } catch (error) {
            initializationError = `فشل تهيئة Firebase: ${error.message}`;
            console.error('❌ Firebase Admin SDK initialization failed:', error.message);
        }
    } else {
        // Provide specific error message based on what's missing
        const missing = [];
        if (!firebaseConfig.projectId) missing.push('FIREBASE_PROJECT_ID');
        if (!firebaseConfig.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
        if (!firebaseConfig.privateKey) missing.push('FIREBASE_PRIVATE_KEY');
        if (missing.length > 0) {
            initializationError = `بيانات Firebase غير مكتملة. المتغيرات الناقصة: ${missing.join(', ')}`;
        } else {
            initializationError = 'بيانات Firebase غير صالحة. تأكد من صحة المفتاح الخاص أنه يحتوي على -----BEGIN PRIVATE KEY-----';
        }
        console.warn('⚠️ Firebase Admin SDK: Missing or invalid credentials.', missing.length > 0 ? `Missing: ${missing.join(', ')}` : '');
    }
} else {
    firebaseInitialized = true;
    firestoreInstance = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["firestore"]();
}
const firestore = firestoreInstance;
;
}),
"[project]/src/app/api/firebase-status/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/firebase-admin.ts [app-route] (ecmascript) <locals>");
;
;
async function GET() {
    // Basic check: is the SDK initialized?
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firebaseInitialized"]) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            connected: false,
            error: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["initializationError"] || 'Firebase غير مهيأ'
        });
    }
    // Try a lightweight Firestore read to verify the database actually works
    try {
        const { firestore } = await __turbopack_context__.A("[project]/src/lib/firebase-admin.ts [app-route] (ecmascript, async loader)");
        // Try to read from a system collection (just check connectivity)
        await firestore.collection('_health_check').limit(1).get();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            connected: true,
            error: null
        });
    } catch (error) {
        const msg = error.message || '';
        if (msg.includes('PERMISSION_DENIED') || msg.includes('has not been used')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                connected: false,
                error: 'يجب تفعيل Firestore Database من Firebase Console مع اختيار Test Mode'
            });
        }
        // SDK initialized but Firestore might have issues
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            connected: false,
            error: `خطأ في الاتصال بقاعدة البيانات: ${msg.substring(0, 100)}`
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a6cd44a5._.js.map