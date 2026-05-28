import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "日本語 Basic 850",
  description:
    "面向中文母语者的最小日语学习系统 · 灵感来自 Ogden Basic English 850。用最小词汇、汉字与句型，覆盖日常理解与表达。",
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
