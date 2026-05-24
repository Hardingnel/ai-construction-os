import type { Metadata } from 'next';
import './../styles/globals.css';

export const metadata: Metadata = {
  title: 'AI Construction OS',
  description: 'AI-powered Architecture, Engineering & Construction Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
