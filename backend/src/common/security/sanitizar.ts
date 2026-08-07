/**
 * Remoção de campos sensíveis antes de qualquer resposta da API.
 *
 * Existe porque a mesma desestruturação manual estava escrita em três lugares
 * — duas vezes no OwnersService e uma no AuthService. Regra repetida é regra
 * que diverge: quando a migration do login social acrescentou campos, nenhuma
 * das três listas foi atualizada. Ninguém percebeu porque nada quebra quando
 * um segredo VAZA; só quando ele some.
 *
 * A lista abaixo é a fonte única, e o teste `sanitizar.spec.ts` falha se o
 * schema ganhar um campo com cara de segredo que não esteja aqui.
 */

/** Campos que nunca podem sair da API, em nenhuma resposta. */
export const CAMPOS_SENSIVEIS = [
  // Credenciais
  'passwordHash',
  // Códigos de uso único e seus contadores
  'otpCode',
  'otpExpiresAt',
  'otpAttempts',
  'emailOtpCode',
  'emailOtpExpiresAt',
  'emailOtpAttempts',
  // Recuperação de conta
  'passwordResetToken',
  'passwordResetExpires',
  // Tokens de terceiros — dão acesso à agenda do dono no Google
  'googleAccessToken',
  'googleRefreshToken',
  'googleTokenExpiresAt',
] as const;

export type CampoSensivel = (typeof CAMPOS_SENSIVEIS)[number];

/**
 * Devolve uma cópia do registro sem nenhum campo sensível.
 *
 * Trabalha por lista de exclusão porque o oposto — listar o que pode sair —
 * quebraria toda vez que o modelo ganhasse um campo novo e legítimo. O preço
 * é ter que lembrar de incluir segredo novo aqui, e é exatamente isso que o
 * teste estrutural cobre.
 */
export function sanitizar<T extends Record<string, any>>(registro: T): Partial<T> {
  if (!registro) return registro;
  const limpo: Record<string, any> = {};
  for (const [chave, valor] of Object.entries(registro)) {
    if (!(CAMPOS_SENSIVEIS as readonly string[]).includes(chave)) {
      limpo[chave] = valor;
    }
  }
  return limpo as Partial<T>;
}

/**
 * Sanitiza um dono e acrescenta os sinalizadores derivados que a interface
 * precisa — sem entregar o segredo que os origina.
 *
 * `googleConnected` diz "há integração ativa" sem devolver o token;
 * `temSenha` diz "esta conta tem senha" sem devolver o hash.
 */
export function sanitizarOwner<T extends Record<string, any>>(owner: T) {
  if (!owner) return owner;
  return {
    ...sanitizar(owner),
    googleConnected: Boolean(owner.googleAccessToken && owner.googleRefreshToken),
    temSenha: Boolean(owner.passwordHash),
  };
}

/** Sanitiza uma lista inteira. */
export function sanitizarLista<T extends Record<string, any>>(registros: T[]): Partial<T>[] {
  return (registros ?? []).map((r) => sanitizar(r));
}
