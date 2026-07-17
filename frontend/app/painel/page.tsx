'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scissors, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { Timeline } from '@/components/appointments/Timeline';
import { api } from '@/lib/api';
import { obterUsuario } from '@/lib/auth';

type Visualizacao = 'lista' | 'timeline';

export default function PainelPage() {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visualizacao, setVisualizacao] = useState<Visualizacao>('lista');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => { setUser(obterUsuario()); }, []);

  const carregarAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const dataStr = format(dataAtual, 'yyyy-MM-dd');
      const { data } = await api.get('/appointments/owner', { params: { data: dataStr } });
      setAgendamentos(data);
    } finally {
      setLoading(false);
    }
  }, [dataAtual]);

  useEffect(() => { carregarAgendamentos(); }, [carregarAgendamentos]);

  const atualizarStatus = async (id: string, status: string) => {
    await api.patch(`/appointments/${id}/status`, { status });
    await carregarAgendamentos();
  };

  const atualizarPagamento = async (id: string) => {
    await api.patch(`/appointments/${id}/payment`, { paymentStatus: 'PAID', paymentMethod: 'CASH' });
    await carregarAgendamentos();
  };

  const navegarDia = (delta: number) => {
    const nova = new Date(dataAtual);
    nova.setDate(nova.getDate() + delta);
    setDataAtual(nova);
  };

  const ehHoje = format(dataAtual, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const totalDia = agendamentos
    .filter(a => a.status === 'COMPLETED' && a.paymentStatus === 'PAID')
    .reduce((sum, a) => sum + a.service.price, 0);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#1A3A6B] px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scissors size={18} className="text-[#C0392B]" />
            <span className="text-white font-bold text-sm">{user?.barbershopName || 'Barbearia Luck'}</span>
          </div>
          <button onClick={carregarAgendamentos} className="p-2 text-white/50 hover:text-white">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => navegarDia(-1)} className="p-2 text-white/50 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-white font-bold capitalize">
              {ehHoje ? 'Hoje' : format(dataAtual, "EEEE", { locale: ptBR })}
            </p>
            <p className="text-white/60 text-sm">
              {format(dataAtual, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button onClick={() => navegarDia(1)} className="p-2 text-white/50 hover:text-white">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <p className="text-white text-lg font-bold">{agendamentos.filter(a => a.status !== 'CANCELLED').length}</p>
            <p className="text-white/50 text-xs">Agendamentos</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <p className="text-[#C0392B] text-lg font-bold">
              R$ {totalDia.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-white/50 text-xs">Faturado hoje</p>
          </div>
        </div>
      </div>

      <div className="flex mx-4 mt-4 bg-white rounded-xl border border-[#BDBDBD]/20 p-1">
        {(['lista', 'timeline'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVisualizacao(v)}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
              visualizacao === v ? 'bg-[#1A3A6B] text-white' : 'text-[#BDBDBD]'
            }`}
          >
            {v === 'lista' ? 'Lista' : 'Timeline'}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          Array(3).fill(null).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
          ))
        ) : agendamentos.length === 0 ? (
          <div className="text-center py-16 text-[#BDBDBD]">
            <Scissors size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nenhum agendamento neste dia</p>
            <p className="text-sm mt-1">Que tal descansar? 😊</p>
          </div>
        ) : visualizacao === 'lista' ? (
          agendamentos.map((ag) => (
            <div key={ag.id} onClick={() => setExpandido(expandido === ag.id ? null : ag.id)}>
              <AppointmentCard
                appointment={ag}
                expandido={expandido === ag.id}
                onStatusChange={atualizarStatus}
                onPaymentChange={atualizarPagamento}
              />
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-4 overflow-y-auto max-h-[500px]">
            <Timeline agendamentos={agendamentos} onSelectAgendamento={(id) => setExpandido(id)} />
          </div>
        )}
      </div>
    </div>
  );
}
