'use client';

import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { Sparkles, CheckCircle2, AlertCircle, Wand2, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { evaluateForScript } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function RefinePage() {
  const router = useRouter();
  const { user, consumeCredits, profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'content'), where('uid', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cloudItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter items that have metadata (classified)
        const classifiedItems = cloudItems.filter((item: any) => item.metadata);
        setItems(classifiedItems);
      });
      return () => unsubscribe();
    } else {
      const itemsToRefine = JSON.parse(localStorage.getItem('items_to_refine') || '[]');
      const captured = JSON.parse(localStorage.getItem('captured_content') || '[]');
      
      if (itemsToRefine.length > 0) {
        setItems(itemsToRefine);
      } else {
        const mockData = [
          { id: 'mock-1', title: 'IA no Marketing', content: 'Como usar IA para criar roteiros virais em segundos.', funnel: 'Topo' },
        ];
        setItems([...captured, ...mockData]);
      }
    }
  }, [user]);

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setAnalysis(item.refinementAnalysis || null);
    setError(null);
  };

  const runRefinement = async () => {
    if (!selectedItem) return;

    // Credit check
    if (user && profile && profile.credits < 1) {
      setError("Você não possui créditos suficientes para realizar esta análise.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      // Consume credit first if user is logged in
      if (user) {
        const success = await consumeCredits(1);
        if (!success) {
          setError("Erro ao processar créditos. Verifique seu saldo.");
          setIsProcessing(false);
          return;
        }
      }

      const result = await evaluateForScript(selectedItem.content);
      if (user && !selectedItem.id.startsWith('mock-')) {
        const docRef = doc(db, 'content', selectedItem.id);
        await updateDoc(docRef, { refinementAnalysis: result });
      }
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao processar refinamento. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const advanceToProduce = () => {
    if (!selectedItem || !analysis) return;
    const itemsToProduce = JSON.parse(localStorage.getItem('items_to_produce') || '[]');
    
    // Check if already exists to avoid duplicates
    const exists = itemsToProduce.find((i: any) => i.id === selectedItem.id);
    if (exists) {
      router.push('/produce');
      return;
    }

    const newItem = {
      ...selectedItem,
      content: analysis.refinedContent,
      originalContent: selectedItem.content,
      refinementAnalysis: analysis
    };
    
    localStorage.setItem('items_to_produce', JSON.stringify([...itemsToProduce, newItem]));
    router.push('/produce');
  };

  return (
    <div className="flex flex-col flex-1 pb-24">
      <Header />
      
      <main className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar">
        <section className="pt-2">
          <h2 className="text-2xl font-bold tracking-tight mb-1">Refinamento</h2>
          <p className="text-slate-400 text-sm">Limpeza e polimento. S3 SEISO: Clareza e impacto.</p>
        </section>

        {!selectedItem ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prontos para Refinar</h3>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="size-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600">
                  <Sparkles size={32} />
                </div>
                <div>
                  <p className="text-slate-300 font-bold">Nenhum item para refinar</p>
                  <p className="text-slate-500 text-sm">Classifique ideias primeiro para refiná-las aqui.</p>
                </div>
                <Link href="/classify">
                  <button className="bg-[#0db9f2]/10 text-[#0db9f2] px-6 py-2 rounded-full font-bold text-sm border border-[#0db9f2]/20">
                    Ir para Classificação
                  </button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="w-full flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-[#0db9f2]/50 transition-all text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-100">{item.title}</h4>
                      <span className="text-[8px] bg-[#0db9f2]/20 text-[#0db9f2] px-1.5 py-0.5 rounded-full font-bold uppercase">{item.funnel}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate w-48">{item.content}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-600" />
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => {setSelectedItem(null); setAnalysis(null);}}
              className="text-xs font-bold text-[#0db9f2] uppercase tracking-widest flex items-center gap-1"
            >
              ← Voltar para lista
            </button>

            {!analysis && !isProcessing && (
              <div className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle size={18} />
                    <p>{error}</p>
                  </div>
                )}
                <button 
                  onClick={runRefinement}
                  className="w-full py-4 bg-[#0db9f2] text-[#101e22] font-bold rounded-xl shadow-lg shadow-[#0db9f2]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Realizar Refinamento de Conteúdo
                </button>
              </div>
            )}

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0db9f2]"></div>
                <p className="text-slate-400 text-sm animate-pulse">IA realizando a &quot;limpeza&quot; do conteúdo...</p>
              </div>
            ) : analysis && (
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">S3 SEISO</h3>
                      <p className="text-xs text-slate-400">Limpar ruído. Trocar achismo por clareza estratégica.</p>
                    </div>
                    <button 
                      onClick={runRefinement}
                      className="bg-[#0db9f2] text-[#101e22] px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2"
                    >
                      Iniciar Varredura IA <Sparkles size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-[#1a2b30] rounded-3xl border border-slate-800 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-[#0db9f2] uppercase tracking-widest mb-2">
                          {analysis?.clarity?.title || 'Análise de Clareza'}
                        </p>
                      </div>
                      <div className="relative size-16 flex-shrink-0">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800" strokeWidth="3" />
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#0db9f2]" strokeWidth="3" strokeDasharray={`${analysis?.clarity?.score || 0}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-white leading-none">{analysis?.clarity?.score || 0}</span>
                          <span className="text-[8px] text-slate-500 uppercase font-bold">Score</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {analysis?.clarity?.analysis || 'Aguardando análise...'}
                    </p>
                  </div>

                  <div className="p-6 bg-[#1a2b30] rounded-3xl border border-slate-800 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">
                          {analysis?.psychology?.title || 'Maturidade Psicológica'}
                        </p>
                      </div>
                      <div className="relative size-16 flex-shrink-0">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800" strokeWidth="3" />
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-amber-400" strokeWidth="3" strokeDasharray={`${analysis?.psychology?.score || 0}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-white leading-none">{analysis?.psychology?.score || 0}</span>
                          <span className="text-[8px] text-slate-500 uppercase font-bold">Score</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {analysis?.psychology?.analysis || 'Aguardando análise...'}
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-slate-800/60 rounded-2xl border border-[#0db9f2]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 size={16} className="text-[#0db9f2]" />
                    <p className="text-[10px] font-bold text-[#0db9f2] uppercase tracking-widest">Conteúdo Refinado</p>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed italic">&quot;{analysis?.refinedContent || 'Processando...'}&quot;</p>
                </div>

                <button 
                  onClick={advanceToProduce}
                  className="w-full py-4 bg-[#0db9f2] text-[#101e22] font-bold rounded-xl shadow-lg shadow-[#0db9f2]/20 active:scale-[0.98] transition-all"
                >
                  Avançar para Produção de Roteiro
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}
