import { api } from '../api';

export interface Barber {
  id: string;
  name: string;
  role: string;
  rating: number;
  avatarLabel?: string;
  unitId: string;
  unit?: { name: string };
}

export async function listPublic(ownerId: string, unitId?: string): Promise<Barber[]> {
  const qs = unitId ? `?unitId=${unitId}` : '';
  return (await api.get(`/barbers/public/${ownerId}${qs}`)).data;
}

export async function list(unitId?: string): Promise<Barber[]> {
  const qs = unitId ? `?unitId=${unitId}` : '';
  return (await api.get(`/barbers${qs}`)).data;
}

export async function create(data: {
  name: string;
  unitId: string;
  role?: string;
  rating?: number;
  avatarLabel?: string;
}): Promise<Barber> {
  return (await api.post('/barbers', data)).data;
}

export async function update(id: string, data: Partial<Barber>): Promise<Barber> {
  return (await api.patch(`/barbers/${id}`, data)).data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/barbers/${id}`);
}
