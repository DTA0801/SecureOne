import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeInitScript } from "@/components/ThemeInitScript";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SecureOne · Admin",
  description: "Admin console for the SecureOne Identity & Access Management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeInitScript />
        <ToastProvider>
          <ThemeProvider>
            <div className="flex min-h-screen text-ui">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Topbar />
                <main className="flex-1 px-8 py-8">{children}</main>
              </div>
            </div>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
