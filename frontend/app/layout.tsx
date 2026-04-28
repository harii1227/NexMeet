import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "NexMeet – Free Video Calls",
  description: "Crystal-clear real-time video calls. No sign-up, no downloads. Powered by WebRTC.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NexMeet",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#4f8ef7",
    "msapplication-TileImage": "/icons/icon-144.png",
  },
  icons: {
    icon: "/icons/Logo.png",
    apple: "/icons/Logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f8ef7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NexMeet" />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
