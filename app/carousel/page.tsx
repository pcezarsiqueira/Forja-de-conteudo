'use client';

import { ArrowLeft, PlayCircle, Plus, Wand2, Image as ImageIcon, Type, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function CarouselCreatorPage() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: '5 Tips for Better Design',
      subtitle: 'Swipe to learn more',
      bg: 'https://picsum.photos/seed/design1/800/1000',
      label: 'Intro Hook'
    },
    {
      id: 2,
      title: '1. Contrast is King',
      subtitle: 'Ensure your text stands out',
      bg: 'https://picsum.photos/seed/design2/800/1000',
      label: 'Point 1'
    },
    {
      id: 3,
      title: '2. Typography Matters',
      subtitle: 'Choose fonts that reflect your brand',
      bg: 'https://picsum.photos/seed/design3/800/1000',
      label: 'Point 2'
    }
  ];

  return (
    <div className="flex flex-col flex-1 bg-[#101e22] min-h-screen">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#101e22]/95 backdrop-blur-md border-b border-slate-800">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-white">Carousel Creator</h2>
        <button className="text-[#0db9f2] text-base font-bold hover:opacity-80 transition-opacity px-2">
          Save
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-6 pb-24 overflow-y-auto no-scrollbar">
        <section className="mt-4">
          <div className="flex justify-between items-center px-4 mb-3">
            <h1 className="text-xl font-bold text-white">Preview Slides</h1>
            <button className="text-sm font-medium text-[#0db9f2] flex items-center gap-1">
              <PlayCircle size={18} />
              Play
            </button>
          </div>
          
          <div className="flex overflow-x-auto px-4 gap-4 pb-4 snap-x snap-mandatory no-scrollbar">
            {slides.map((slide, index) => (
              <div 
                key={slide.id} 
                className="snap-center shrink-0 w-[70vw] sm:w-64 flex flex-col gap-3"
                onClick={() => setActiveSlide(index)}
              >
                <div className={cn(
                  "relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-lg transition-all border-2",
                  activeSlide === index ? "border-[#0db9f2] scale-100" : "border-transparent scale-95 opacity-80"
                )}>
                  <Image 
                    src={slide.bg} 
                    alt={slide.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 p-6 flex flex-col justify-center text-center">
                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{slide.title}</h3>
                    <p className="text-sm text-slate-200">{slide.subtitle}</p>
                  </div>
                  <div className="absolute top-2 right-2 bg-[#0db9f2] text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    {index + 1}/{slides.length}
                  </div>
                </div>
                <div className="text-center">
                  <p className={cn(
                    "font-medium transition-colors",
                    activeSlide === index ? "text-white" : "text-slate-500"
                  )}>{slide.label}</p>
                </div>
              </div>
            ))}
            
            <div className="snap-center shrink-0 w-[20vw] sm:w-24 flex flex-col gap-3 justify-center">
              <button className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-[#0db9f2] hover:text-[#0db9f2] transition-colors">
                <Plus size={24} />
                <span className="text-xs font-medium">Add</span>
              </button>
              <div className="h-6" />
            </div>
          </div>
        </section>

        <section className="px-4">
          <div className="bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#0db9f2]">✏️</span>
              <h3 className="text-lg font-bold text-white">Edit Slide Content</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Headline</label>
                <input 
                  className="w-full bg-slate-800 border-none rounded-lg p-3 text-white font-medium focus:ring-2 focus:ring-[#0db9f2] outline-none" 
                  type="text" 
                  defaultValue={slides[activeSlide]?.title}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Body Text</label>
                <textarea 
                  className="w-full bg-slate-800 border-none rounded-lg p-3 text-white font-medium focus:ring-2 focus:ring-[#0db9f2] outline-none resize-none" 
                  rows={3}
                  defaultValue={slides[activeSlide]?.subtitle}
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-slate-300 text-sm font-medium whitespace-nowrap hover:bg-slate-700">
                  <Wand2 size={16} /> AI Rewrite
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-slate-300 text-sm font-medium whitespace-nowrap hover:bg-slate-700">
                  <ImageIcon size={16} /> Change BG
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-slate-300 text-sm font-medium whitespace-nowrap hover:bg-slate-700">
                  <Type size={16} /> Text Style
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-4">
          <button className="w-full bg-[#0db9f2] hover:bg-[#0db9f2]/90 text-[#101e22] font-bold py-4 px-6 rounded-xl shadow-lg shadow-[#0db9f2]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            <Download size={20} />
            Download Assets
          </button>
          <p className="text-center text-xs text-slate-500 mt-3">Export as PNG, PDF or MP4 video</p>
        </section>
      </main>
    </div>
  );
}
