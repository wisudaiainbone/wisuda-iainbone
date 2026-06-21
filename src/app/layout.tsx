import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wisuda IAIN Bone — Institut Agama Islam Negeri Bone",
  description:
    "Selamat dan sukses kepada seluruh wisudawan/wisudawati Institut Agama Islam Negeri (IAIN) Bone. Temukan informasi lengkap seputar pelaksanaan wisuda dan data wisudawan.",
  keywords: ["wisuda", "IAIN Bone", "Institut Agama Islam Negeri Bone", "graduasi"],
  openGraph: {
    title: "Wisuda IAIN Bone",
    description: "Portal resmi wisuda Institut Agama Islam Negeri Bone",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} min-h-screen antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
