'use client';

export function salvarSessao(token: string, user: any) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function obterToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function obterUsuario(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function encerrarSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function estaAutenticado(): boolean {
  return !!obterToken();
}
