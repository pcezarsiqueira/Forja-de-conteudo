'use client';

import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { Video, Clock, Youtube, Smartphone, ChevronRight, Copy, Check, Sparkles, Wand2, CheckCircle2, Smile, Edit3, Image as ImageIcon, Film, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateScripts, generateFullScript, generateVisualHook, generateStoryboard } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';

export default function ProducePage() {
  const router = useRouter();
  const { user, consumeCredits, profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingFull, setIsGeneratingFull] = useState(false);
  const [scripts, setScripts] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'short' | 'medium' | 'long' | 'youtube'>('short');
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [fullAIScript, setFullAIScript] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [humorStyle, setHumorStyle] = useState('Sério');
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [visualHooks, setVisualHooks] = useState<any>(null);
  const [storyboard, setStoryboard] = useState<any>(null);
  const [editedScript, setEditedScript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'content'), where('uid', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cloudItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter items that have refinement analysis
        const refinedItems = cloudItems.filter((item: any) => item.refinementAnalysis);
        setItems(refinedItems);
      });
      return () => unsubscribe();
    } else {
      const itemsToProduce = JSON.parse(localStorage.getItem('items_to_produce') || '[]');
      const captured = JSON.parse(localStorage.getItem('captured_content') || '[]');
      
      if (itemsToProduce.length > 0) {
        setItems(itemsToProduce);
      } else {
        const mockData = [
          { id: 'mock-1', title: 'IA no Marketing', content: 'IA para criar roteiros virais em segundos. Foco em produtividade e escala.', funnel: 'Topo' },
        ];
        setItems([...captured, ...mockData]);
      }
    }
  }, [user]);

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setScripts(null);
    setFullAIScript(null);
    setSelectedHook(null);
    setError(null);
  };

  const runProduction = async () => {
    if (!selectedItem) return;

    // Credit check
    if (user && profile && profile.credits < 1) {
      setError("Você não possui créditos suficientes para gerar roteiros.");
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

      const result = await generateScripts(selectedItem.content, humorStyle);
      setScripts(result);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Erro ao gerar roteiros. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const runFullScriptGeneration = async () => {
    if (!selectedItem || !selectedHook) return;

    // Credit check
    if (user && profile && profile.credits < 1) {
      setError("Você não possui créditos suficientes para gerar o roteiro completo.");
      return;
    }

    setIsGeneratingFull(true);
    setError(null);
    try {
      // Consume credit first if user is logged in
      if (user) {
        const success = await consumeCredits(1);
        if (!success) {
          setError("Erro ao processar créditos. Verifique seu saldo.");
          setIsGeneratingFull(false);
          return;
        }
      }

      const result = await generateFullScript(selectedItem.content, selectedHook, activeTab, humorStyle);
      setFullAIScript(result);
      setEditedScript(result.fullScript);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Erro ao gerar roteiro completo.");
    } finally {
      setIsGeneratingFull(false);
    }
  };

  const runVisualHookGeneration = async () => {
    const script = editedScript || fullAIScript?.fullScript || scripts[activeTab].steps.join('\n');

    // Credit check
    if (user && profile && profile.credits < 1) {
      setError("Você não possui créditos suficientes para gerar o gancho visual.");
      return;
    }

    setIsGeneratingVisual(true);
    setError(null);
    try {
      // Consume credit first if user is logged in
      if (user) {
        const success = await consumeCredits(1);
        if (!success) {
          setError("Erro ao processar créditos.");
          setIsGeneratingVisual(false);
          return;
        }
      }

      const result = await generateVisualHook(script);
      setVisualHooks(result);
    } catch (error: any) {
      console.error(error);
      setError("Erro ao gerar gancho visual.");
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  const runStoryboardGeneration = async () => {
    const script = editedScript || fullAIScript?.fullScript || scripts[activeTab].steps.join('\n');

    // Credit check
    if (user && profile && profile.credits < 1) {
      setError("Você não possui créditos suficientes para gerar o storyboard.");
      return;
    }

    setIsGeneratingStoryboard(true);
    setError(null);
    try {
      // Consume credit first if user is logged in
      if (user) {
        const success = await consumeCredits(1);
        if (!success) {
          setError("Erro ao processar créditos.");
          setIsGeneratingStoryboard(false);
          return;
        }
      }

      const result = await generateStoryboard(script);
      setStoryboard(result);
    } catch (error: any) {
      console.error(error);
      setError("Erro ao gerar storyboard.");
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    
    const ritualData = {
      contentId: selectedItem.id,
      title: selectedItem.title,
      content: selectedItem.content,
      script: editedScript || fullAIScript?.fullScript || scripts[activeTab].steps.join('\n'),
      hook: selectedHook,
      format: activeTab,
      humorStyle,
      visualHooks: visualHooks || null,
      storyboard: storyboard || null,
      approvedAt: new Date().toISOString(),
      status: 'pending'
    };

    if (user && !selectedItem.id.startsWith('mock-')) {
      try {
        const ritualsRef = collection(db, 'rituals');
        await addDoc(ritualsRef, {
          ...ritualData,
          uid: user.uid
        });
        router.push('/ritual');
      } catch (error) {
        console.error("Error saving ritual to Firestore:", error);
      }
    } else {
      const ritualItems = JSON.parse(localStorage.getItem('ritual_items') || '[]');
      localStorage.setItem('ritual_items', JSON.stringify([{ ...ritualData, id: Date.now().toString() }, ...ritualItems]));
      router.push('/ritual');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 pb-24">
      <Header />
      
      <main className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar">
        <section className="pt-2">
          <h2 className="text-2xl font-bold tracking-tight mb-1">S4 SEIKETSU</h2>
          <p className="text-slate-400 text-sm">Padronização e Produção. Transformando estratégia em roteiro.</p>
        </section>

        {!selectedItem ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Escolha uma Ideia Refinada</h3>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="size-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600">
                  <Video size={32} />
                </div>
                <div>
                  <p className="text-slate-300 font-bold">Nenhum item para produzir</p>
                  <p className="text-slate-500 text-sm">Refine suas ideias primeiro para criar roteiros aqui.</p>
                </div>
                <Link href="/refine">
                  <button className="bg-[#0db9f2]/10 text-[#0db9f2] px-6 py-2 rounded-full font-bold text-sm border border-[#0db9f2]/20">
                    Ir para Refinamento
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
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase">Refinado</span>
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
              onClick={() => {setSelectedItem(null); setScripts(null); setFullAIScript(null); setSelectedHook(null);}}
              className="text-xs font-bold text-[#0db9f2] uppercase tracking-widest flex items-center gap-1"
            >
              ← Voltar para lista
            </button>

            {!scripts && !isProcessing && (
              <div className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle size={18} />
                    <p>{error}</p>
                  </div>
                )}
                <section className="p-6 bg-[#1a2b30] rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-[10px] font-bold text-[#0db9f2] uppercase tracking-widest flex items-center gap-2">
                    <Smile size={14} />
                    Estilo de Humor / Tom
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Sério', 'Sarcástico', 'Humorado', 'Quebra de Padrão', 'Intelectual', 'Educacional'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setHumorStyle(style)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          humorStyle === style 
                            ? "bg-[#0db9f2]/20 border-[#0db9f2] text-[#0db9f2]" 
                            : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </section>

                <button 
                  onClick={runProduction}
                  className="w-full py-4 bg-[#0db9f2] text-[#101e22] font-bold rounded-xl shadow-lg shadow-[#0db9f2]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Gerar Estrutura de Roteiro
                </button>
              </div>
            )}

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0db9f2]"></div>
                <p className="text-slate-400 text-sm animate-pulse">IA criando roteiros multiformato...</p>
              </div>
            ) : scripts && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => {setScripts(null); setFullAIScript(null); setSelectedHook(null);}}
                    className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"
                  >
                    ← Voltar aos formatos
                  </button>
                  <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <span className="text-[10px] font-bold text-orange-400 uppercase">Conteúdo: {activeTab.toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {[
                    { id: 'short', label: 'Curto (7s)', icon: Clock },
                    { id: 'medium', label: 'Médio (20-35s)', icon: Smartphone },
                    { id: 'long', label: 'Longo (60s)', icon: Video },
                    { id: 'youtube', label: 'YouTube', icon: Youtube },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {setActiveTab(tab.id as any); setFullAIScript(null); setSelectedHook(null);}}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                          activeTab === tab.id ? "bg-[#0db9f2] text-[#101e22]" : "bg-slate-800 text-slate-400"
                        )}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                      <AlertCircle size={18} />
                      <p>{error}</p>
                    </div>
                  )}
                  <section className="p-6 bg-[#1a2b30] rounded-3xl border border-slate-800 space-y-4">
                    <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">1. Escolha um Gancho Magnético</h3>
                    <div className="space-y-3">
                      {scripts[activeTab].hooks.map((hook: string, i: number) => (
                        <button 
                          key={i} 
                          onClick={() => setSelectedHook(hook)}
                          className={cn(
                            "w-full p-4 rounded-xl border transition-all text-left italic text-sm",
                            selectedHook === hook 
                              ? "bg-[#0db9f2]/10 border-[#0db9f2] text-[#0db9f2]" 
                              : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500"
                          )}
                        >
                          &quot;{hook}&quot;
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="p-6 bg-[#1a2b30] rounded-3xl border border-slate-800 space-y-4">
                    <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">2. Estrutura do Conteúdo</h3>
                    <div className="space-y-4">
                      {scripts[activeTab].steps.map((step: string, i: number) => (
                        <div key={i} className="flex gap-4">
                          <div className="size-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#101e22]">
                            {i + 1}
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {selectedHook && !fullAIScript && (
                    <button 
                      onClick={runFullScriptGeneration}
                      disabled={isGeneratingFull}
                      className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {isGeneratingFull ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Wand2 size={20} />
                          Gerar Roteiro Completo com IA
                        </>
                      )}
                    </button>
                  )}

                  {fullAIScript && (
                    <section className="p-6 bg-[#1a2b30] rounded-3xl border border-emerald-500/30 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Roteiro Finalizado pela IA</h3>
                          <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase">{humorStyle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => copyToClipboard(editedScript)}
                            className="text-slate-400 hover:text-white"
                          >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                        <textarea 
                          value={editedScript}
                          onChange={(e) => setEditedScript(e.target.value)}
                          className="w-full h-64 bg-transparent p-4 text-sm text-slate-100 leading-relaxed outline-none focus:bg-slate-900/40 transition-colors no-scrollbar resize-none"
                        />
                      </div>
                      <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                        <p className="text-[8px] font-bold text-emerald-500/60 uppercase mb-1">Notas de Produção</p>
                        <p className="text-xs text-slate-400 italic">{fullAIScript.productionNotes}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                          onClick={runVisualHookGeneration}
                          disabled={isGeneratingVisual}
                          className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
                        >
                          {isGeneratingVisual ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <ImageIcon size={14} />}
                          Gancho Visual
                        </button>
                        <button 
                          onClick={runStoryboardGeneration}
                          disabled={isGeneratingStoryboard}
                          className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
                        >
                          {isGeneratingStoryboard ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Film size={14} />}
                          Storyboard
                        </button>
                      </div>

                      {visualHooks && (
                        <div className="space-y-3 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                          <h4 className="text-[10px] font-bold text-[#0db9f2] uppercase tracking-widest">Sugestões de Ganchos Visuais</h4>
                          <div className="space-y-2">
                            {visualHooks.visualHooks.map((vh: any, i: number) => (
                              <div key={i} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                <p className="text-xs font-bold text-slate-200 mb-1">{vh.title}</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{vh.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {storyboard && (
                        <div className="space-y-3 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                          <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Storyboard Viciante</h4>
                          <div className="space-y-3">
                            {storyboard.scenes.map((scene: any, i: number) => (
                              <div key={i} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[8px] font-bold text-amber-400/60 uppercase">Cena {i + 1} • {scene.time}</span>
                                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{scene.edit}</span>
                                </div>
                                <p className="text-[10px] text-slate-200"><span className="text-slate-500 font-bold uppercase text-[8px] mr-1">Ação:</span> {scene.action}</p>
                                <p className="text-[10px] text-slate-400 italic"><span className="text-slate-500 font-bold uppercase text-[8px] mr-1">Áudio:</span> &quot;{scene.audio}&quot;</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  <section className="p-6 bg-[#1a2b30] rounded-3xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajustes e Incrementos</h3>
                      <span className="text-[8px] text-slate-600 uppercase">Personalize seu roteiro</span>
                    </div>
                    <textarea 
                      className="w-full h-32 bg-slate-900/50 rounded-2xl border border-slate-700 p-4 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-orange-500/50 transition-colors"
                      placeholder="Adicione algum detalhe pessoal ou ajuste uma frase..."
                    />
                  </section>
                </div>

                <button 
                  onClick={handleApprove}
                  className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Aprovar para Gravar (Ir para Ritual)
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
