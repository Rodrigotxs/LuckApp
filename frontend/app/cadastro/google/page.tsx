'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function GoogleConnectContent() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status');
  const conectado = status === 'success';

  const conectar = () => {
    const token = localStorage.getItem('token');
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?token=${token}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#1A3A6B] px-6 pt-12 pb-8">
        <span className="text-white/40 text-xs">4 / 4</span>
        <h1 className="text-2xl font-bold text-white mt-2">Google Calendar</h1>
        <p className="text-white/60 text-sm mt-1">Sincronize sua agenda automaticamente</p>
      </div>

      <div className="px-6 py-10 max-w-sm mx-auto flex flex-col items-center gap-8">
        {conectado ? (
          <>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#2C2C2C]">Google Calendar conectado!</h2>
              <p className="text-[#BDBDBD] text-sm mt-2">Seus agendamentos serão sincronizados automaticamente.</p>
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={() => router.push('/painel')}>
              Ir para o painel
            </Button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-[#1A3A6B]/10 rounded-full flex items-center justify-center">
              <Calendar size={40} className="text-[#1A3A6B]" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-[#2C2C2C]">Conectar Google Calendar</h2>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Conecte sua conta Google para sincronizar agendamentos e ver conflitos de horário automaticamente.
              </p>
            </div>
            <div className="w-full space-y-3">
              <Button variant="secondary" size="lg" className="w-full" onClick={conectar}>
                Conectar Google Calendar
              </Button>
              <button
                onClick={() => router.push('/painel')}
                className="w-full text-center text-[#BDBDBD] text-sm hover:text-[#2C2C2C]"
              >
                Pular por agora
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function GooglePage() {
  return (
    <Suspense>
      <GoogleConnectContent />
    </Suspense>
  );
}
