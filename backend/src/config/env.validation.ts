/**
 * Validação das variáveis de ambiente na subida da aplicação.
 *
 * Falhar rápido aqui é intencional: um JWT_SECRET ausente faz o passport
 * subir sem verificar assinatura de forma confiável, e um segredo fraco
 * herdado do .env.example ("seu-secret-aqui") é equivalente a não ter segredo.
 */

const SEGREDOS_PROIBIDOS = new Set([
  'seu-secret-aqui',
  'changeme',
  'secret',
  'jwt-secret',
  'dev',
  'test',
]);

export interface EnvValidado {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
  CORS_ORIGINS: string[];
  PORT: number;
  NODE_ENV: string;
  isProducao: boolean;
}

export function validarEnv(env: NodeJS.ProcessEnv = process.env): EnvValidado {
  const erros: string[] = [];
  const nodeEnv = env.NODE_ENV || 'development';
  const isProducao = nodeEnv === 'production';

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) erros.push('DATABASE_URL é obrigatória');

  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    erros.push('JWT_SECRET é obrigatória');
  } else {
    if (SEGREDOS_PROIBIDOS.has(jwtSecret.trim().toLowerCase())) {
      erros.push('JWT_SECRET usa um valor de exemplo — gere um segredo real');
    }
    if (isProducao && jwtSecret.length < 32) {
      erros.push('JWT_SECRET precisa ter ao menos 32 caracteres em produção');
    }
  }

  const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';

  // Em produção o CORS não pode ficar em localhost — precisa ser declarado.
  const corsRaw = env.CORS_ORIGINS || (isProducao ? '' : 'http://localhost:3000,http://localhost:3001');
  const corsOrigins = corsRaw.split(',').map((o) => o.trim()).filter(Boolean);
  if (isProducao && corsOrigins.length === 0) {
    erros.push('CORS_ORIGINS é obrigatória em produção (lista separada por vírgula)');
  }

  const porta = Number(env.PORT || 3001);
  if (!Number.isInteger(porta) || porta <= 0 || porta > 65535) {
    erros.push(`PORT inválida: ${env.PORT}`);
  }

  if (erros.length > 0) {
    throw new Error(
      'Configuração inválida:\n' + erros.map((e) => `  - ${e}`).join('\n'),
    );
  }

  return {
    DATABASE_URL: databaseUrl as string,
    JWT_SECRET: jwtSecret as string,
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN || '7d',
    FRONTEND_URL: frontendUrl,
    CORS_ORIGINS: corsOrigins,
    PORT: porta,
    NODE_ENV: nodeEnv,
    isProducao,
  };
}
