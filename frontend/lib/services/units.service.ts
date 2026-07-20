import { api } from '../api';

export interface Unit {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  active?: boolean;
}

export async function listPublic(ownerId: string): Promise<Unit[]> {
  return (await api.get(`/units/public/${ownerId}`)).data;
}

export async function list(): Promise<Unit[]> {
  return (await api.get('/units')).data;
}

export async function create(data: Omit<Unit, 'id' | 'active'>): Promise<Unit> {
  return (await api.post('/units', data)).data;
}

export async function update(id: string, data: Partial<Unit>): Promise<Unit> {
  return (await api.patch(`/units/${id}`, data)).data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/units/${id}`);
}
