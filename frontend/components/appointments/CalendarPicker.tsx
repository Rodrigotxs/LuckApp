'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  addMonths, subMonths, isSameDay, isBefore, startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarPickerProps {
  dataSelecionada: Date | null;
  onSelecionar: (data: Date) => void;
  diasDisponiveis?: Date[];
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CalendarPicker({ dataSelecionada, onSelecionar, diasDisponiveis }: CalendarPickerProps) {
  const [mesAtual, setMesAtual] = useState(new Date());

  const inicio = startOfMonth(mesAtual);
  const fim = endOfMonth(mesAtual);
  const diasDoMes = eachDayOfInterval({ start: inicio, end: fim });
  const inicioDiaSemana = getDay(inicio);
  const hoje = startOfDay(new Date());

  const eDisponivel = (dia: Date) => {
    if (!diasDisponiveis) return true;
    return diasDisponiveis.some((d) => isSameDay(d, dia));
  };

  return (
    <div className="bg-white rounded-xl border border-[#BDBDBD]/30 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMesAtual(subMonths(mesAtual, 1))} className="p-1.5 rounded-full hover:bg-[#F5F5F5]">
          <ChevronLeft size={18} className="text-[#2C2C2C]" />
        </button>
        <h2 className="font-bold text-[#1A3A6B] capitalize">
          {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button onClick={() => setMesAtual(addMonths(mesAtual, 1))} className="p-1.5 rounded-full hover:bg-[#F5F5F5]">
          <ChevronRight size={18} className="text-[#2C2C2C]" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-[#BDBDBD] py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array(inicioDiaSemana).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
        {diasDoMes.map((dia) => {
          const passado = isBefore(dia, hoje);
          const selecionado = dataSelecionada ? isSameDay(dia, dataSelecionada) : false;
          const disponivel = !passado && eDisponivel(dia);

          return (
            <button
              key={dia.toISOString()}
              disabled={!disponivel}
              onClick={() => onSelecionar(dia)}
              className={`
                w-full aspect-square flex items-center justify-center
                text-sm rounded-full font-medium
                transition-all duration-150
                ${selecionado
                  ? 'bg-[#C0392B] text-white'
                  : disponivel
                    ? 'hover:bg-[#F5F5F5] text-[#2C2C2C]'
                    : 'text-[#BDBDBD] cursor-not-allowed'
                }
              `}
            >
              {format(dia, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
