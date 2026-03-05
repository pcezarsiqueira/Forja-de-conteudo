'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mic, Save, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { classifyContent } from '@/lib/gemini';
import { useAuth } from '@/hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function NewIdeaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'idea';
  const { user, login } = useAuth();

  const [inputMethod, setInputMethod] = useState<'audio' | 'text'>('audio');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const preRecordingContentRef = useRef('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(11).fill(2));
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }
      
      recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'pt-BR';

        recognitionRef.current.onresult = (event: any) => {
          let sessionTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              preRecordingContentRef.current += (preRecordingContentRef.current ? ' ' : '') + event.results[i][0].transcript;
            } else {
              sessionTranscript += event.results[i][0].transcript;
            }
          }
          setContent(preRecordingContentRef.current + (sessionTranscript ? (preRecordingContentRef.current ? ' ' : '') + sessionTranscript : ''));
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
            alert('Permissão de microfone negada. Por favor, habilite o acesso.');
          }
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          if (isRecordingRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 32;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map frequency data to our 11 bars
        const newLevels = Array.from({ length: 11 }, (_, i) => {
          const val = dataArray[i % bufferLength];
          return Math.max(2, Math.floor((val / 255) * 16));
        });
        setAudioLevel(newLevels);
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      
      updateVisualizer();
      return stream;
    } catch (err) {
      console.error('Error accessing microphone for visualizer:', err);
      return null;
    }
  };

  const [format, setFormat] = useState('Reels');
  const [tone, setTone] = useState('Sério');
  const [goal, setGoal] = useState('Venda');

  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
    const handleToggleRecording = async () => {
      if (isRecording) {
        preRecordingContentRef.current = content;
        timerRef.current = setInterval(() => {
          setTimer((prev) => prev + 1);
        }, 1000);
        
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Recognition already started or failed', e);
          }
        }
        streamRef.current = await startAudioVisualizer();
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setAudioLevel(new Array(11).fill(2));
      }
    };

    handleToggleRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0')
    };
  };

  const handleSave = async () => {
    if (!content) return;
    
    if (!user) {
      const confirmLogin = confirm('Você precisa estar logado para salvar na nuvem. Deseja entrar agora?');
      if (confirmLogin) {
        await login();
        return;
      }
    }

    setIsProcessing(true);
    try {
      const contentData = {
        userId: user?.uid || 'anonymous',
        title: type === 'idea' ? 'Nova Ideia' : 'Nova História',
        content,
        type,
        status: 'captured',
        isFavorite: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      let contentId: string;

      if (user) {
        const docRef = await addDoc(collection(db, 'content'), contentData);
        contentId = docRef.id;
      } else {
        // Fallback to localStorage for anonymous users if they refuse to login
        const newId = Date.now().toString();
        const localData = { ...contentData, id: newId, date: new Date().toLocaleDateString('pt-BR') };
        const existing = JSON.parse(localStorage.getItem('captured_content') || '[]');
        localStorage.setItem('captured_content', JSON.stringify([localData, ...existing]));
        contentId = newId;
      }

      // Trigger automatic classification in background
      classifyContent(content).then(result => {
        if (user) {
          // Update firestore if needed, but for now we just log
          console.log("Auto-classification result:", result);
        } else {
          const classified = JSON.parse(localStorage.getItem('classified_metadata') || '{}');
          classified[contentId] = {
            ...result,
            format: 'Reels',
            tone: 'Didático',
            goal: 'Educação'
          };
          localStorage.setItem('classified_metadata', JSON.stringify(classified));
        }
      }).catch(err => console.error("Auto-classification failed:", err));
      
      router.push('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'content');
    } finally {
      setIsProcessing(false);
    }
  };

  const time = formatTime(timer);

  return (
    <div className="flex flex-col flex-1 bg-[#101e22]">
      <header className="sticky top-0 z-10 flex items-center bg-[#101e22]/80 backdrop-blur-md p-4 border-b border-[#0db9f2]/10">
        <button 
          onClick={() => router.back()}
          className="text-slate-100 p-2 hover:bg-[#0db9f2]/10 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold ml-2">Nova {type === 'idea' ? 'Ideia' : 'História'}</h1>
      </header>

      <main className="flex-1 p-4 space-y-8 pb-32 overflow-y-auto no-scrollbar">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0db9f2]">1. Método de Entrada</h2>
          <div className="flex h-12 w-full items-center justify-center rounded-full bg-[#0db9f2]/10 p-1">
            <button
              onClick={() => setInputMethod('audio')}
              className={cn(
                "flex grow items-center justify-center rounded-full h-full font-bold transition-all",
                inputMethod === 'audio' ? "bg-[#0db9f2] text-[#101e22]" : "text-slate-400"
              )}
            >
              Gravar áudio
            </button>
            <button
              onClick={() => setInputMethod('text')}
              className={cn(
                "flex grow items-center justify-center rounded-full h-full font-bold transition-all",
                inputMethod === 'text' ? "bg-[#0db9f2] text-[#101e22]" : "text-slate-400"
              )}
            >
              Digitar texto
            </button>
          </div>
        </section>

        {inputMethod === 'audio' ? (
          <section className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0db9f2]">2. Gravação</h2>
            {!isSupported ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-center">
                <p className="text-amber-500 font-bold mb-2">Reconhecimento de Voz não suportado</p>
                <p className="text-slate-400 text-xs">Seu navegador não suporta a API de voz. Por favor, use o método de digitação ou tente o Chrome.</p>
              </div>
            ) : (
              <div className="bg-[#0db9f2]/5 rounded-xl p-8 border border-[#0db9f2]/10 flex flex-col items-center justify-center gap-6">
                <div className="flex items-end justify-center gap-1 h-16 w-full">
                  {audioLevel.map((level, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-[#0db9f2] rounded-full transition-all duration-75"
                      style={{ height: `${(level / 16) * 100}%` }}
                    />
                  ))}
                </div>
                
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#0db9f2]/20 text-[#0db9f2] px-4 py-2 rounded-lg font-bold text-2xl">{time.mins}</div>
                    <span className="text-xs text-slate-400 mt-1 uppercase">Min</span>
                  </div>
                  <div className="text-2xl font-bold py-2">:</div>
                  <div className="flex flex-col items-center">
                    <div className="bg-[#0db9f2]/20 text-[#0db9f2] px-4 py-2 rounded-lg font-bold text-2xl">{time.secs}</div>
                    <span className="text-xs text-slate-400 mt-1 uppercase">Seg</span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    "size-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95",
                    isRecording ? "bg-red-500 shadow-red-500/20" : "bg-[#0db9f2] shadow-[#0db9f2]/20"
                  )}
                >
                  <Mic size={32} className={isRecording ? "text-white" : "text-[#101e22]"} />
                </button>
              </div>
            )}
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0db9f2]">
              {inputMethod === 'audio' ? '3. Transcrição / Detalhes' : '2. Detalhes da Ideia'}
            </h2>
            <span className="text-[10px] bg-[#0db9f2]/20 text-[#0db9f2] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Sparkles size={10} /> IA ATIVA
            </span>
          </div>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-40 rounded-xl bg-[#0db9f2]/5 border border-[#0db9f2]/10 p-4 focus:ring-[#0db9f2] focus:border-[#0db9f2] text-slate-100 placeholder-slate-500 resize-none outline-none"
            placeholder="A ideia é criar um vídeo sobre as tendências de UI em 2024, focando em minimalismo e cores vibrantes..."
          />
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#101e22]/80 backdrop-blur-lg border-t border-[#0db9f2]/10 max-w-md mx-auto">
        <button 
          onClick={handleSave}
          disabled={isProcessing || !content}
          className="w-full h-14 bg-[#0db9f2] text-[#101e22] font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#101e22]"></div>
          ) : (
            <>
              <Save size={20} />
              <span>Salvar na Forja</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

export default function NewIdeaPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400">Carregando...</div>}>
      <NewIdeaContent />
    </Suspense>
  );
}
