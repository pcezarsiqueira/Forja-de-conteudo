'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Zap, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CREDIT_PACKS = [
  { id: 'pack-1', credits: 50, price: 29.90, description: 'Ideal para começar' },
  { id: 'pack-2', credits: 150, price: 79.90, description: 'Mais popular', popular: true },
  { id: 'pack-3', credits: 500, price: 199.90, description: 'Melhor valor' },
];

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (pack: typeof CREDIT_PACKS[0]) => {
    if (!user) return;
    setLoading(pack.id);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          amount: pack.price,
          credits: pack.credits
        }),
      });

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || 'Erro ao criar checkout');
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      alert('Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-[#101e22] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Recarregar Créditos</h2>
                <p className="text-xs text-slate-400">Escolha o melhor pacote para você</p>
              </div>
              <button 
                onClick={onClose}
                className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {CREDIT_PACKS.map((pack) => (
                <div 
                  key={pack.id}
                  className={`relative p-4 rounded-2xl border transition-all ${
                    pack.popular 
                      ? 'bg-[#0db9f2]/5 border-[#0db9f2]/30' 
                      : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 right-4 px-2 py-1 bg-[#0db9f2] text-[#101e22] text-[10px] font-bold rounded-full uppercase">
                      Mais Popular
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-[#0db9f2]/20 flex items-center justify-center text-[#0db9f2]">
                        <Zap size={16} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-100">{pack.credits} Créditos</p>
                        <p className="text-[10px] text-slate-400">{pack.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0db9f2]">R$ {pack.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(pack)}
                    disabled={loading !== null}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      pack.popular
                        ? 'bg-[#0db9f2] text-[#101e22] hover:bg-[#0db9f2]/90'
                        : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                    }`}
                  >
                    {loading === pack.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Comprar Agora
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-800/50 border-t border-slate-800">
              <div className="flex items-start gap-3">
                <div className="size-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                  <Check size={12} />
                </div>
                <p className="text-[10px] text-slate-400">
                  Pagamento processado de forma segura pelo Mercado Pago. Seus créditos serão adicionados instantaneamente após a aprovação.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
