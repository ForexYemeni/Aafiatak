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
"[project]/src/lib/firestore.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addLoyaltyPoints",
    ()=>addLoyaltyPoints,
    "applyReferralCode",
    ()=>applyReferralCode,
    "countBeneficiaries",
    ()=>countBeneficiaries,
    "countNurses",
    ()=>countNurses,
    "countServiceRequests",
    ()=>countServiceRequests,
    "countServices",
    ()=>countServices,
    "createActivityLog",
    ()=>createActivityLog,
    "createAdmin",
    ()=>createAdmin,
    "createAssignment",
    ()=>createAssignment,
    "createBeneficiary",
    ()=>createBeneficiary,
    "createCoupon",
    ()=>createCoupon,
    "createEmergencyRequest",
    ()=>createEmergencyRequest,
    "createNurse",
    ()=>createNurse,
    "createPaymentMethod",
    ()=>createPaymentMethod,
    "createService",
    ()=>createService,
    "createServiceRequest",
    ()=>createServiceRequest,
    "deleteCoupon",
    ()=>deleteCoupon,
    "deletePaymentMethod",
    ()=>deletePaymentMethod,
    "deleteService",
    ()=>deleteService,
    "generateReferralCode",
    ()=>generateReferralCode,
    "getActivePaymentMethods",
    ()=>getActivePaymentMethods,
    "getActiveServices",
    ()=>getActiveServices,
    "getActivityLogs",
    ()=>getActivityLogs,
    "getAdminById",
    ()=>getAdminById,
    "getAdminByUsername",
    ()=>getAdminByUsername,
    "getAllBeneficiaries",
    ()=>getAllBeneficiaries,
    "getAllCoupons",
    ()=>getAllCoupons,
    "getAllNurses",
    ()=>getAllNurses,
    "getAllPaymentMethods",
    ()=>getAllPaymentMethods,
    "getAllServiceRequests",
    ()=>getAllServiceRequests,
    "getAllServices",
    ()=>getAllServices,
    "getAssignmentById",
    ()=>getAssignmentById,
    "getAssignmentByRequestId",
    ()=>getAssignmentByRequestId,
    "getAssignmentsByNurseId",
    ()=>getAssignmentsByNurseId,
    "getBeneficiaryById",
    ()=>getBeneficiaryById,
    "getBeneficiaryByPhone",
    ()=>getBeneficiaryByPhone,
    "getChatMessages",
    ()=>getChatMessages,
    "getCompletedServiceRevenue",
    ()=>getCompletedServiceRevenue,
    "getCouponById",
    ()=>getCouponById,
    "getFirstAdmin",
    ()=>getFirstAdmin,
    "getLoyaltyBalance",
    ()=>getLoyaltyBalance,
    "getLoyaltyPoints",
    ()=>getLoyaltyPoints,
    "getNurseById",
    ()=>getNurseById,
    "getNurseByLicenseNumber",
    ()=>getNurseByLicenseNumber,
    "getNurseByNationalId",
    ()=>getNurseByNationalId,
    "getNurseByPhone",
    ()=>getNurseByPhone,
    "getPaymentMethodById",
    ()=>getPaymentMethodById,
    "getReferralByBeneficiary",
    ()=>getReferralByBeneficiary,
    "getServiceById",
    ()=>getServiceById,
    "getServiceRequestById",
    ()=>getServiceRequestById,
    "getServiceRequestsByBeneficiary",
    ()=>getServiceRequestsByBeneficiary,
    "incrementCouponUsage",
    ()=>incrementCouponUsage,
    "redeemLoyaltyPoints",
    ()=>redeemLoyaltyPoints,
    "sendChatMessage",
    ()=>sendChatMessage,
    "updateAdmin",
    ()=>updateAdmin,
    "updateAssignment",
    ()=>updateAssignment,
    "updateBeneficiary",
    ()=>updateBeneficiary,
    "updateCoupon",
    ()=>updateCoupon,
    "updateNurse",
    ()=>updateNurse,
    "updatePaymentMethod",
    ()=>updatePaymentMethod,
    "updateService",
    ()=>updateService,
    "updateServiceRequest",
    ()=>updateServiceRequest,
    "validateCoupon",
    ()=>validateCoupon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/firebase-admin.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__ = __turbopack_context__.i("[externals]/firebase-admin [external] (firebase-admin, cjs, [project]/node_modules/firebase-admin) <export * as admin>");
