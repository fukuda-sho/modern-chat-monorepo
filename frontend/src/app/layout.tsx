import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/Sonner";
import { EnvProvider } from "@/components/providers/EnvProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Realtime Chat App",
  description: "Built with Next.js and NestJS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiUrl = process.env.API_URL ?? "http://localhost:3000";

  return (
    <html lang="en">
      <body className={inter.className}>
        <EnvProvider apiUrl={apiUrl}>
          {children}
          <Toaster />
        </EnvProvider>
      </body>
    </html>
  );
}
