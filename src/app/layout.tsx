import './globals.css';
import { Inter } from 'next/font/google';
import { UserProvider } from '@auth0/nextjs-auth0/client';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TheOpenShift',
  description: 'Bridging Aged Care Organizations and Staff through Meaningful Opportunities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider loginUrl="/api/auth/login?audience=https://api.theopenshift.com" profileUrl="/api/auth/me">
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
