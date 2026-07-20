'use client';

import { useState } from 'react';
import { LuckHeader } from '../luck';
import { IconDownload } from '../icons/Icons';
import { LUCK_TRANSACTIONS, LUCK_SERVICE_TYPES } from './data';

interface Props { onBack: () => void; }

type Period = 'week' | 'month' | 'year';

export function LuckOwnerFinance({ onBack }: Props) {
  const [period, setPeriod] = useState<Period>('week');
  const [serviceFilter, setServiceFilter] = useState('Todos');

  const periodRank: Record<Period, number> = { week: 1, month: 2, year: 3 };
  const filtered = LUCK_TRANSACTIONS.filter(
    (t) => periodRank[t.period] <= periodRank[period] && (serviceFilter === 'Todos' || t.s === serviceFilter)
  );
  const total = filtered.reduce((sum, t) => sum + t.v, 0);

  const exportCSV = () => {
    const header = 'Data,Horário,Cliente,Serviço,Valor (R$)\n';
    const rows = filtered.map((t) => `${t.d},${t.t},"${t.n}","${t.s}",${t.v.toFixed(2)}`).join('\n');
    const csv = header + rows;
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-barbearia-luck-${period}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
            >
              {p.l}
            </button>
          ))}
        </div>

        <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 6, color: '#999' }}>TIPO DE SERVIÇO</div>
        <div className="lk-scroll" style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
          {LUCK_SERVICE_TYPES.map((s) => (
            <button
              key={s}
              onClick={() => setServiceFilter(s)}
              style={{
                padding: '6px 12px', borderRadius: 99,
                border: serviceFilter === s ? 'none' : '1px solid var(--gray-soft)',
                background: serviceFilter === s ? 'var(--navy)' : 'white',
                color: serviceFilter === s ? 'white' : '#888',
                fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontSize: 9.5, color: '#999', fontWeight: 700, marginBottom: 4 }}>
            TOTAL · {period === 'week' ? 'ESTA SEMANA' : period === 'month' ? 'ESTE MÊS' : 'ESTE ANO'}
            {serviceFilter !== 'Todos' ? ` · ${serviceFilter}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="lk-serif" style={{ fontSize: 28, fontWeight: 800, color: 'var(--red)' }}>
              R$ {total.toLocaleString('pt-BR')}
            </span>
            <span style={{
              fontSize: 10.5, fontWeight: 700, color: '#2e7d32',
              background: '#4caf5020', padding: '2px 6px', borderRadius: 6,
            }}>
              {filtered.length} atend.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56, marginTop: 14 }}>
            {[30, 55, 38, 65, 80, 95, 35].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: `${h}%`,
                background: i === 6 ? 'var(--red)' : 'var(--navy)',
                borderRadius: '3px 3px 0 0',
                opacity: i === 6 ? 1 : 0.7,
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#999', marginTop: 6 }}>
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
        </div>

        <button
          onClick={exportCSV}
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
            Atendimentos ({filtered.length})
          </div>
          <div style={{ background: 'var(--bg2)', borderRadius: 12 }}>
            {filtered.length === 0 && (
              <div style={{ padding: '18px 12px', textAlign: 'center', fontSize: 12, color: '#999' }}>
                Nenhum atendimento neste filtro.
              </div>
            )}
            {filtered.map((it, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderTop: i === 0 ? 'none' : '1px solid white',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 15,
                  background: 'white', display: 'grid', placeItems: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--navy)',
                }}>
                  {it.n.split(' ').map((w) => w[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{it.n}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{it.s} · {it.d} {it.t}</div>
                </div>
                <div className="lk-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>R$ {it.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
