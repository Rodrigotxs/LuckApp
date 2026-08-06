import { api } from '../api';

export interface AvailabilityBlock {
  id: string;
  ownerId: string;
  barberId?: string;
  unitId?: string;
  startAt: string;
  endAt: string;
  fullDay: boolean;
  reason?: string;
}

export async function list(params?: { from?: string; to?: string; barberId?: string }): Promise<AvailabilityBlock[]> {
  return (await api.get('/availability/blocks', { params })).data;
}

export async function createBlock(data: {
  startAt: string;
  endAt: string;
  fullDay?: boolean;
  reason?: string;
  barberId?: string;
  unitId?: string;
}): Promise<AvailabilityBlock> {
  return (await api.post('/availability/blocks', data)).data;
}

export async function blockDay(date: string, barberId?: string, reason?: string): Promise<AvailabilityBlock> {
  return (await api.post('/availability/blocks/day', { date, barberId, reason })).data;
}

export async function blockSlot(startAt: string, endAt: string, barberId?: string, reason?: string): Promise<AvailabilityBlock> {
  return (await api.post('/availability/blocks/slot', { startAt, endAt, barberId, reason })).data;
}

export async function removeBlock(id: string): Promise<void> {
  await api.delete(`/availability/blocks/${id}`);
}
