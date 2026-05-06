import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "عافيتك - Aafiatak | نظام الإشعارات الصوتية",
  description: "منصة الرعاية الصحية المنزلية مع نظام إشعارات صوتية فوري في الوقت الحقيقي",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-192.png",
    apple: "/logo-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
