import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/hooks/useAuth';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Forja de Conteúdo',
  description: 'Organizador inteligente para criadores de conteúdo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${plusJakartaSans.variable} font-sans bg-[#101e22] text-slate-100 antialiased min-h-screen`}
        suppressHydrationWarning
      >
        <FirebaseProvider>
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl overflow-hidden bg-[#101e22]">
            {children}
          </div>
        </FirebaseProvider>
      </body>
    </html>
  );
}
