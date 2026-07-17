'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  titulo?: string;
  subtitulo?: string;
  mostrarVoltar?: boolean;
  onVoltar?: () => void;
  acaoDireita?: React.ReactNode;
}

export function Header({ titulo, subtitulo, mostrarVoltar = false, onVoltar, acaoDireita }: HeaderProps) {
  const router = useRouter();

  const handleVoltar = () => {
    if (onVoltar) onVoltar();
    else router.back();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#BDBDBD]/30 shadow-sm">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mostrarVoltar && (
            <button
              onClick={handleVoltar}
              className="p-2 -ml-2 rounded-full hover:bg-[#F5F5F5] transition-colors"
            >
              <ChevronLeft size={22} className="text-[#2C2C2C]" />
            </button>
          )}
          <div>
            {titulo && (
              <h1 className="font-bold text-[#2C2C2C] text-lg leading-tight">{titulo}</h1>
            )}
            {subtitulo && (
              <p className="text-xs text-[#BDBDBD]">{subtitulo}</p>
            )}
          </div>
        </div>
        {acaoDireita && <div>{acaoDireita}</div>}
      </div>
    </header>
  );
}
