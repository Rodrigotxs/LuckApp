import { api } from '../api';

export interface OwnerMe {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  barbershopName: string;
  barbershopAddress?: string;
  zipCode?: string;
  logoUrl?: string;
  monthlyGoal?: number;
}

export async function getMe(): Promise<OwnerMe> {
  return (await api.get('/owners/me')).data;
}

export async function updateMe(data: Partial<OwnerMe>): Promise<OwnerMe> {
  return (await api.patch('/owners/me', data)).data;
}
