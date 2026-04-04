import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import { SessionBootstrap } from "@/components/layout/session-bootstrap";

import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WriterFlow",
  description: "Collaborative writing workspace"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionBootstrap>
          <div className="app-page-transition">{children}</div>
          <Toaster richColors position="top-right" closeButton />
        </SessionBootstrap>
      </body>
    </html>
  );
}