import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "AI Content Engine",
  description: "Internal AI video content management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          {/* Main content - offset for desktop sidebar */}
          <main className="flex-1 lg:ml-64 transition-all duration-300 min-h-screen">
            <div className="p-6 lg:p-8 pt-16 lg:pt-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
