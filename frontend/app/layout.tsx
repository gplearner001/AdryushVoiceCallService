import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Voice Agent Dashboard',
  description: 'Voice Agent API Management Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex space-x-8">
                <a href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Dashboard
                </a>
                <a href="/knowledge" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Knowledge Bases
                </a>
                <a href="/testing" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Testing
                </a>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}