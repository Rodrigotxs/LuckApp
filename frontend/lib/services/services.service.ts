import { api } from '../api';

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  description?: string;
  active?: boolean;
}

export async function listPublic(ownerId: string): Promise<Service[]> {
  return (await api.get(`/services/public/${ownerId}`)).data;
}

export async function list(): Promise<Service[]> {
  return (await api.get('/services')).data;
}

export async function create(data: {
  name: string;
  price: number;
  durationMin: number;
  description?: string;
}): Promise<Service> {
  return (await api.post('/services', data)).data;
}

export async function update(id: string, data: Partial<Service>): Promise<Service> {
  return (await api.patch(`/services/${id}`, data)).data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}
