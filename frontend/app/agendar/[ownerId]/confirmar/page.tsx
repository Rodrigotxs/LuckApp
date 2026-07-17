'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Scissors, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ConfirmarAgendamentoPage() {
  const router = useRouter();
  const params = useParams<{ ownerId: string }>();
  const ownerId = params.ownerId;
  const [servico, setServico] = useState<any>(null);
  const [slot, setSlot] = useState<{ startAt: string; endAt: string } | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const serviceId = sessionStorage.getItem('agendar_serviceId');
    const slotStr = sessionStorage.getItem('agendar_slot');
    if (!serviceId || !slotStr) { router.replace(`/agendar/${ownerId}`); return; }

    setSlot(JSON.parse(slotStr));
    api.get(`/services/public/${ownerId}`)
      .then(({ data }) => {
        const s = data.find((s: any) => s.id === serviceId);
        setServico(s);
      });
  }, [ownerId, router]);

  const confirmar = async () => {
    if (!slot || !servico) return;
    setLoading(true);
    setErro('');
    try {
      await api.post('/appointments', {
        ownerId,
        serviceId: servico.id,
        startAt: slot.startAt,
      });
      sessionStorage.removeItem('agendar_serviceId');
      sessionStorage.removeItem('agendar_slot');
      setConcluido(true);
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao confirmar agendamento');
    } finally {
      setLoading(false);
    }
  };

  if (concluido) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#2C2C2C]">Agendado!</h2>
            <p className="text-[#BDBDBD] text-sm mt-2">Você receberá uma confirmação via WhatsApp.</p>
          </div>
          {slot && (
            <div className="bg-[#F5F5F5] rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-[#C0392B]" />
                <span className="capitalize">{format(parseISO(slot.startAt), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-[#C0392B]" />
                <span>{format(parseISO(slot.startAt), 'HH:mm')}</span>
              </div>
              {servico && (
                <div className="flex items-center gap-2 text-sm">
                  <Scissors size={14} className="text-[#C0392B]" />
                  <span>{servico.name}</span>
                </div>
              )}
            </div>
          )}
          <Button variant="primary" size="lg" className="w-full" onClick={() => router.push('/agendar')}>
            Fazer outro agendamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#1A3A6B] px-6 pt-12 pb-6">
        <p className="text-white/50 text-xs mb-1">Passo 3 de 3</p>
        <h1 className="text-xl font-bold text-white">Confirmar agendamento</h1>
      </div>

      <div className="px-4 py-6 max-w-sm mx-auto space-y-4">
        {slot && servico ? (
          <>
            <div className="bg-white rounded-xl border border-[#BDBDBD]/20 shadow-sm p-5 space-y-4">
              <p className="font-bold text-[#1A3A6B] text-sm uppercase tracking-wider">Resumo</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#C0392B]/10 rounded-full flex items-center justify-center">
                    <Scissors size={14} className="text-[#C0392B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#BDBDBD]">Serviço</p>
                    <p className="font-semibold text-[#2C2C2C]">{servico.name}</p>
                  </div>
                  <p className="ml-auto font-bold text-[#C0392B]">
                    R$ {servico.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1A3A6B]/10 rounded-full flex items-center justify-center">
                    <Calendar size={14} className="text-[#1A3A6B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#BDBDBD]">Data</p>
                    <p className="font-semibold text-[#2C2C2C] capitalize">
                      {format(parseISO(slot.startAt), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1A3A6B]/10 rounded-full flex items-center justify-center">
                    <Clock size={14} className="text-[#1A3A6B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#BDBDBD]">Horário</p>
                    <p className="font-semibold text-[#2C2C2C]">
                      {format(parseISO(slot.startAt), 'HH:mm')} – {format(parseISO(slot.endAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{erro}</p>}

            <Button variant="primary" size="lg" className="w-full" loading={loading} onClick={confirmar}>
              Confirmar agendamento
            </Button>
            <button
              onClick={() => router.back()}
              className="w-full text-center text-[#BDBDBD] text-sm hover:text-[#2C2C2C]"
            >
              ← Escolher outro horário
            </button>
          </>
        ) : (
          <div className="space-y-4">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
