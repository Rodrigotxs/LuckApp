/**
 * Configuração dos provedores de login social.
 *
 * Cada provedor é descrito por dados, não por código espalhado: adicionar
 * Apple ou GitHub amanhã é acrescentar uma entrada aqui e nada mais.
 */

export type ProviderId = 'google' | 'facebook';

/** Perfil normalizado — o resto do sistema não sabe de qual provedor veio. */
export interface PerfilSocial {
  /** Id do usuário DENTRO do provedor. Estável, é a chave de vínculo. */
  providerId: string;
  email: string | null;
  /**
   * Se o provedor confirmou o e-mail.
   *
   * É o campo mais importante deste arquivo. Vincular um login social a uma
   * conta existente só pela igualdade de e-mail, sem exigir verificação,
   * permite tomada de conta: o atacante cria uma conta no provedor usando o
   * e-mail da vítima e entra como ela.
   */
  emailVerificado: boolean;
  nome: string | null;
  avatarUrl: string | null;
}

export interface ProviderConfig {
  id: ProviderId;
  nome: string;
  urlAutorizacao: string;
  urlToken: string;
  urlPerfil: string;
  escopos: string[];
  envClientId: string;
  envClientSecret: string;
  /** Converte a resposta crua do provedor no perfil normalizado. */
  normalizar: (bruto: any) => PerfilSocial;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  google: {
    id: 'google',
    nome: 'Google',
    urlAutorizacao: 'https://accounts.google.com/o/oauth2/v2/auth',
    urlToken: 'https://oauth2.googleapis.com/token',
    urlPerfil: 'https://openidconnect.googleapis.com/v1/userinfo',
    escopos: ['openid', 'email', 'profile'],
    envClientId: 'GOOGLE_CLIENT_ID',
    envClientSecret: 'GOOGLE_CLIENT_SECRET',
    normalizar: (b) => ({
      providerId: String(b.sub),
      email: b.email ?? null,
      emailVerificado: b.email_verified === true || b.email_verified === 'true',
      nome: b.name ?? null,
      avatarUrl: b.picture ?? null,
    }),
  },

  facebook: {
    id: 'facebook',
    nome: 'Facebook',
    urlAutorizacao: 'https://www.facebook.com/v19.0/dialog/oauth',
    urlToken: 'https://graph.facebook.com/v19.0/oauth/access_token',
    urlPerfil: 'https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)',
    escopos: ['email', 'public_profile'],
    envClientId: 'FACEBOOK_CLIENT_ID',
    envClientSecret: 'FACEBOOK_CLIENT_SECRET',
    normalizar: (b) => ({
      providerId: String(b.id),
      email: b.email ?? null,
      /*
       * O Facebook só devolve `email` quando ele já está confirmado na conta —
       * a Graph API omite o campo caso contrário. Não existe um
       * `email_verified` explícito, então a presença do campo é o sinal.
       *
       * Ainda assim isto é mais frágil que o `email_verified` do Google, e é
       * por isso que o vínculo com conta existente exige confirmação extra
       * quando vem do Facebook. Ver SocialAuthService.
       */
      emailVerificado: Boolean(b.email),
      nome: b.name ?? null,
      avatarUrl: b.picture?.data?.url ?? null,
    }),
  },
};

export function ehProviderValido(v: string): v is ProviderId {
  return v === 'google' || v === 'facebook';
}
