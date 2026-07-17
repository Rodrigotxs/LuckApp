'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Scissors, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { obterToken } from '@/lib/auth';

interface Servico {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  description?: string;
}

export default function EscolherServicoPage() {
  const router = useRouter();
  const params = useParams<{ ownerId: string }>();
  const ownerId = params.ownerId;
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    sessionStorage.setItem('agendar_ownerId', ownerId);
    api.get(`/services/public/${ownerId}`)
      .then(({ data }) => setServicos(data))
      .finally(() => setLoading(false));
  }, [ownerId]);

  const continuar = () => {
    if (!selecionado) return;
    sessionStorage.setItem('agendar_serviceId', selecionado);
    if (!obterToken()) {
      router.push('/cadastro/cliente');
      return;
    }
    router.push(`/agendar/${ownerId}/horario`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#1A3A6B] px-6 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Scissors size={18} className="text-[#C0392B]" />
          <span className="text-white/60 text-xs tracking-widest">BARBEARIA LUCK</span>
        </div>
        <h1 className="text-xl font-bold text-white">Escolha o serviço</h1>
        <p className="text-white/50 text-sm mt-1">Passo 1 de 3</p>
      </div>

      <div className="px-4 py-6 max-w-sm mx-auto space-y-3">
        {loading ? (
          Array(3).fill(null).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))
        ) : servicos.length === 0 ? (
          <div className="text-center py-12 text-[#BDBDBD]">
            <Scissors size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum serviço disponível</p>
          </div>
        ) : (
          servicos.map((s) => {
            const sel = selecionado === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelecionado(s.id)}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer
                  transition-all duration-150 bg-white
                  ${sel ? 'border-[#C0392B] shadow-md' : 'border-transparent shadow-sm hover:border-[#BDBDBD]'}
                `}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sel ? 'bg-[#C0392B]' : 'bg-[#F5F5F5]'}`}>
                  <Scissors size={18} className={sel ? 'text-white' : 'text-[#BDBDBD]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2C2C2C] truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-[#BDBDBD] truncate">{s.description}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#1A3A6B] flex items-center gap-1">
                      <Clock size={11} /> {s.durationMin} min
                    </span>
                    <span className="text-xs font-bold text-[#C0392B] flex items-center gap-1">
                      <DollarSign size={11} /> R$ {s.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
                {sel && (
                  <div className="w-5 h-5 bg-[#C0392B] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {!loading && servicos.length > 0 && (
          <Button variant="primary" size="lg" className="w-full mt-4" disabled={!selecionado} onClick={continuar}>
            Escolher horário
          </Button>
        )}
      </div>
    </div>
  );
}
