import type { Metadata, Viewport } from "next";
import { GeistSans as geistSans, GeistMono as geistMono } from "geist/font";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/auth-context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Enable env(safe-area-inset-*) on iOS notch devices
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#252525" },
  ],
};

export const metadata: Metadata = {
  title: "Лингва — Изучение 7 языков мира",
  description: "Интерактивная платформа для изучения русского, китайского, арамейского, английского, греческого, славянского и церковнославянского языков",
  keywords: ["изучение языков", "русский", "китайский", "арамейский", "английский", "греческий", "славянский", "церковнославянский"],
  authors: [{ name: "Лингва" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Лингва",
  },
  openGraph: {
    title: "Лингва — Изучение 7 языков мира",
    description: "Интерактивная платформа для изучения 7 языков: русского, китайского, арамейского, английского, греческого, славянского и церковнославянского",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
