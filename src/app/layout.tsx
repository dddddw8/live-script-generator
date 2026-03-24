import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "直播话术生成器 - AI 智能生成直播带货话术",
  description: "输入产品信息，AI 自动生成专业直播话术，内置违禁词检测与替换",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-geist-sans)]">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
