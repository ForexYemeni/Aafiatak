module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "proxy",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [middleware] (ecmascript)");
;
// In-memory rate limit store
const rateLimitStore = new Map();
// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();
function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of rateLimitStore.entries()){
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}
function getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP.trim();
    }
    return 'unknown';
}
function checkRateLimit(key, limit, windowMs) {
    cleanup();
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetTime) {
        const resetTime = now + windowMs;
        rateLimitStore.set(key, {
            count: 1,
            resetTime
        });
        return {
            allowed: true,
            remaining: limit - 1,
            resetTime
        };
    }
    if (entry.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime
        };
    }
    entry.count++;
    return {
        allowed: true,
        remaining: limit - entry.count,
        resetTime: entry.resetTime
    };
}
// Rate limit configurations
const RATE_LIMITS = {
    login: {
        limit: 5,
        windowMs: 60 * 1000
    },
    register: {
        limit: 3,
        windowMs: 60 * 1000
    },
    api: {
        limit: 100,
        windowMs: 60 * 1000
    }
};
function getRateLimitCategory(pathname) {
    if (pathname.includes('/login') || pathname.includes('/auth/login')) {
        return 'login';
    }
    if (pathname.includes('/register') || pathname.includes('/auth/register')) {
        return 'register';
    }
    return 'api';
}
function proxy(request) {
    const { pathname } = request.nextUrl;
    // Only rate limit API routes
    if (!pathname.startsWith('/api/')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    const ip = getClientIP(request);
    const category = getRateLimitCategory(pathname);
    const config = RATE_LIMITS[category];
    const key = `${category}:${ip}`;
    const result = checkRateLimit(key, config.limit, config.windowMs);
    const response = result.allowed ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next() : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'طلبات كثيرة جداً',
        message: 'لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.'
    }, {
        status: 429
    });
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(config.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));
    if (!result.allowed) {
        response.headers.set('Retry-After', String(Math.ceil((result.resetTime - Date.now()) / 1000)));
    }
    return response;
}
const config = {
    matcher: [
        '/api/:path*'
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d952de30._.js.map