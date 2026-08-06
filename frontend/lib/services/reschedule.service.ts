import { api } from '../api';

export type RescheduleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED_BY_CLIENT';

export interface RescheduleRequest {
  id: string;
  appointmentId: string;
  clientId: string;
  ownerId: string;
  requestedStart: string;
  status: RescheduleStatus;
  respondedAt?: string;
  message?: string;
  createdAt: string;
  appointment?: {
    id: string;
    startAt: string;
    service: { name: string; price: number };
    owner?: { barbershopName: string };
  };
  client?: { id: string; name: string; whatsapp: string };
}

export async function request(appointmentId: string, requestedStart: string, message?: string): Promise<RescheduleRequest> {
  return (await api.post('/reschedule-requests', { appointmentId, requestedStart, message })).data;
}

export async function listClient(): Promise<RescheduleRequest[]> {
  return (await api.get('/reschedule-requests/client')).data;
}

export async function listOwner(status?: RescheduleStatus): Promise<RescheduleRequest[]> {
  return (await api.get('/reschedule-requests/owner', { params: { status } })).data;
}

export async function respond(id: string, status: 'APPROVED' | 'REJECTED'): Promise<RescheduleRequest> {
  return (await api.patch(`/reschedule-requests/${id}`, { status })).data;
}

export async function cancel(id: string): Promise<RescheduleRequest> {
  return (await api.delete(`/reschedule-requests/${id}`)).data;
}
