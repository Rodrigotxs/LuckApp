'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LuckHeader } from '../luck';
import { IconDownload } from '../icons/Icons';
import { financialService, servicesService } from '@/lib/services';
import type { Periodo, Summary, Report } from '@/lib/services/financial.service';
import type { Service } from '@/lib/services/services.service';

interface Props { onBack: () => void; }

export function LuckOwnerFinance({ onBack }: Props) {
  const [period, setPeriod] = useState<Periodo>('week');
  const [servicos, setServicos] = useState<Service[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  const { startDate, endDate } = useMemo(() => {
    const hoje = new Date();
    const dias = period === 'year' ? 365 : period === 'month' ? 30 : 7;
    return {
      startDate: format(subDays(hoje, dias - 1), 'yyyy-MM-dd'),
      endDate: format(hoje, 'yyyy-MM-dd'),
    };
  }, [period]);

  const carregar = async () => {
    try {
      const [sum, rep, svs] = await Promise.all([
        financialService.summary(period, serviceFilter || undefined),
        financialService.report(startDate, endDate, serviceFilter || undefined),
        servicesService.list().catch(() => []),
      ]);
      setSummary(sum);
      setReport(rep);
      setServicos(svs);
    } catch { /* backend offline: silencia */ }
  };

  useEffect(() => { carregar(); }, [period, serviceFilter]);

  const exportarCSV = async () => {
    try {
      const blob = await financialService.exportCsv(startDate, endDate, serviceFilter || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-barbearia-luck-${period}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Erro ao exportar: ${err.response?.data?.message || err.message}`);
    }
  };

  const total = summary?.total || 0;
  const quantidade = summary?.quantidade || 0;

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 60px' }}>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          Relatório <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>financeiro</em>
        </div>

        <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 6, color: '#999' }}>PERÍODO</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[{ id: 'week' as const, l: 'SEMANA' }, { id: 'month' as const, l: 'MÊS' }, { id: 'year' as const, l: 'ANO' }].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: '6px 12px', borderRadius: 99,
                border: period === p.id ? 'none' : '1px solid var(--gray-soft)',
                background: period === p.id ? 'var(--red)' : 'white',
                color: period === p.id ? 'white' : '#888',
                fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{p.l}</button>
          ))}
        </div>

        <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 6, color: '#999' }}>TIPO DE SERVIÇO</div>
        <div className="lk-scroll" style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
          <button
            onClick={() => setServiceFilter('')}
            style={{
              padding: '6px 12px', borderRadius: 99,
              border: serviceFilter === '' ? 'none' : '1px solid var(--gray-soft)',
              background: serviceFilter === '' ? 'var(--navy)' : 'white',
              color: serviceFilter === '' ? 'white' : '#888',
              fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >Todos</button>
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => setServiceFilter(s.id)}
              style={{
                padding: '6px 12px', borderRadius: 99,
                border: serviceFilter === s.id ? 'none' : '1px solid var(--gray-soft)',
                background: serviceFilter === s.id ? 'var(--navy)' : 'white',
                color: serviceFilter === s.id ? 'white' : '#888',
                fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >{s.name}</button>
          ))}
        </div>

        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontSize: 9.5, color: '#999', fontWeight: 700, marginBottom: 4 }}>
            TOTAL · {period === 'week' ? 'ESTA SEMANA' : period === 'month' ? 'ESTE MÊS' : 'ESTE ANO'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="lk-serif" style={{ fontSize: 28, fontWeight: 800, color: 'var(--red)' }}>
              R$ {total.toLocaleString('pt-BR')}
            </span>
            <span style={{
              fontSize: 10.5, fontWeight: 700, color: '#2e7d32',
              background: '#4caf5020', padding: '2px 6px', borderRadius: 6,
            }}>
              {quantidade} atend.
            </span>
          </div>
          <MiniBars data={report?.porDia || []} />
        </div>

        <button
          onClick={exportarCSV}
          className="lk-press"
          style={{
            width: '100%', marginTop: 14, padding: '13px', borderRadius: 12,
            border: '1.5px solid #2e7d32', background: '#2e7d3210', color: '#2e7d32',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <IconDownload size={15} color="#2e7d32" strokeWidth={1.8} />
          EXPORTAR BASE (EXCEL/CSV)
        </button>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
            Atendimentos ({report?.agendamentos.length || 0})
          </div>
          <div style={{ background: 'var(--bg2)', borderRadius: 12 }}>
            {(!report || report.agendamentos.length === 0) && (
              <div style={{ padding: '18px 12px', textAlign: 'center', fontSize: 12, color: '#999' }}>
                Nenhum atendimento neste filtro.
              </div>
            )}
            {report?.agendamentos.map((it: any, i: number) => (
              <div key={it.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderTop: i === 0 ? 'none' : '1px solid white',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 15,
                  background: 'white', display: 'grid', placeItems: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--navy)',
                }}>
                  {(it.client?.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{it.client?.name || '—'}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>
                    {it.service?.name} · {format(parseISO(it.startAt), 'dd/MM HH:mm', { locale: ptBR })}
                  </div>
                </div>
                <div className="lk-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>R$ {it.service?.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBars({ data }: { data: { data: string; faturamento: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.faturamento), 1);
  const ultimos = data.slice(-7);
  const idxHoje = ultimos.length - 1;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56, marginTop: 14 }}>
        {ultimos.map((d, i) => {
          const h = Math.max(6, (d.faturamento / max) * 100);
          return (
            <div key={i} style={{
              flex: 1, height: `${h}%`,
              background: i === idxHoje ? 'var(--red)' : 'var(--navy)',
              borderRadius: '3px 3px 0 0',
              opacity: i === idxHoje ? 1 : 0.7,
            }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#999', marginTop: 6 }}>
        {ultimos.map((d, i) => <span key={i}>{d.data.slice(0, 2)}</span>)}
      </div>
    </>
  );
}
