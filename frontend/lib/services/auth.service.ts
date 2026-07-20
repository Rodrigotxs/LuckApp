import { api } from '../api';

export async function registerOwner(data: {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  barbershopName: string;
  barbershopAddress?: string;
}) {
  return (await api.post('/auth/owner/register', data)).data;
}

export async function loginOwner(email: string, password: string) {
  return (await api.post('/auth/owner/login', { email, password })).data;
}

export async function sendOwnerOtp(whatsapp: string) {
  return (await api.post('/auth/owner/send-otp', { whatsapp })).data;
}

export async function verifyOwnerOtp(whatsapp: string, code: string) {
  return (await api.post('/auth/owner/verify-otp', { whatsapp, code })).data;
}

export async function requestOwnerPasswordReset(input: { email?: string; whatsapp?: string }) {
  return (await api.post('/auth/owner/password-reset/request', input)).data;
}

export async function confirmOwnerPasswordReset(token: string, newPassword: string) {
  return (await api.post('/auth/owner/password-reset/confirm', { token, newPassword })).data;
}

export async function sendClientOtp(name: string, whatsapp: string) {
  return (await api.post('/auth/client/send-otp', { name, whatsapp })).data;
}

export async function verifyClientOtp(whatsapp: string, code: string) {
  return (await api.post('/auth/client/verify-otp', { whatsapp, code })).data;
}

export async function sendClientEmailOtp(name: string, email: string) {
  return (await api.post('/auth/client/send-email-otp', { name, email })).data;
}

export async function verifyClientEmailOtp(email: string, code: string) {
  return (await api.post('/auth/client/verify-email-otp', { email, code })).data;
}
