'use client';

import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { LayoutGrid, TrendingUp, Sparkles, Star, ChevronRight, Merge, Target, Users, BarChart3, Tag, PlayCircle, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { classifyContent, criticalAnalysis, bulkClassify } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function ClassifyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCriticalProcessing, setIsCriticalProcessing] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [criticalResult, setCriticalResult] = useState<any>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New states for multi-select and classification metadata
  const [selectedForRefine, setSelectedForRefine] = useState<string[]>([]);
  const [itemMetadata, setItemMetadata] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'content'), where('uid', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cloudItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(cloudItems);
        
        // Build metadata map from cloud items
        const metadata: Record<string, any> = {};
        cloudItems.forEach((item: any) => {
          if (item.metadata) {
            metadata[item.id] = item.metadata;
          }
        });
        setItemMetadata(metadata);
      });
      return () => unsubscribe();
    } else {
      const captured = JSON.parse(localStorage.getItem('captured_content') || '[]');
      const classified = JSON.parse(localStorage.getItem('classified_metadata') || '{}');
      setItemMetadata(classified);
      
      const mockData = [
        { id: 'mock-1', title: 'IA no Marketing', content: 'Como usar IA para criar roteiros virais em segundos.', type: 'idea' },
        { id: 'mock-2', title: 'Minha primeira venda', content: 'A história de como fechei meu primeiro contrato de 10k.', type: 'story' },
      ];
      setItems([...captured, ...mockData]);
    }
  }, [user]);

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setAnalysis(null);
    setCriticalResult(null);
    
    // Initialize metadata for this item if not exists
    if (!itemMetadata[item.id]) {
      setItemMetadata(prev => ({
        ...prev,
        [item.id]: { format: 'Reels', tone: 'Sério', goal: 'Venda' }
      }));
    }
  };

  const updateMetadata = async (id: string, field: string, value: string) => {
    const currentMetadata = itemMetadata[id] || { format: 'Reels', tone: 'Sério', goal: 'Venda' };
    const newMetadata = {
      ...currentMetadata,
      [field]: value
    };

    if (user && !id.startsWith('mock-')) {
      try {
        const docRef = doc(db, 'content', id);
        await updateDoc(docRef, { metadata: newMetadata });
      } catch (err) {
        console.error("Error updating metadata in Firestore:", err);
      }
    } else {
      const updatedItemMetadata = {
        ...itemMetadata,
        [id]: newMetadata
      };
      setItemMetadata(updatedItemMetadata);
      localStorage.setItem('classified_metadata', JSON.stringify(updatedItemMetadata));
    }
  };

  const toggleRefineSelection = (id: string) => {
    setSelectedForRefine(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const advanceToRefine = () => {
    const selectedItems = items.filter(item => selectedForRefine.includes(item.id));
    const itemsToRefine = selectedItems.map(item => ({
      ...item,
      ...itemMetadata[item.id],
      funnel: bulkResult?.recommendations.find((r: any) => String(r.id) === String(item.id))?.funnel || 'Topo'
    }));
    
    localStorage.setItem('items_to_refine', JSON.stringify(itemsToRefine));
    router.push('/refine');
  };

  const advanceSingleItemToRefine = () => {
    if (!selectedItem) return;
    const itemsToRefine = JSON.parse(localStorage.getItem('items_to_refine') || '[]');
    
    const newItem = {
      ...selectedItem,
      ...(itemMetadata[selectedItem.id] || { format: 'Reels', tone: 'Sério', goal: 'Venda' }),
      funnel: analysis?.funnel || 'Topo'
    };
    
    const exists = itemsToRefine.find((i: any) => i.id === selectedItem.id);
    if (!exists) {
      localStorage.setItem('items_to_refine', JSON.stringify([...itemsToRefine, newItem]));
    }
    
    router.push('/refine');
  };

  const runAnalysis = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await classifyContent(selectedItem.content);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro na classificação estratégica.");
    } finally {
      setIsProcessing(false);
    }
  };

  const runCriticalAnalysis = async () => {
    if (!selectedItem) return;
    setIsCriticalProcessing(true);
    setError(null);
    try {
      const result = await criticalAnalysis(selectedItem.content);
      setCriticalResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro na análise crítica.");
    } finally {
      setIsCriticalProcessing(false);
    }
  };

  const runBulkClassify = async () => {
    if (items.length === 0) return;
    setIsBulkProcessing(true);
    setError(null);
    try {
      const result = await bulkClassify(items);
      setBulkResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro na classificação em massa.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-24">
      <Header />
      
      <main className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar">
        <section className="pt-2">
          <h2 className="text-2xl font-bold tracking-tight mb-1">Classificação</h2>
          <p className="text-slate-400 text-sm">Organização estratégica. S2 SEITON: Cada ideia em seu lugar.</p>
        </section>

        {!selectedItem ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aguardando Classificação</h3>
              {items.length > 0 && !bulkResult && !isBulkProcessing && (
                <button 
                  onClick={runBulkClassify}
                  className="text-[10px] font-bold text-[#0db9f2] bg-[#0db9f2]/10 px-3 py-1.5 rounded-lg border border-[#0db9f2]/20 hover:bg-[#0db9f2]/20 transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={12} />
                  Classificar Toda a Forja
                </button>
              )}
            </div>

            {isBulkProcessing && (
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 border-dashed flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0db9f2]"></div>
                <p className="text-xs text-slate-400 animate-pulse">IA analisando todo o seu baú estratégico...</p>
              </div>
            )}

            {bulkResult && (
              <div className="p-4 bg-[#0db9f2]/5 rounded-xl border border-[#0db9f2]/20 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-[#0db9f2]" />
                  <p className="text-[10px] font-bold text-[#0db9f2] uppercase">Resumo Estratégico</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{bulkResult.summary}</p>
              </div>
            )}

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="size-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600">
                    <LayoutGrid size={32} />
                  </div>
                  <div>
                    <p className="text-slate-300 font-bold">Nenhum item para classificar</p>
                    <p className="text-slate-500 text-sm">Capture ideias primeiro para organizá-las aqui.</p>
                  </div>
                  <Link href="/new">
                    <button className="bg-[#0db9f2]/10 text-[#0db9f2] px-6 py-2 rounded-full font-bold text-sm border border-[#0db9f2]/20">
                      Capturar Agora
                    </button>
                  </Link>
                </div>
              ) : (
                items.map((item) => {
                  const recommendation = bulkResult?.recommendations.find((r: any) => String(r.id) === String(item.id));
                  const isSelected = selectedForRefine.includes(item.id);
                  
                  return (
                    <div key={item.id} className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleRefineSelection(item.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isSelected ? "text-[#0db9f2] bg-[#0db9f2]/10" : "text-slate-600 hover:text-slate-400"
                        )}
                      >
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                      <button
                        onClick={() => handleSelectItem(item)}
                        className={cn(
                          "flex-1 flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border transition-all text-left group min-w-0 overflow-hidden",
                          recommendation?.readyToRecord 
                            ? "border-[#0db9f2]/40 bg-[#0db9f2]/5" 
                            : "border-slate-800 hover:border-[#0db9f2]/50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-100 truncate max-w-[140px]">{item.title}</h4>
                            {recommendation?.readyToRecord && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded border border-emerald-500/20 uppercase whitespace-nowrap">
                                <PlayCircle size={10} />
                                Pronto
                              </span>
                            )}
                            {recommendation?.funnel && (
                              <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[9px] font-bold rounded uppercase whitespace-nowrap">
                                {recommendation.funnel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate pr-4 block">
                            {recommendation?.readyToRecord 
                              ? recommendation.reason 
                              : item.content}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-slate-600 group-hover:text-[#0db9f2] transition-colors flex-shrink-0" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {selectedForRefine.length > 0 && (
              <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4">
                <button 
                  onClick={advanceToRefine}
                  className="w-full py-4 bg-[#0db9f2] text-[#101e22] font-bold rounded-xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Sparkles size={20} />
                  Avançar para Refinar ({selectedForRefine.length})
                </button>
              </div>
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

            <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden">
              <h3 className="text-xl font-bold text-white mb-2 break-words">{selectedItem.title}</h3>
              <p className="text-slate-400 text-sm italic break-words">&quot;{selectedItem.content}&quot;</p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={18} />
                <p>{error}</p>
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0db9f2]">Classificação Manual</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 ml-1">Formato</label>
                  <select 
                    value={itemMetadata[selectedItem.id]?.format || 'Reels'}
                    onChange={(e) => updateMetadata(selectedItem.id, 'format', e.target.value)}
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-700 p-3 text-sm focus:ring-[#0db9f2] focus:border-[#0db9f2] outline-none text-slate-100"
                  >
                    <option>Reels</option>
                    <option>TikTok</option>
                    <option>Post Estático</option>
                    <option>YouTube Shorts</option>
                    <option>Thread (X)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 ml-1">Tom de Voz</label>
                    <select 
                      value={itemMetadata[selectedItem.id]?.tone || 'Sério'}
                      onChange={(e) => updateMetadata(selectedItem.id, 'tone', e.target.value)}
                      className="w-full rounded-xl bg-slate-800/60 border border-slate-700 p-3 text-sm focus:ring-[#0db9f2] focus:border-[#0db9f2] outline-none text-slate-100"
                    >
                      <option>Sério</option>
                      <option>Didático</option>
                      <option>Descontraído</option>
                      <option>Inspirador</option>
                      <option>Sarcástico</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 ml-1">Objetivo</label>
                    <select 
                      value={itemMetadata[selectedItem.id]?.goal || 'Venda'}
                      onChange={(e) => updateMetadata(selectedItem.id, 'goal', e.target.value)}
                      className="w-full rounded-xl bg-slate-800/60 border border-slate-700 p-3 text-sm focus:ring-[#0db9f2] focus:border-[#0db9f2] outline-none text-slate-100"
                    >
                      <option>Venda</option>
                      <option>Conexão</option>
                      <option>Autoridade</option>
                      <option>Entretenimento</option>
                      <option>Educação</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {!analysis && !isProcessing && !criticalResult && !isCriticalProcessing && (
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={runAnalysis}
                  className="w-full py-4 bg-[#0db9f2] text-[#101e22] font-bold rounded-xl shadow-lg shadow-[#0db9f2]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Realizar Classificação Estratégica
                </button>
                <button 
                  onClick={runCriticalAnalysis}
                  className="w-full py-4 bg-slate-700 text-white font-bold rounded-xl border border-slate-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Target size={20} className="text-[#0db9f2]" />
                  Realizar Classificação Crítica
                </button>
              </div>
            )}

            {isCriticalProcessing && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0db9f2]"></div>
                <p className="text-slate-400 text-sm animate-pulse">IA realizando análise crítica (Nicho, Mercado...)</p>
              </div>
            )}

            {criticalResult && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag size={16} className="text-[#0db9f2]" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Assunto</p>
                    </div>
                    <p className="text-sm text-slate-200">{criticalResult.subject}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Users size={16} className="text-[#0db9f2]" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Nicho</p>
                      </div>
                      <p className="text-sm text-slate-200">{criticalResult.niche}</p>
                    </div>
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 size={16} className="text-[#0db9f2]" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Mercado</p>
                      </div>
                      <p className="text-sm text-slate-200">{criticalResult.market}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-[#0db9f2]" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Temas Relacionados</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {criticalResult.themes.map((theme: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-[#0db9f2]/10 text-[#0db9f2] text-[10px] font-bold rounded-md border border-[#0db9f2]/20">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {!analysis && !isProcessing && (
                  <button 
                    onClick={runAnalysis}
                    className="w-full py-4 bg-[#0db9f2] text-[#101e22] font-bold rounded-xl shadow-lg shadow-[#0db9f2]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={20} />
                    Agora Realizar Classificação Estratégica
                  </button>
                )}
              </div>
            )}

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0db9f2]"></div>
                <p className="text-slate-400 text-sm animate-pulse">IA analisando funil e viralização...</p>
              </div>
            ) : analysis && (
              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Posição no Funil</p>
                      <div className="flex items-center gap-2">
                        <LayoutGrid size={16} className="text-[#0db9f2]" />
                        <span className="text-lg font-bold text-white">{analysis.funnel}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Conteúdo</p>
                      <div className="flex items-center gap-2">
                        <Target size={16} className="text-amber-400" />
                        <span className="text-lg font-bold text-white">{analysis.contentType || 'Semente'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Viral Score</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-400" />
                      <span className="text-lg font-bold text-white">{analysis.viralScore}%</span>
                    </div>
                  </div>

                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Análise de Viralização</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{analysis.viralAnalysis}</p>
                </div>

                <div className="p-4 bg-[#0db9f2]/5 rounded-xl border border-[#0db9f2]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Merge size={16} className="text-[#0db9f2]" />
                    <p className="text-[10px] font-bold text-[#0db9f2] uppercase">Sugestão de Combinação</p>
                  </div>
                  <p className="text-sm text-slate-300 italic">&quot;{analysis.mergeSuggestion}&quot;</p>
                </div>

                <button 
                  onClick={advanceSingleItemToRefine}
                  className="w-full py-4 bg-[#0db9f2] text-[#101e22] font-bold rounded-xl shadow-lg shadow-[#0db9f2]/20 active:scale-[0.98] transition-all"
                >
                  Confirmar e Avançar para Refinamento
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
