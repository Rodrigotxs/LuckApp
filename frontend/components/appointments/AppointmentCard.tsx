'use client';

import { format, parseISO } from 'date-fns';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Clock, Scissors } from 'lucide-react';

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: any;
  paymentStatus: any;
  client?: { name: string; whatsapp: string };
  service: { name: string; price: number; durationMin: number };
  notes?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (id: string, status: string) => void;
  onPaymentChange?: (id: string) => void;
  expandido?: boolean;
}

export function AppointmentCard({ appointment, onStatusChange, onPaymentChange, expandido }: AppointmentCardProps) {
  const hora = format(parseISO(appointment.startAt), 'HH:mm');
  const horaFim = format(parseISO(appointment.endAt), 'HH:mm');

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {appointment.client && <Avatar name={appointment.client.name} size="md" />}
          <div>
            {appointment.client && (
              <p className="font-semibold text-[#2C2C2C]">{appointment.client.name}</p>
            )}
            <div className="flex items-center gap-1 text-[#BDBDBD] text-sm">
              <Scissors size={12} />
              <span>{appointment.service.name}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <Badge variant={appointment.status} />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-[#1A3A6B]">
          <Clock size={14} />
          <span className="font-semibold">{hora} – {horaFim}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={appointment.paymentStatus} />
          <span className="font-bold text-[#2C2C2C]">
            R$ {appointment.service.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {expandido && onStatusChange && (
        <div className="flex gap-2 pt-2 border-t border-[#F5F5F5]">
          {appointment.status === 'SCHEDULED' && (
            <button
              onClick={() => onStatusChange(appointment.id, 'CONFIRMED')}
              className="flex-1 text-xs py-1.5 rounded border border-green-300 text-green-700 hover:bg-green-50"
            >
              Confirmar
            </button>
          )}
          {['SCHEDULED', 'CONFIRMED'].includes(appointment.status) && (
            <button
              onClick={() => onStatusChange(appointment.id, 'COMPLETED')}
              className="flex-1 text-xs py-1.5 rounded border border-[#1A3A6B] text-[#1A3A6B] hover:bg-[#1A3A6B]/5"
            >
              Concluir
            </button>
          )}
          {appointment.status !== 'CANCELLED' && (
            <button
              onClick={() => onStatusChange(appointment.id, 'CANCELLED')}
              className="flex-1 text-xs py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50"
            >
              Cancelar
            </button>
          )}
          {appointment.paymentStatus === 'PENDING' && onPaymentChange && (
            <button
              onClick={() => onPaymentChange(appointment.id)}
              className="flex-1 text-xs py-1.5 rounded bg-[#C0392B] text-white hover:bg-[#a93226]"
            >
              Registrar Pgto
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
