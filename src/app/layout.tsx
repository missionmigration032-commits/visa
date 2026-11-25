import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSA Visa & QR Verification Generator",
  description:
    "Generate bilingual Saudi Visa PDFs and MOFA QR verification cards stored in Cloudinary using Next.js Server Actions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
