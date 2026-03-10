'use client';

import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { PlusCircle, Package, Clock, TrendingUp, Star, Mic, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Home() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ ideas: 0, stories: 0, total: 0, favorites: 0 });

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'content'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data());
        const ideas = docs.filter((i: any) => i.type === 'idea').length;
        const stories = docs.filter((i: any) => i.type === 'story').length;
        const favorites = docs.filter((i: any) => i.isFavorite).length;
        
        setCounts({
          ideas,
          stories,
          total: docs.length,
          favorites
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'content');
      });
      return () => unsubscribe();
    } else {
      const captured = JSON.parse(localStorage.getItem('captured_content') || '[]');
      const ideas = captured.filter((i: any) => i.type === 'idea').length;
      const stories = captured.filter((i: any) => i.type === 'story').length;
      const favorites = captured.filter((i: any) => i.isFavorite).length;
      
      setTimeout(() => {
        setCounts({
          ideas,
          stories,
          total: captured.length,
          favorites
        });
      }, 0);
    }
  }, [user]);

  const collections = [
    {
      id: 'ideias',
      title: 'Mente Criativa',
      description: 'Capture lampejos de genialidade e insights rápidos.',
      icon: Mic,
      items: counts.ideas,
      lastUpdated: 'Ativo',
      image: 'https://picsum.photos/seed/creativity-mind/800/400',
      buttonText: 'Capturar Ideia',
      href: '/new?type=idea'
    },
    {
      id: 'historias',
      title: 'Fluxo de Pensamento',
      description: 'Transforme vivências em narrativas poderosas.',
      icon: FileText,
      items: counts.stories,
      lastUpdated: 'Ativo',
      image: 'https://picsum.photos/seed/thought-stream/800/400',
      buttonText: 'Registrar História',
      href: '/new?type=story'
    }
  ];

  return (
    <div className="flex flex-col flex-1 pb-24">
      <Header />
      
      <main className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar">
        <section className="pt-2">
          <h2 className="text-2xl font-bold tracking-tight mb-1">Captura</h2>
          <p className="text-slate-400 text-sm">O primeiro passo para transformar pensamentos em conteúdo.</p>
        </section>

        <div className="space-y-4">
          {collections.map((col) => {
            const Icon = col.icon;
            return (
              <div key={col.id} className="group relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-800 shadow-sm transition-all hover:shadow-md">
                <div className="h-40 w-full relative">
                  <Image 
                    src={col.image} 
                    alt={col.title}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101e22] to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 bg-[#0db9f2]/20 backdrop-blur-md px-3 py-1 rounded-full border border-[#0db9f2]/30">
                      <Icon size={14} className="text-[#0db9f2]" />
                      <span className="text-[10px] font-bold text-[#0db9f2] uppercase tracking-wider">{col.id}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-100">{col.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{col.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mt-4">
                    <div className="flex items-center gap-1">
                      <Package size={14} />
                      {col.items} itens
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {col.lastUpdated}
                    </div>
                  </div>
                  <div className="mt-5">
                    <Link href={col.href}>
                      <button className="w-full bg-[#0db9f2] hover:bg-[#0db9f2]/90 text-[#101e22] font-bold py-3 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95">
                        <PlusCircle size={18} />
                        <span>{col.buttonText}</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section className="pb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Insights Rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800">
              <TrendingUp size={20} className="text-[#0db9f2] mb-2" />
              <p className="text-2xl font-bold">{counts.total}</p>
              <p className="text-xs text-slate-500">Total de Entradas</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800">
              <Star size={20} className="text-[#0db9f2] mb-2" />
              <p className="text-2xl font-bold">{counts.favorites}</p>
              <p className="text-xs text-slate-500">Favoritos</p>
            </div>
          </div>
        </section>
      </main>

      <Navbar />
    </div>
  );
}
