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
  googleConnected?: boolean;
}

export async function getMe(): Promise<OwnerMe> {
  return (await api.get('/owners/me')).data;
}

export async function updateMe(data: Partial<OwnerMe>): Promise<OwnerMe> {
  return (await api.patch('/owners/me', data)).data;
}

export async function getGoogleAuthUrl(): Promise<string> {
  const res = await api.get('/auth/google/url');
  return res.data.url;
}

export interface OwnerPublic {
  id: string;
  name: string;
  barbershopName: string;
  barbershopAddress?: string;
}

export async function getDefaultPublic(): Promise<OwnerPublic | null> {
  const res = await api.get('/owners/public/default');
  return res.data;
}
