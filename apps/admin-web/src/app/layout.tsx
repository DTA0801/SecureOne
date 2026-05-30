import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConsoleProviders } from "@/components/ConsoleProviders";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ctx = await loadAdminContextSafe();
  const superAdmin = ctx.platformSuperAdmin;
  const applications = ctx.applications;

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
            <ConsoleProviders superAdmin={superAdmin} applications={applications}>
              {children}
            </ConsoleProviders>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
