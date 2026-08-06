import { api } from '../api';

export interface Slot {
  startAt: string;
  endAt: string;
  disponivel: boolean;
}

export interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'PENDING' | 'PAID';
  paymentMethod?: 'CASH' | 'PIX' | 'CARD';
  notes?: string;
  service: { id: string; name: string; price: number; durationMin: number };
  client?: { id: string; name: string; whatsapp: string };
  barber?: { id: string; name: string; avatarLabel?: string };
  unit?: { id: string; name: string };
}

export async function availableSlots(params: {
  ownerId: string;
  date: string;
  serviceId: string;
  barberId?: string;
  unitId?: string;
}): Promise<Slot[]> {
  return (await api.get('/appointments/available-slots', { params })).data;
}

export async function create(data: {
  ownerId: string;
  serviceId: string;
  unitId?: string;
  barberId?: string;
  clientId?: string;   // dono agendando para outro cliente
  startAt: string;
  notes?: string;
}): Promise<Appointment> {
  return (await api.post('/appointments', data)).data;
}

export async function listOwner(params?: { data?: string; status?: string }): Promise<Appointment[]> {
  return (await api.get('/appointments/owner', { params })).data;
}

export async function listClient(): Promise<Appointment[]> {
  return (await api.get('/appointments/client')).data;
}

export async function updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
  return (await api.patch(`/appointments/${id}/status`, { status })).data;
}

export async function updatePayment(
  id: string,
  paymentStatus: Appointment['paymentStatus'],
  paymentMethod?: Appointment['paymentMethod'],
): Promise<Appointment> {
  return (await api.patch(`/appointments/${id}/payment`, { paymentStatus, paymentMethod })).data;
}

export async function cancel(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
}
