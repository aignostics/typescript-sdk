'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                  <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                      Aignostics Platform Demo
                    </h1>
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
