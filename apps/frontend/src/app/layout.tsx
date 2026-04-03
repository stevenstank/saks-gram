import type { ReactNode } from "react";
import { Inter } from "next/font/google";

import { Navbar } from "../components/navbar";
import { RouteFade } from "../components/route-fade";
import { AuthProvider } from "../context/auth-context";
import { ThemeProvider } from "../context/theme-context";
import { ToastProvider } from "../context/toast-context";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} min-h-screen overflow-x-hidden bg-black text-white antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <div className="mx-auto w-full max-w-[1100px] px-4 py-6 pt-20 md:px-6">
                <RouteFade>
                  <div className="mx-auto w-full">{children}</div>
                </RouteFade>
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
