import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "عافيتك - رعاية صحية في منزلك",
  description: "منصة متكاملة لربط المستفيدين بالممرضين المؤهلين - رعاية صحية في منزلك مع إشعارات صوتية فورية",
  manifest: "/manifest.json",
  applicationName: "عافيتك",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "عافيتك",
    startupImage: ["/logo-512.png"],
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: [
      { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo-192.png", sizes: "192x192" },
      { url: "/logo-512.png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/logo-192.png" />
        <link rel="apple-touch-icon" href="/logo-512.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // ─── Service Worker Registration ───
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/'
                  }).then(function(registration) {
                    console.log('✅ Service Worker registered:', registration.scope);

                    // Check for SW updates every 30 minutes
                    setInterval(function() {
                      registration.update().catch(function() {});
                    }, 1800000);

                    // Handle updates
                    registration.addEventListener('updatefound', function() {
                      var newWorker = registration.installing;
                      newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'activated') {
                          console.log('🔄 Service Worker updated');
                        }
                      });
                    });
                  }).catch(function(error) {
                    console.warn('⚠️ Service Worker registration failed:', error);
                  });
                });
              }

              // ─── PWA Install Prompt ───
              // Store the install event so the app can trigger it later
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__aafiatakInstallPrompt = e;
                console.log('💾 PWA install prompt captured');
                // Dispatch custom event so React components can listen
                window.dispatchEvent(new CustomEvent('pwaInstallReady'));
              });

              window.addEventListener('appinstalled', function() {
                console.log('✅ PWA installed successfully');
                window.__aafiatakInstallPrompt = null;
                window.dispatchEvent(new CustomEvent('pwaInstalled'));
              });
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
