import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BBDU Dental Result Portal",
  description: "Examination result portal for Babu Banarasi Das University Dental College",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-blue-700 text-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">BBDU Dental Result Portal</h1>
            <nav className="space-x-4 text-sm">
              <a href="/bbdcods-result/" className="hover:underline">Home</a>
              <a href="/bbdcods-result/ranking/" className="hover:underline">Ranking</a>
              <a href="/bbdcods-result/bulk/" className="hover:underline">Bulk Collection</a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-gray-500 py-6">
          BBDU Dental Result Portal — data sourced from university examination cell.
        </footer>
      </body>
    </html>
  );
}