;
// Helper to check Firebase is available
function checkFirebase() {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firebaseInitialized"] || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"]) {
        throw new Error(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["initializationError"] || 'Firebase غير مهيأ. يرجى التحقق من إعدادات Firebase في ملف .env.local');
    }
}
// Helper to convert Firestore doc to object with id
function docToObject(doc) {
    return {
        id: doc.id,
        ...doc.data()
    };
}
async function getAdminByUsername(username) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('admins').where('username', '==', username).limit(1).get();
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
}
async function getAdminById(id) {
    checkFirebase();
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('admins').doc(id).get();
    if (!doc.exists) return null;
    return docToObject(doc);
}
async function getFirstAdmin() {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('admins').limit(1).get();
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
}
async function createAdmin(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('admins').add({
        ...data,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp(),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        ...data
    };
}
async function updateAdmin(id, data) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('admins').doc(id).update({
        ...data,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('admins').doc(id).get();
    return docToObject(doc);
}
async function getNurseByPhone(phone) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').where('phone', '==', phone).limit(1).get();
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
}
async function getNurseByNationalId(nationalId) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').where('nationalId', '==', nationalId).limit(1).get();
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
}
async function getNurseByLicenseNumber(licenseNumber) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').where('licenseNumber', '==', licenseNumber).limit(1).get();
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
}
async function getNurseById(id) {
    checkFirebase();
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').doc(id).get();
    if (!doc.exists) return null;
    return docToObject(doc);
}
async function getAllNurses(status) {
    checkFirebase();
    let snapshot;
    if (status) {
        // Filter in code to avoid composite index
        const allSnapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').orderBy('createdAt', 'desc').get();
        snapshot = {
            docs: allSnapshot.docs.filter((d)=>d.data().status === status)
        };
    } else {
        snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').orderBy('createdAt', 'desc').get();
    }
    return snapshot.docs.map(docToObject);
}
async function createNurse(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').add({
        ...data,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp(),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        ...data
    };
}
async function updateNurse(id, data) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').doc(id).update({
        ...data,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').doc(id).get();
    return docToObject(doc);
}
async function countNurses(status) {
    checkFirebase();
    if (status) {
        // Filter in code to avoid composite index
        const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').get();
        return snapshot.docs.filter((d)=>d.data().status === status).length;
    }
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').get();
    return snapshot.size;
}
async function getBeneficiaryByPhone(phone) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').where('phone', '==', phone).limit(1).get();
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
}
async function getBeneficiaryById(id) {
    checkFirebase();
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(id).get();
    if (!doc.exists) return null;
    return docToObject(doc);
}
async function createBeneficiary(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').add({
        ...data,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp(),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        ...data
    };
}
async function updateBeneficiary(id, data) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(id).update({
        ...data,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(id).get();
    return docToObject(doc);
}
async function countBeneficiaries() {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').get();
    return snapshot.size;
}
async function getAllServices() {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(docToObject);
}
async function getActiveServices() {
    checkFirebase();
    // Fetch all services ordered by createdAt, then filter active ones in code
    // This avoids the need for a composite Firestore index
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').orderBy('createdAt', 'desc').get();
    return snapshot.docs.filter((doc)=>doc.data().isActive === true).map(docToObject);
}
async function getServiceById(id) {
    checkFirebase();
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(id).get();
    if (!doc.exists) return null;
    return docToObject(doc);
}
async function createService(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').add({
        ...data,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp(),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        ...data
    };
}
async function updateService(id, data) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(id).update({
        ...data,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(id).get();
    return docToObject(doc);
}
async function deleteService(id) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(id).delete();
}
async function countServices(isActive) {
    checkFirebase();
    let query = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services');
    if (isActive !== undefined) {
        query = query.where('isActive', '==', isActive);
    }
    const snapshot = await query.get();
    return snapshot.size;
}
async function getAllServiceRequests() {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').orderBy('createdAt', 'desc').get();
    const requests = [];
    for (const doc of snapshot.docs){
        const data = doc.data();
        const beneficiaryDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(data.beneficiaryId).get();
        const serviceDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(data.serviceId).get();
        // Check for assignment
        const assignmentSnapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').where('requestId', '==', doc.id).limit(1).get();
        let assignment = null;
        if (!assignmentSnapshot.empty) {
            const assignData = assignmentSnapshot.docs[0].data();
            const nurseDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').doc(assignData.nurseId).get();
            assignment = {
                id: assignmentSnapshot.docs[0].id,
                ...assignData,
                nurse: nurseDoc.exists ? {
                    id: nurseDoc.id,
                    firstName: nurseDoc.data().firstName,
                    secondName: nurseDoc.data().secondName,
                    thirdName: nurseDoc.data().thirdName,
                    lastName: nurseDoc.data().lastName
                } : null
            };
        }
        requests.push({
            id: doc.id,
            ...data,
            beneficiary: beneficiaryDoc.exists ? {
                id: beneficiaryDoc.id,
                name: beneficiaryDoc.data().name,
                phone: beneficiaryDoc.data().phone
            } : null,
            service: serviceDoc.exists ? {
                id: serviceDoc.id,
                name: serviceDoc.data().name,
                price: serviceDoc.data().price
            } : null,
            assignment
        });
    }
    return requests;
}
async function getServiceRequestsByBeneficiary(beneficiaryId) {
    checkFirebase();
    // Fetch all requests for beneficiary, filter and sort in code to avoid composite index
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').where('beneficiaryId', '==', beneficiaryId).get();
    const requests = [];
    for (const doc of snapshot.docs){
        const data = doc.data();
        const serviceDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(data.serviceId).get();
        // Check for assignment
        const assignmentSnapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').where('requestId', '==', doc.id).limit(1).get();
        let assignment = null;
        if (!assignmentSnapshot.empty) {
            const assignData = assignmentSnapshot.docs[0].data();
            const nurseDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').doc(assignData.nurseId).get();
            assignment = {
                id: assignmentSnapshot.docs[0].id,
                ...assignData,
                nurse: nurseDoc.exists ? {
                    id: nurseDoc.id,
                    firstName: nurseDoc.data().firstName,
                    secondName: nurseDoc.data().secondName,
                    thirdName: nurseDoc.data().thirdName,
                    lastName: nurseDoc.data().lastName
                } : null
            };
        }
        requests.push({
            id: doc.id,
            ...data,
            service: serviceDoc.exists ? {
                id: serviceDoc.id,
                name: serviceDoc.data().name,
                price: serviceDoc.data().price,
                description: serviceDoc.data().description
            } : null,
            assignment
        });
    }
    return requests;
}
async function getServiceRequestById(id) {
    checkFirebase();
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').doc(id).get();
    if (!doc.exists) return null;
    return docToObject(doc);
}
async function createServiceRequest(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').add({
        ...data,
        adminNotes: null,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp(),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    // Fetch service for the response
    const serviceDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(data.serviceId).get();
    return {
        id: docRef.id,
        ...data,
        adminNotes: null,
        service: serviceDoc.exists ? {
            id: serviceDoc.id,
            name: serviceDoc.data().name,
            price: serviceDoc.data().price
        } : null
    };
}
async function updateServiceRequest(id, data) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').doc(id).update({
        ...data,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    // Return the updated request with joined data
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').doc(id).get();
    const requestData = doc.data();
    const beneficiaryDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(requestData.beneficiaryId).get();
    const serviceDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(requestData.serviceId).get();
    // Check for assignment
    const assignmentSnapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').where('requestId', '==', id).limit(1).get();
    let assignment = null;
    if (!assignmentSnapshot.empty) {
        const assignData = assignmentSnapshot.docs[0].data();
        const nurseDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').doc(assignData.nurseId).get();
        assignment = {
            id: assignmentSnapshot.docs[0].id,
            ...assignData,
            nurse: nurseDoc.exists ? {
                id: nurseDoc.id,
                firstName: nurseDoc.data().firstName,
                secondName: nurseDoc.data().secondName,
                thirdName: nurseDoc.data().thirdName,
                lastName: nurseDoc.data().lastName
            } : null
        };
    }
    return {
        id: doc.id,
        ...requestData,
        beneficiary: beneficiaryDoc.exists ? {
            id: beneficiaryDoc.id,
            name: beneficiaryDoc.data().name,
            phone: beneficiaryDoc.data().phone
        } : null,
        service: serviceDoc.exists ? {
            id: serviceDoc.id,
            name: serviceDoc.data().name,
            price: serviceDoc.data().price
        } : null,
        assignment
    };
}
async function countServiceRequests(status) {
    checkFirebase();
    if (status) {
        // Filter in code to avoid composite index
        const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').get();
        return snapshot.docs.filter((d)=>d.data().status === status).length;
    }
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').get();
    return snapshot.size;
}
async function getCompletedServiceRevenue() {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').where('status', '==', 'completed').get();
    let totalRevenue = 0;
    for (const doc of snapshot.docs){
        const data = doc.data();
        const serviceDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(data.serviceId).get();
        if (serviceDoc.exists) {
            totalRevenue += serviceDoc.data().price || 0;
        }
    }
    return totalRevenue;
}
async function getAssignmentByRequestId(requestId) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').where('requestId', '==', requestId).limit(1).get();
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
}
async function getAssignmentsByNurseId(nurseId) {
    checkFirebase();
    // Fetch assignments for nurse, sort in code to avoid composite index
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').where('nurseId', '==', nurseId).get();
    const assignments = [];
    for (const doc of snapshot.docs){
        const data = doc.data();
        const requestDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').doc(data.requestId).get();
        if (requestDoc.exists) {
            const requestData = requestDoc.data();
            const beneficiaryDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(requestData.beneficiaryId).get();
            const serviceDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(requestData.serviceId).get();
            assignments.push({
                id: doc.id,
                ...data,
                request: {
                    id: requestDoc.id,
                    ...requestData,
                    beneficiary: beneficiaryDoc.exists ? {
                        id: beneficiaryDoc.id,
                        name: beneficiaryDoc.data().name,
                        phone: beneficiaryDoc.data().phone,
                        location: beneficiaryDoc.data().location
                    } : null,
                    service: serviceDoc.exists ? {
                        id: serviceDoc.id,
                        name: serviceDoc.data().name,
                        price: serviceDoc.data().price,
                        description: serviceDoc.data().description
                    } : null
                }
            });
        }
    }
    return assignments;
}
async function createAssignment(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').add({
        ...data,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp(),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    // Fetch the nurse for the response
    const nurseDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses').doc(data.nurseId).get();
    // Fetch the request with beneficiary and service
    const requestDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').doc(data.requestId).get();
    const requestData = requestDoc.data();
    const beneficiaryDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(requestData.beneficiaryId).get();
    const serviceDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(requestData.serviceId).get();
    return {
        id: docRef.id,
        ...data,
        nurse: nurseDoc.exists ? {
            id: nurseDoc.id,
            firstName: nurseDoc.data().firstName,
            secondName: nurseDoc.data().secondName,
            thirdName: nurseDoc.data().thirdName,
            lastName: nurseDoc.data().lastName
        } : null,
        request: {
            id: requestDoc.id,
            ...requestData,
            beneficiary: beneficiaryDoc.exists ? {
                id: beneficiaryDoc.id,
                name: beneficiaryDoc.data().name
            } : null,
            service: serviceDoc.exists ? {
                id: serviceDoc.id,
                name: serviceDoc.data().name,
                price: serviceDoc.data().price
            } : null
        }
    };
}
async function getAssignmentById(id) {
    checkFirebase();
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').doc(id).get();
    if (!doc.exists) return null;
    return docToObject(doc);
}
async function updateAssignment(id, data) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').doc(id).update({
        ...data,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    // Return the updated assignment with joined data
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').doc(id).get();
    const assignData = doc.data();
    const requestDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').doc(assignData.requestId).get();
    let requestWithJoins = null;
    if (requestDoc.exists) {
        const requestData = requestDoc.data();
        const beneficiaryDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(requestData.beneficiaryId).get();
        const serviceDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').doc(requestData.serviceId).get();
        requestWithJoins = {
            id: requestDoc.id,
            ...requestData,
            beneficiary: beneficiaryDoc.exists ? {
                id: beneficiaryDoc.id,
                name: beneficiaryDoc.data().name,
                phone: beneficiaryDoc.data().phone
            } : null,
            service: serviceDoc.exists ? {
                id: serviceDoc.id,
                name: serviceDoc.data().name,
                price: serviceDoc.data().price
            } : null
        };
    }
    return {
        id: doc.id,
        ...assignData,
        request: requestWithJoins
    };
}
async function getAllPaymentMethods() {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('paymentMethods').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(docToObject);
}
async function getActivePaymentMethods() {
    checkFirebase();
    // Fetch all payment methods ordered by createdAt, then filter active ones in code
    // This avoids the need for a composite Firestore index
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('paymentMethods').orderBy('createdAt', 'desc').get();
    return snapshot.docs.filter((doc)=>doc.data().isActive === true).map(docToObject);
}
async function getPaymentMethodById(id) {
    checkFirebase();
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('paymentMethods').doc(id).get();
    if (!doc.exists) return null;
    return docToObject(doc);
}
async function createPaymentMethod(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('paymentMethods').add({
        ...data,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp(),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        ...data
    };
}
async function updatePaymentMethod(id, data) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('paymentMethods').doc(id).update({
        ...data,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('paymentMethods').doc(id).get();
    return docToObject(doc);
}
async function deletePaymentMethod(id) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('paymentMethods').doc(id).delete();
}
async function createActivityLog(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('activityLog').add({
        ...data,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        ...data
    };
}
async function getActivityLogs(limitCount = 20) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('activityLog').orderBy('createdAt', 'desc').limit(limitCount).get();
    return snapshot.docs.map(docToObject);
}
async function getAllBeneficiaries() {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc)=>{
        const data = doc.data();
        const { password, ...rest } = data;
        return {
            id: doc.id,
            ...rest
        };
    });
}
async function getChatMessages(requestId, limitCount = 50) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('chats').where('requestId', '==', requestId).orderBy('createdAt', 'asc').limit(limitCount).get();
    return snapshot.docs.map(docToObject);
}
async function sendChatMessage(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('chats').add({
        ...data,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        ...data
    };
}
async function createCoupon(data) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('coupons').add({
        ...data,
        usedCount: 0,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp(),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        ...data,
        usedCount: 0
    };
}
async function getAllCoupons() {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('coupons').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(docToObject);
}
async function getCouponById(id) {
    checkFirebase();
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('coupons').doc(id).get();
    if (!doc.exists) return null;
    return docToObject(doc);
}
async function updateCoupon(id, data) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('coupons').doc(id).update({
        ...data,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('coupons').doc(id).get();
    return docToObject(doc);
}
async function deleteCoupon(id) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('coupons').doc(id).delete();
}
async function validateCoupon(code) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('coupons').where('code', '==', code).where('isActive', '==', true).limit(1).get();
    if (snapshot.empty) return null;
    const coupon = docToObject(snapshot.docs[0]);
    const now = new Date();
    // Check expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        return null;
    }
    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return null;
    }
    return coupon;
}
async function incrementCouponUsage(couponId) {
    checkFirebase();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('coupons').doc(couponId).update({
        usedCount: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.increment(1),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
}
async function getLoyaltyPoints(beneficiaryId) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('loyaltyPoints').where('beneficiaryId', '==', beneficiaryId).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(docToObject);
}
async function addLoyaltyPoints(beneficiaryId, points, reason) {
    checkFirebase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('loyaltyPoints').add({
        beneficiaryId,
        points,
        reason,
        type: 'earn',
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    // Update beneficiary total points
    const benefDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(beneficiaryId).get();
    if (benefDoc.exists) {
        const currentPoints = benefDoc.data().loyaltyPoints || 0;
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(beneficiaryId).update({
            loyaltyPoints: currentPoints + points,
            updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
        });
    }
    return {
        id: docRef.id,
        beneficiaryId,
        points,
        reason,
        type: 'earn'
    };
}
async function redeemLoyaltyPoints(beneficiaryId, points) {
    checkFirebase();
    // Check current balance
    const benefDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(beneficiaryId).get();
    if (!benefDoc.exists) throw new Error('المستفيد غير موجود');
    const currentPoints = benefDoc.data().loyaltyPoints || 0;
    if (currentPoints < points) throw new Error('رصيد النقاط غير كافٍ');
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('loyaltyPoints').add({
        beneficiaryId,
        points: -points,
        reason: `استبدال ${points} نقطة`,
        type: 'redeem',
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(beneficiaryId).update({
        loyaltyPoints: currentPoints - points,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        beneficiaryId,
        points: -points,
        reason: `استبدال ${points} نقطة`,
        type: 'redeem'
    };
}
async function getLoyaltyBalance(beneficiaryId) {
    checkFirebase();
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(beneficiaryId).get();
    if (!doc.exists) return 0;
    return doc.data().loyaltyPoints || 0;
}
async function createEmergencyRequest(data) {
    checkFirebase();
    const benefDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('beneficiaries').doc(data.beneficiaryId).get();
    const beneficiaryName = benefDoc.exists ? benefDoc.data().name : 'غير معروف';
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('emergencyRequests').add({
        ...data,
        beneficiaryName,
        status: 'pending',
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp(),
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        ...data,
        beneficiaryName,
        status: 'pending'
    };
}
async function generateReferralCode(beneficiaryId) {
    checkFirebase();
    // Check if already has a code
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('referrals').where('beneficiaryId', '==', beneficiaryId).limit(1).get();
    if (!snapshot.empty) {
        return docToObject(snapshot.docs[0]);
    }
    // Generate unique code
    const code = 'AFY-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const docRef = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('referrals').add({
        beneficiaryId,
        code,
        uses: 0,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.serverTimestamp()
    });
    return {
        id: docRef.id,
        beneficiaryId,
        code,
        uses: 0
    };
}
async function applyReferralCode(code, newBeneficiaryId) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('referrals').where('code', '==', code).limit(1).get();
    if (snapshot.empty) return null;
    const referral = docToObject(snapshot.docs[0]);
    // Can't use own code
    if (referral.beneficiaryId === newBeneficiaryId) {
        throw new Error('لا يمكنك استخدام كود الإحالة الخاص بك');
    }
    // Increment uses
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('referrals').doc(referral.id).update({
        uses: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__$3c$export__$2a$__as__admin$3e$__["admin"].firestore.FieldValue.increment(1)
    });
    // Give both parties loyalty points
    await addLoyaltyPoints(referral.beneficiaryId, 50, 'مكافأة إحالة - شخص جديد استخدم كودك');
    await addLoyaltyPoints(newBeneficiaryId, 25, 'مكافأة إحالة - استخدمت كود إحالة');
    return {
        ...referral,
        uses: referral.uses + 1
    };
}
async function getReferralByBeneficiary(beneficiaryId) {
    checkFirebase();
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('referrals').where('beneficiaryId', '==', beneficiaryId).limit(1).get();
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
}
}),
"[project]/src/app/api/admin/services/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firestore.ts [app-route] (ecmascript)");
;
;
async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, price, category, isActive } = body;
        const existing = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServiceById"])(id);
        if (!existing) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'الخدمة غير موجودة'
            }, {
                status: 404
            });
        }
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (category !== undefined) updateData.category = category;
        if (isActive !== undefined) updateData.isActive = isActive;
        const service = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateService"])(id, updateData);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(service);
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'حدث خطأ في الخادم'
        }, {
            status: 500
        });
    }
}
async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const existing = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServiceById"])(id);
        if (!existing) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'الخدمة غير موجودة'
            }, {
                status: 404
            });
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deleteService"])(id);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'تم حذف الخدمة بنجاح'
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'حدث خطأ في الخادم'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__687aa885._.js.map