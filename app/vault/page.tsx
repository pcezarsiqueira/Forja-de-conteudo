'use client';

import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { Search, Star, Filter, Clapperboard, Share2, FileText, Megaphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function VaultPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'content'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: (doc.data() as any).createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || 'Recent'
        }));
        setItems(docs);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'content');
      });
      return () => unsubscribe();
    } else {
      const captured = JSON.parse(localStorage.getItem('captured_content') || '[]');
      setTimeout(() => setItems(captured), 0);
    }
  }, [user]);

  const toggleFavorite = async (id: string | number) => {
    if (user) {
      try {
        const docRef = doc(db, 'content', id.toString());
        const item = items.find(i => i.id === id);
        await updateDoc(docRef, {
          isFavorite: !item.isFavorite,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `content/${id}`);
      }
    } else {
      const newItems = items.map(item => {
        if (item.id === id) {
          return { ...item, isFavorite: !item.isFavorite };
        }
        return item;
      });
      setItems(newItems);
      localStorage.setItem('captured_content', JSON.stringify(newItems));
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'Favoritos') return matchesSearch && item.isFavorite;
    if (activeFilter === 'Rascunhos') return matchesSearch && item.isDraft;
    return matchesSearch;
  });

  const filters = ['Todos', 'Rascunhos', 'Favoritos'];
  const tags = [
    { name: 'Reels', icon: Clapperboard },
    { name: 'LinkedIn', icon: Share2 },
    { name: 'Blog', icon: FileText },
    { name: 'Anúncios', icon: Megaphone },
  ];

  return (
    <div className="flex flex-col flex-1 pb-24">
      <header className="sticky top-0 z-20 bg-[#101e22]/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center p-4 justify-between w-full">
          <div className="flex size-10 items-center justify-center rounded-full hover:bg-slate-800 cursor-pointer">
            <Filter size={20} className="text-slate-400" />
          </div>
          <h1 className="text-slate-100 text-lg font-bold tracking-tight text-center">Minha Forja</h1>
          <div className="w-10" />
        </div>

        <div className="px-4 pb-4 w-full">
          <div className="flex w-full items-stretch rounded-xl h-12 bg-slate-800/50 border border-transparent focus-within:border-[#0db9f2]/50 transition-all">
            <div className="flex items-center justify-center pl-4">
              <Search size={20} className="text-slate-500" />
            </div>
            <input 
              className="w-full bg-transparent border-none focus:ring-0 text-slate-100 placeholder:text-slate-500 px-3 text-base" 
              placeholder="Pesquisar na forja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar w-full">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "flex h-9 shrink-0 items-center justify-center px-5 rounded-full text-sm font-semibold transition-all",
                activeFilter === f ? "bg-[#0db9f2] text-[#101e22] shadow-lg shadow-[#0db9f2]/20" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar w-full">
          {tags.map((tag) => {
            const Icon = tag.icon;
            return (
              <button
                key={tag.name}
                className="flex h-8 shrink-0 items-center justify-center gap-2 px-4 rounded-full border border-slate-800 bg-transparent text-slate-400 text-xs font-medium hover:border-slate-600 transition-colors"
              >
                <Icon size={14} />
                {tag.name}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="size-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600">
              <Search size={32} />
            </div>
            <div>
              <p className="text-slate-300 font-bold">Nenhum item encontrado</p>
              <p className="text-slate-500 text-sm">Capture novas ideias para começar sua forja.</p>
            </div>
          </div>
        ) : (
          filteredItems.map((idea) => (
            <div key={idea.id} className="bg-slate-800/40 rounded-2xl p-5 border border-slate-800 hover:border-[#0db9f2]/50 transition-all shadow-sm relative overflow-hidden group">
              {idea.isDraft && (
                <div className="absolute top-0 right-0">
                  <div className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/20">RASCUNHO</div>
                </div>
              )}
              <div className="flex justify-between items-start mb-2 mt-2">
                <h3 className="text-lg font-bold text-slate-100">{idea.title}</h3>
                <Star 
                  size={20} 
                  onClick={() => toggleFavorite(idea.id)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    idea.isFavorite ? "text-[#0db9f2] fill-[#0db9f2]" : "text-slate-600 hover:text-slate-400"
                  )} 
                />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
                {idea.content}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {(idea.tags || []).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                  {idea.type && (
                    <span className="px-2 py-0.5 rounded-md bg-[#0db9f2]/10 text-[#0db9f2] text-[10px] font-bold uppercase tracking-wider">
                      {idea.type}
                    </span>
                  )}
                </div>
                <span className="text-slate-500 text-xs">{idea.date}</span>
              </div>
            </div>
          ))
        )}
        
        <div className="h-4" />
      </main>

      <Navbar />
    </div>
  );
}
