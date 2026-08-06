import { api } from '../api';

export interface ClientMe {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export async function getMe(): Promise<ClientMe> {
  return (await api.get('/clients/me')).data;
}

export async function updateMe(data: { name?: string; whatsapp?: string; email?: string }): Promise<ClientMe> {
  return (await api.patch('/clients/me', data)).data;
}

/** Usado pelo dono ao agendar manualmente. */
export async function findOrCreate(data: { name: string; whatsapp: string; email?: string }): Promise<ClientMe> {
  return (await api.post('/clients/find-or-create', data)).data;
}
