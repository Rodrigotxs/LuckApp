'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarPicker } from '@/components/appointments/CalendarPicker';
import { TimeSlotGrid } from '@/components/appointments/TimeSlotGrid';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface Slot {
  startAt: string;
  endAt: string;
  disponivel: boolean;
}

export default function EscolherHorarioPage() {
  const router = useRouter();
  const params = useParams<{ ownerId: string }>();
  const ownerId = params.ownerId;
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [serviceId, setServiceId] = useState('');

  useEffect(() => {
    const sid = sessionStorage.getItem('agendar_serviceId') || '';
    if (!sid) { router.replace(`/agendar/${ownerId}`); return; }
    setServiceId(sid);
  }, [ownerId, router]);

  const handleSelecionarData = async (data: Date) => {
    setDataSelecionada(data);
    setSlotSelecionado(null);
    setLoadingSlots(true);
    try {
      const dataStr = format(data, 'yyyy-MM-dd');
      const { data: slotsData } = await api.get('/appointments/available-slots', {
        params: { ownerId, date: dataStr, serviceId },
      });
      setSlots(slotsData);
    } finally {
      setLoadingSlots(false);
    }
  };

  const continuar = () => {
    if (!slotSelecionado || !dataSelecionada) return;
    const slot = slots.find(s => s.startAt === slotSelecionado);
    if (!slot) return;
    sessionStorage.setItem('agendar_slot', JSON.stringify(slot));
    router.push(`/agendar/${ownerId}/confirmar`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#1A3A6B] px-6 pt-12 pb-6">
        <p className="text-white/50 text-xs mb-1">Passo 2 de 3</p>
        <h1 className="text-xl font-bold text-white">Escolha o horário</h1>
      </div>

      <div className="px-4 py-6 max-w-sm mx-auto space-y-6">
        <CalendarPicker dataSelecionada={dataSelecionada} onSelecionar={handleSelecionarData} />

        {dataSelecionada && (
          <div>
            <p className="text-sm font-semibold text-[#2C2C2C] mb-3 capitalize">
              {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <TimeSlotGrid
              slots={slots}
              slotSelecionado={slotSelecionado}
              onSelecionar={(slot) => setSlotSelecionado(slot.startAt)}
              loading={loadingSlots}
            />
          </div>
        )}

        <Button variant="primary" size="lg" className="w-full" disabled={!slotSelecionado} onClick={continuar}>
          Confirmar horário
        </Button>
      </div>
    </div>
  );
}
