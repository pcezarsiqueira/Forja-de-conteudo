import { Menu, User, AlertCircle, LogOut, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { useState } from 'react';
import { CreditsModal } from './CreditsModal';

export function Header() {
  const isApiKeyMissing = !process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const { user, profile, login, logout } = useAuth();
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-[#101e22]/80 backdrop-blur-md border-b border-slate-800">
      <div className="flex items-center justify-between p-4 w-full">
        <div className="flex items-center justify-center size-10 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors">
          <Menu size={20} className="text-slate-400" />
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold tracking-tight text-slate-100">Mindrop</h1>
          {isApiKeyMissing && (
            <div className="flex items-center gap-1 text-[8px] text-red-400 font-bold uppercase animate-pulse">
              <AlertCircle size={8} /> API KEY AUSENTE
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-slate-100">{profile?.displayName || user.displayName}</p>
                <div className="flex items-center gap-1 justify-end">
                  <p className="text-[8px] text-[#0db9f2] font-bold uppercase">{profile?.credits || 0} Créditos</p>
                  <button 
                    onClick={() => setIsCreditsModalOpen(true)}
                    className="text-[#0db9f2] hover:text-white transition-colors"
                  >
                    <PlusCircle size={10} />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => logout()}
                className="size-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut size={18} />
              </button>
              <div className="size-10 rounded-full bg-[#0db9f2]/10 border border-[#0db9f2]/20 overflow-hidden relative">
                {user.photoURL ? (
                  <Image 
                    src={user.photoURL} 
                    alt="User" 
                    fill 
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={20} className="text-[#0db9f2] m-auto mt-2" />
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => login()}
              className="px-4 py-2 bg-[#0db9f2] text-[#101e22] text-xs font-bold rounded-full hover:bg-[#0db9f2]/90 transition-all"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
      
      <CreditsModal 
        isOpen={isCreditsModalOpen} 
        onClose={() => setIsCreditsModalOpen(false)} 
      />
    </header>
  );
}
