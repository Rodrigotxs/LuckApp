'use client';

import { format, parseISO } from 'date-fns';

interface Slot {
  startAt: string;
  endAt: string;
  disponivel: boolean;
}

interface TimeSlotGridProps {
  slots: Slot[];
  slotSelecionado: string | null;
  onSelecionar: (slot: Slot) => void;
  loading?: boolean;
}

export function TimeSlotGrid({ slots, slotSelecionado, onSelecionar, loading }: TimeSlotGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="h-12 bg-[#F5F5F5] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="text-center py-8 text-[#BDBDBD]">
        <p className="text-sm">Nenhum horário disponível nesta data.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const selecionado = slotSelecionado === slot.startAt;
        const hora = format(parseISO(slot.startAt), 'HH:mm');

        return (
          <button
            key={slot.startAt}
            disabled={!slot.disponivel}
            onClick={() => onSelecionar(slot)}
            className={`
              h-12 rounded-lg text-sm font-semibold
              border-2 transition-all duration-150
              ${selecionado
                ? 'bg-[#C0392B] border-[#C0392B] text-white'
                : slot.disponivel
                  ? 'bg-white border-[#BDBDBD] text-[#2C2C2C] hover:border-[#C0392B] hover:text-[#C0392B]'
                  : 'bg-[#F5F5F5] border-[#BDBDBD]/50 text-[#BDBDBD] cursor-not-allowed line-through'
              }
            `}
          >
            {hora}
          </button>
        );
      })}
    </div>
  );
}
