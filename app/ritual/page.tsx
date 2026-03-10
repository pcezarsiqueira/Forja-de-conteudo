'use client';

import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { BarChart3, TrendingUp, Users, Eye, MessageCircle, Save, ChevronRight, Check, Sparkles, Mic } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function RitualPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [results, setResults] = useState({
    views: '',
    engagement: '',
    comments: '',
    notes: ''
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'rituals'), where('uid', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cloudRituals = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(cloudRituals);
      });
      return () => unsubscribe();
    } else {
      const ritualItems = JSON.parse(localStorage.getItem('ritual_items') || '[]');
      setTimeout(() => {
        if (ritualItems.length > 0) {
          setItems(ritualItems);
        } else {
          const mockData = [
            { id: 'mock-1', title: 'IA no Marketing', content: 'Roteiro de 20s para Reels sobre produtividade.', approvedAt: new Date().toISOString() },
          ];
          setItems(mockData);
        }
      }, 0);
    }
  }, [user]);

  const handleSaveResults = async () => {
    if (!selectedItem) return;
    setIsSaved(true);

    if (user && !selectedItem.id.startsWith('mock-')) {
      try {
        const docRef = doc(db, 'rituals', selectedItem.id);
        await updateDoc(docRef, {
          results: {
            views: results.views,
            engagement: results.engagement,
            comments: results.comments,
            notes: results.notes
          },
          status: 'completed',
          completedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error saving ritual results to Firestore:", error);
      }
    }

    setTimeout(() => {
      setIsSaved(false);
      setSelectedItem(null);
      setResults({ views: '', engagement: '', comments: '', notes: '' });
    }, 2000);
  };

  return (
    <div className="flex flex-col flex-1 pb-24">
      <Header />
      
      <main className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar">
        <section className="pt-2">
          <h2 className="text-2xl font-bold tracking-tight mb-1">S5 SHITSUKE</h2>
          <p className="text-slate-400 text-sm">Consistência sem Esforço. O hábito que alimenta sua autoridade.</p>
        </section>

        {!selectedItem ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="p-6 bg-[#1a2b30] rounded-3xl border border-slate-800 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-amber-400 rounded-full" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Mapa de Frequência de Fluxo</h3>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 21 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "aspect-square rounded-lg border flex items-center justify-center transition-all",
                        i < 14 ? "bg-amber-400/10 border-amber-400/20" : "bg-slate-900/50 border-slate-800"
                      )}
                    >
                      {i < 14 && <div className="size-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" />}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">14</p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Dias de Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#0db9f2]">92%</p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Engajamento IA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">03</p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Sementes/Dia</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aguardando Gravação / Ritual</h3>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                    <div className="size-12 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600">
                      <Mic size={24} />
                    </div>
                    <div>
                      <p className="text-slate-300 font-bold text-sm">Nenhum item para gravação</p>
                      <p className="text-slate-500 text-[10px]">Produza roteiros primeiro para realizar o ritual aqui.</p>
                    </div>
                    <Link href="/produce">
                      <button className="bg-[#0db9f2]/10 text-[#0db9f2] px-4 py-1.5 rounded-full font-bold text-[10px] border border-[#0db9f2]/20">
                        Ir para Produção
                      </button>
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-[#0db9f2]/50 transition-all text-left"
                    >
                      <div>
                        <h4 className="font-bold text-slate-100">{item.title}</h4>
                        <p className="text-xs text-slate-500 truncate w-48">{item.content}</p>
                        <p className="text-[10px] text-[#0db9f2] font-bold mt-1 uppercase">Aprovado em {new Date(item.approvedAt).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight size={18} className="text-slate-600" />
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl space-y-6 text-[#101e22]">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold italic">Mindrop OS</h3>
                  <p className="text-xs font-medium opacity-80">
                    &quot;Consistência não é sobre postar todo dia, é sobre nunca deixar sua mente parar de processar o mundo.&quot;
                  </p>
                </div>
                <div className="pt-4 border-t border-[#101e22]/10 flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Ritual de Manutenção</p>
                  <p className="text-[10px] font-bold opacity-60">V 1.2</p>
                </div>
              </div>

              <div className="p-6 bg-[#1a2b30] rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Checklist do Dia</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Capture 3 Sementes (S1)', done: true },
                    { label: 'Classifique no Board (S2)', done: true },
                    { label: 'Roteirize 1 Peça (S4)', done: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn(
                        "size-5 rounded-md border flex items-center justify-center transition-colors",
                        item.done ? "bg-[#0db9f2] border-[#0db9f2]" : "border-slate-700"
                      )}>
                        {item.done && <Check size={12} className="text-[#101e22]" />}
                      </div>
                      <span className={cn("text-xs font-medium", item.done ? "text-slate-200" : "text-slate-500")}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setSelectedItem(null)}
              className="text-xs font-bold text-[#0db9f2] uppercase tracking-widest flex items-center gap-1"
            >
              ← Voltar para o Ritual
            </button>

            <div className="p-6 bg-[#1a2b30] rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-white mb-1">{selectedItem.title}</h3>
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedItem.script}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                    <Eye size={12} /> Visualizações
                  </label>
                  <input 
                    type="number"
                    value={results.views}
                    onChange={(e) => setResults({...results, views: e.target.value})}
                    placeholder="Ex: 1500"
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-white focus:ring-2 focus:ring-[#0db9f2] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                    <TrendingUp size={12} /> Engajamento %
                  </label>
                  <input 
                    type="number"
                    value={results.engagement}
                    onChange={(e) => setResults({...results, engagement: e.target.value})}
                    placeholder="Ex: 8.5"
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-white focus:ring-2 focus:ring-[#0db9f2] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                  <MessageCircle size={12} /> Comentários Relevantes
                </label>
                <textarea 
                  value={results.comments}
                  onChange={(e) => setResults({...results, comments: e.target.value})}
                  placeholder="Quais foram as principais reações?"
                  className="w-full bg-slate-800 border-none rounded-xl p-3 text-white focus:ring-2 focus:ring-[#0db9f2] outline-none h-24 resize-none"
                />
              </div>

              <button 
                onClick={handleSaveResults}
                disabled={isSaved}
                className={cn(
                  "w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2",
                  isSaved ? "bg-emerald-500 text-white" : "bg-[#0db9f2] text-[#101e22] active:scale-[0.98]"
                )}
              >
                {isSaved ? (
                  <>✓ Ritual Concluído</>
                ) : (
                  <>
                    <Save size={20} />
                    Finalizar Ciclo de Conteúdo
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}
