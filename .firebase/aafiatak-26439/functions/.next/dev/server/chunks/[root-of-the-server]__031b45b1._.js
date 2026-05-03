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
const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};
if (!__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["apps"].length) {
    try {
        if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
            __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["initializeApp"]({
                credential: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["credential"].cert(firebaseConfig)
            });
            firebaseInitialized = true;
        } else {
            initializationError = 'بيانات Firebase غير مكتملة. يرجى تعيين FIREBASE_PROJECT_ID و FIREBASE_CLIENT_EMAIL و FIREBASE_PRIVATE_KEY في ملف .env.local';
            console.warn('⚠️ Firebase Admin SDK: Missing credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local');
        }
    } catch (error) {
        initializationError = `فشل تهيئة Firebase: ${error.message}`;
        console.error('❌ Firebase Admin SDK initialization failed:', error.message);
    }
} else {
    firebaseInitialized = true;
}
const firestore = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["apps"].length ? __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["firestore"]() : null;
;
}),
"[project]/src/lib/firestore.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "countBeneficiaries",
    ()=>countBeneficiaries,
    "countNurses",
    ()=>countNurses,
    "countServiceRequests",
    ()=>countServiceRequests,
    "countServices",
    ()=>countServices,
    "createAdmin",
    ()=>createAdmin,
    "createAssignment",
    ()=>createAssignment,
    "createBeneficiary",
    ()=>createBeneficiary,
    "createNurse",
    ()=>createNurse,
    "createPaymentMethod",
    ()=>createPaymentMethod,
    "createService",
    ()=>createService,
    "createServiceRequest",
    ()=>createServiceRequest,
    "deletePaymentMethod",
    ()=>deletePaymentMethod,
    "deleteService",
    ()=>deleteService,
    "getActivePaymentMethods",
    ()=>getActivePaymentMethods,
    "getActiveServices",
    ()=>getActiveServices,
    "getAdminById",
    ()=>getAdminById,
    "getAdminByUsername",
    ()=>getAdminByUsername,
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
    "getCompletedServiceRevenue",
    ()=>getCompletedServiceRevenue,
    "getFirstAdmin",
    ()=>getFirstAdmin,
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
    "getServiceById",
    ()=>getServiceById,
    "getServiceRequestById",
    ()=>getServiceRequestById,
    "getServiceRequestsByBeneficiary",
    ()=>getServiceRequestsByBeneficiary,
    "updateAdmin",
    ()=>updateAdmin,
    "updateAssignment",
    ()=>updateAssignment,
    "updateNurse",
    ()=>updateNurse,
    "updatePaymentMethod",
    ()=>updatePaymentMethod,
    "updateService",
    ()=>updateService,
    "updateServiceRequest",
    ()=>updateServiceRequest
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
    let query = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses');
    if (status) {
        query = query.where('status', '==', status);
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get();
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
    let query = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('nurses');
    if (status) {
        query = query.where('status', '==', status);
    }
    const snapshot = await query.get();
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
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('services').where('isActive', '==', true).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(docToObject);
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
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests').where('beneficiaryId', '==', beneficiaryId).orderBy('createdAt', 'desc').get();
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
    let query = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceRequests');
    if (status) {
        query = query.where('status', '==', status);
    }
    const snapshot = await query.get();
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
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('serviceAssignments').where('nurseId', '==', nurseId).orderBy('createdAt', 'desc').get();
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
    const snapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["firestore"].collection('paymentMethods').where('isActive', '==', true).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(docToObject);
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
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/app/api/nurse/register/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firestore.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
;
;
;
async function POST(request) {
    try {
        const body = await request.json();
        const { firstName, secondName, thirdName, lastName, phone, location, nationalId, licenseNumber, licenseExpiryDate, password } = body;
        if (!firstName || !secondName || !thirdName || !lastName || !phone || !location || !nationalId || !licenseNumber || !licenseExpiryDate || !password) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'جميع الحقول مطلوبة'
            }, {
                status: 400
            });
        }
        if (!/^7\d{8}$/.test(phone)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'رقم الهاتف يجب أن يبدأ بـ 7 ويتكون من 9 أرقام'
            }, {
                status: 400
            });
        }
        const existingPhone = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getNurseByPhone"])(phone);
        if (existingPhone) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'رقم الهاتف مسجل بالفعل'
            }, {
                status: 400
            });
        }
        const existingNationalId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getNurseByNationalId"])(nationalId);
        if (existingNationalId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'الرقم الوطني مسجل بالفعل'
            }, {
                status: 400
            });
        }
        const existingLicense = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getNurseByLicenseNumber"])(licenseNumber);
        if (existingLicense) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'رقم المزاولة مسجل بالفعل'
            }, {
                status: 400
            });
        }
        const hashedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(password, 10);
        const nurse = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firestore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createNurse"])({
            firstName,
            secondName,
            thirdName,
            lastName,
            phone,
            location,
            nationalId,
            licenseNumber,
            licenseExpiryDate,
            password: hashedPassword,
            status: 'pending'
        });
        // Remove password from response
        const { password: _, ...safeNurse } = nurse;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(safeNurse);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__031b45b1._.js.map