'use client';

import { parseISO, differenceInMinutes } from 'date-fns';
import { Badge } from '../ui/Badge';

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: any;
  client?: { name: string };
  service: { name: string; price: number };
}

interface TimelineProps {
  agendamentos: Appointment[];
  horaInicio?: string;
  horaFim?: string;
  onSelectAgendamento?: (id: string) => void;
}

const ALTURA_HORA = 80;

export function Timeline({ agendamentos, horaInicio = '08:00', horaFim = '20:00', onSelectAgendamento }: TimelineProps) {
  const [hIni, mIni] = horaInicio.split(':').map(Number);
  const [hFim, mFim] = horaFim.split(':').map(Number);
  const totalMinutos = (hFim * 60 + mFim) - (hIni * 60 + mIni);
  const totalHoras = Math.ceil(totalMinutos / 60);

  const horas = Array.from({ length: totalHoras + 1 }, (_, i) => {
    const minutos = hIni * 60 + mIni + i * 60;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  });

  function calcularTop(startAt: string): number {
    const data = parseISO(startAt);
    const minutosDoInicio = (data.getHours() * 60 + data.getMinutes()) - (hIni * 60 + mIni);
    return (minutosDoInicio / 60) * ALTURA_HORA;
  }

  function calcularAltura(startAt: string, endAt: string): number {
    const duracao = differenceInMinutes(parseISO(endAt), parseISO(startAt));
    return (duracao / 60) * ALTURA_HORA;
  }

  return (
    <div className="relative overflow-x-hidden" style={{ height: `${totalHoras * ALTURA_HORA}px` }}>
      {horas.map((hora, idx) => (
        <div
          key={hora}
          className="absolute left-0 right-0 flex items-center gap-2"
          style={{ top: `${idx * ALTURA_HORA}px` }}
        >
          <span className="text-xs text-[#BDBDBD] w-12 text-right shrink-0">{hora}</span>
          <div className="flex-1 border-t border-[#BDBDBD]/20" />
        </div>
      ))}

      {agendamentos.map((ag) => {
        const top = calcularTop(ag.startAt);
        const height = calcularAltura(ag.startAt, ag.endAt);

        return (
          <div
            key={ag.id}
            onClick={() => onSelectAgendamento?.(ag.id)}
            className="absolute left-14 right-2 rounded-lg px-3 py-1.5 cursor-pointer overflow-hidden"
            style={{
              top: `${top}px`,
              height: `${Math.max(height, 40)}px`,
              background: ag.status === 'CANCELLED' ? '#F5F5F5' : '#1A3A6B',
            }}
          >
            <p className={`text-xs font-bold truncate ${ag.status === 'CANCELLED' ? 'text-[#BDBDBD]' : 'text-white'}`}>
              {ag.client?.name || 'Cliente'}
            </p>
            <p className={`text-xs truncate ${ag.status === 'CANCELLED' ? 'text-[#BDBDBD]' : 'text-white/80'}`}>
              {ag.service.name}
            </p>
            {height > 50 && <Badge variant={ag.status} className="mt-1 scale-90 origin-left" />}
          </div>
        );
      })}
    </div>
  );
}
