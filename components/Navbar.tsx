'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, LayoutGrid, Sparkles, Video, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Captura', href: '/', icon: Mic },
    { name: 'Classificar', href: '/classify', icon: LayoutGrid },
    { name: 'Refinar', href: '/refine', icon: Sparkles },
    { name: 'Produzir', href: '/produce', icon: Video },
    { name: 'Ritual', href: '/ritual', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#101e22]/95 backdrop-blur-md border-t border-slate-800 px-2 pb-6 pt-2 z-20 max-w-md mx-auto">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200",
                isActive ? "text-[#0db9f2] scale-110" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(13,185,242,0.5)]")} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
