'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { obterUsuario } from '@/lib/auth';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const user = obterUsuario();
    if (user?.role === 'owner') router.replace('/painel');
    else if (user?.role === 'client') router.replace('/agendar');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1A3A6B] flex flex-col items-center justify-between px-6 py-16">
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-[#C0392B] rounded-full flex items-center justify-center shadow-xl">
            <Scissors size={48} className="text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white tracking-wider">LUCK</h1>
            <p className="text-[#BDBDBD] text-sm tracking-[0.3em] uppercase mt-1">Barbearia</p>
          </div>
        </div>
        <div className="w-12 h-0.5 bg-[#C0392B]" />
        <p className="text-white/70 text-center text-sm max-w-xs leading-relaxed">
          Agendamento online rápido e fácil. Cortes clássicos com hora marcada.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <Button variant="primary" size="lg" className="w-full" onClick={() => router.push('/cadastro/cliente')}>
          Sou Cliente
        </Button>
        <Button
          variant="ghost" size="lg"
          className="w-full border-white/30 text-white hover:bg-white/10"
          onClick={() => router.push('/cadastro/dono')}
        >
          Sou Dono de Barbearia
        </Button>
        <button
          onClick={() => router.push('/login')}
          className="text-white/50 text-sm text-center mt-2 hover:text-white/80 transition-colors"
        >
          Já tenho conta → Entrar
        </button>
      </div>
    </div>
  );
}
