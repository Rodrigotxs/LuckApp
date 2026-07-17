'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { DollarSign, TrendingUp, Users } from 'lucide-react';
import { RevenueChart } from '@/components/financial/RevenueChart';
import { SummaryCard } from '@/components/financial/SummaryCard';
import { GoalProgress } from '@/components/financial/GoalProgress';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

type Periodo = 'today' | 'week' | 'month';

export default function FinanceiroPage() {
  const [periodo, setPeriodo] = useState<Periodo>('month');
  const [resumo, setResumo] = useState<any>(null);
  const [relatorio, setRelatorio] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hoje = new Date();
    const inicio = format(subDays(hoje, 29), 'yyyy-MM-dd');
    const fim = format(hoje, 'yyyy-MM-dd');

    Promise.all([
      api.get('/financial/summary', { params: { period: periodo } }),
      api.get('/financial/report', { params: { startDate: inicio, endDate: fim } }),
      api.get('/financial/goals'),
    ]).then(([r, rel, m]) => {
      setResumo(r.data);
      setRelatorio(rel.data);
      setMeta(m.data);
    }).finally(() => setLoading(false));
  }, [periodo]);

  const formatarMoeda = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const periodos = [
    { key: 'today' as const, label: 'Hoje' },
    { key: 'week' as const, label: 'Semana' },
    { key: 'month' as const, label: 'Mês' },
  ];

  return (
    <div>
      <Header titulo="Financeiro" subtitulo="Relatórios e metas" />

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        <div className="flex bg-white rounded-xl border border-[#BDBDBD]/20 p-1">
          {periodos.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriodo(key)}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                periodo === key ? 'bg-[#C0392B] text-white' : 'text-[#BDBDBD]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(null).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              <SummaryCard
                titulo="Faturamento"
                valor={formatarMoeda(resumo?.total || 0)}
                descricao={`${resumo?.quantidade || 0} atendimentos`}
                icone={<DollarSign size={22} />}
                cor="red"
              />
              <SummaryCard
                titulo="Ticket Médio"
                valor={formatarMoeda(resumo?.ticketMedio || 0)}
                descricao="Por atendimento"
                icone={<TrendingUp size={22} />}
                cor="navy"
              />
              <SummaryCard
                titulo="Atendimentos"
                valor={String(resumo?.quantidade || 0)}
                descricao="Pagos e concluídos"
                icone={<Users size={22} />}
                cor="green"
              />
            </div>

            {meta && <GoalProgress {...meta} />}

            {relatorio && (
              <div className="bg-white rounded-xl border border-[#BDBDBD]/20 shadow-sm p-4">
                <p className="font-bold text-[#1A3A6B] text-sm mb-4">Últimos 30 dias</p>
                <RevenueChart dados={relatorio.porDia} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
