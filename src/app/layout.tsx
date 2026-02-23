import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Paperwork OS",
  description:
    "Life-based paperwork operating system for Indian users: reminders, sharing, usage intelligence, and family vaults.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
