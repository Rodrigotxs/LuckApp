import * as crypto from 'crypto';

/** Quantidade de dígitos do código OTP. */
export const OTP_LENGTH = 6;
/** Validade do código, em minutos. */
export const OTP_TTL_MIN = 10;
/** Tentativas erradas antes de invalidar o código. */
export const OTP_MAX_ATTEMPTS = 5;

/**
 * Gera um código OTP numérico usando CSPRNG.
 *
 * `Math.random()` NÃO pode ser usado aqui: é um PRNG não criptográfico e
 * previsível a partir de algumas saídas observadas, o que permitiria a um
 * atacante derivar o próximo OTP de outra pessoa.
 */
export function gerarCodigoOtp(): string {
  const max = 10 ** OTP_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, '0');
}

/**
 * Compara dois segredos em tempo constante, evitando timing attack.
 * Retorna false quando qualquer um dos lados é nulo/vazio.
 */
export function compararSegredo(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // timingSafeEqual exige mesmo tamanho; normaliza via hash para não vazar o tamanho.
  const hashA = crypto.createHash('sha256').update(bufA).digest();
  const hashB = crypto.createHash('sha256').update(bufB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/** Token opaco para reset de senha (envia o valor puro, guarda só o hash). */
export function gerarTokenReset(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashToken(token) };
}

/** Hash determinístico do token de reset — o banco nunca guarda o valor puro. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Data de expiração padrão do OTP. */
export function expiracaoOtp(agora = new Date()): Date {
  return new Date(agora.getTime() + OTP_TTL_MIN * 60 * 1000);
}
