import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pulse.worklog admin",
  description: "맥박의 콘텐츠 운영 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
