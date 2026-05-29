import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "種 · 种子日语",
  description:
    "面向中文母语者的最小日语学习系统，灵感来自 Ogden Basic English。把核心词、核心汉字、核心句型当作种子，去理解、组合、表达。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
