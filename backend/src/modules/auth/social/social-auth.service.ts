import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PROVIDERS, ProviderId, PerfilSocial } from './social-providers';

export type Papel = 'client' | 'owner';

interface EstadoOAuth {
  provider: ProviderId;
  papel: Papel;
  nonce: string;
}

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  /** O provedor só aparece na interface se estiver realmente configurado. */
  estaConfigurado(provider: ProviderId): boolean {
    const p = PROVIDERS[provider];
    return Boolean(this.config.get(p.envClientId) && this.config.get(p.envClientSecret));
  }

  providersDisponiveis() {
    return (Object.keys(PROVIDERS) as ProviderId[])
      .filter((id) => this.estaConfigurado(id))
      .map((id) => ({ id, nome: PROVIDERS[id].nome }));
  }

  private redirectUri(provider: ProviderId): string {
    const base = this.config.get<string>('API_PUBLIC_URL') || `http://localhost:${this.config.get('PORT') || 3001}`;
    return `${base.replace(/\/$/, '')}/auth/social/${provider}/callback`;
  }

  /**
   * Monta a URL de autorização.
   *
   * O `state` é um JWT curto assinado com o segredo da aplicação. Isso o torna
   * inforjável e resolve duas coisas de uma vez: protege contra CSRF de login
   * (alguém induzir a vítima a completar um fluxo iniciado pelo atacante) e
   * carrega o papel pretendido sem confiar num parâmetro solto na URL de
   * callback, que o usuário poderia trocar de `client` para `owner`.
   */
  gerarUrlAutorizacao(provider: ProviderId, papel: Papel): string {
    if (!this.estaConfigurado(provider)) {
      throw new ServiceUnavailableException(
        `Login com ${PROVIDERS[provider].nome} não está configurado neste ambiente`,
      );
    }

    const p = PROVIDERS[provider];
    const state = this.jwt.sign(
      { provider, papel, nonce: crypto.randomBytes(16).toString('hex') } as EstadoOAuth,
      { expiresIn: '10m' },
    );

    const params = new URLSearchParams({
      client_id: this.config.get(p.envClientId) as string,
      redirect_uri: this.redirectUri(provider),
      response_type: 'code',
      scope: p.escopos.join(' '),
      state,
    });

    if (provider === 'google') {
      // Sem isto o Google reusa o consentimento e nem sempre devolve e-mail.
      params.set('prompt', 'select_account');
    }

    return `${p.urlAutorizacao}?${params.toString()}`;
  }

  private validarEstado(state: string): EstadoOAuth {
    try {
      const dados = this.jwt.verify<EstadoOAuth>(state);
      if (!dados?.provider || !dados?.papel) throw new Error('incompleto');
      return dados;
    } catch {
      // Mensagem única: o motivo exato não interessa a quem forjou.
      throw new UnauthorizedException('Fluxo de login inválido ou expirado. Tente de novo.');
    }
  }

  private async trocarCodigoPorToken(provider: ProviderId, code: string): Promise<string> {
    const p = PROVIDERS[provider];
    try {
      const { data } = await axios.post(
        p.urlToken,
        new URLSearchParams({
          code,
          client_id: this.config.get(p.envClientId) as string,
          client_secret: this.config.get(p.envClientSecret) as string,
          redirect_uri: this.redirectUri(provider),
          grant_type: 'authorization_code',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10_000 },
      );
      if (!data?.access_token) throw new Error('resposta sem access_token');
      return data.access_token;
    } catch (e: any) {
      // O erro do provedor pode conter o client_secret na URL — nunca propagar.
      this.logger.error(`[${provider}] troca de código falhou: ${e?.message}`);
      throw new UnauthorizedException('Não foi possível concluir o login. Tente de novo.');
    }
  }

  private async obterPerfil(provider: ProviderId, accessToken: string): Promise<PerfilSocial> {
    const p = PROVIDERS[provider];
    try {
      const { data } = await axios.get(p.urlPerfil, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10_000,
      });
      return p.normalizar(data);
    } catch (e: any) {
      this.logger.error(`[${provider}] leitura de perfil falhou: ${e?.message}`);
      throw new UnauthorizedException('Não foi possível ler seu perfil no provedor.');
    }
  }

  /** Fluxo completo do callback: código -> perfil -> conta -> token da casa. */
  async concluirLogin(state: string, code: string) {
    if (!code) throw new BadRequestException('Código de autorização ausente');

    const { provider, papel } = this.validarEstado(state);
    const accessToken = await this.trocarCodigoPorToken(provider, code);
    const perfil = await this.obterPerfil(provider, accessToken);

    return papel === 'owner'
      ? this.resolverOwner(provider, perfil)
      : this.resolverCliente(provider, perfil);
  }

  private campoId(provider: ProviderId): 'googleId' | 'facebookId' {
    return provider === 'google' ? 'googleId' : 'facebookId';
  }

  /**
   * Regra de vínculo, igual para os dois papéis:
   *
   *  1. Já existe conta com este id de provedor  -> é ela, entra.
   *  2. Existe conta com este e-mail             -> só vincula se o provedor
   *                                                 confirmou o e-mail.
   *  3. Não existe nada                          -> cria conta nova.
   *
   * O passo 2 é onde mora o risco de tomada de conta, e por isso é o único
   * que impõe condição.
   */
  private async resolverCliente(provider: ProviderId, perfil: PerfilSocial) {
    const campo = this.campoId(provider);

    const porProvedor = await this.prisma.client.findFirst({ where: { [campo]: perfil.providerId } });
    if (porProvedor) return this.emitirSessaoCliente(porProvedor);

    if (perfil.email) {
      const porEmail = await this.prisma.client.findFirst({ where: { email: perfil.email } });
      if (porEmail) {
        if (!perfil.emailVerificado) {
          throw new ConflictException(
            'Já existe uma conta com este e-mail. Entre pelo código enviado por WhatsApp ou e-mail e vincule o login social depois.',
          );
        }
        const atualizado = await this.prisma.client.update({
          where: { id: porEmail.id },
          data: {
            [campo]: perfil.providerId,
            emailVerificado: true,
            avatarUrl: porEmail.avatarUrl ?? perfil.avatarUrl,
          },
        });
        return this.emitirSessaoCliente(atualizado);
      }
    }

    // O cliente é identificado por whatsapp (único) e o social não fornece
    // telefone. Mesmo placeholder já usado no cadastro por e-mail; o usuário
    // corrige no perfil e passa a receber lembrete no WhatsApp.
    const whatsappPlaceholder = perfil.email
      ? `email:${perfil.email}`
      : `${provider}:${perfil.providerId}`;

    const novo = await this.prisma.client.create({
      data: {
        name: perfil.nome || 'Cliente',
        email: perfil.email,
        whatsapp: whatsappPlaceholder,
        [campo]: perfil.providerId,
        emailVerificado: perfil.emailVerificado,
        avatarUrl: perfil.avatarUrl,
      },
    });
    return this.emitirSessaoCliente(novo, true);
  }

  private async resolverOwner(provider: ProviderId, perfil: PerfilSocial) {
    const campo = this.campoId(provider);

    const porProvedor = await this.prisma.owner.findFirst({ where: { [campo]: perfil.providerId } });
    if (porProvedor) return this.emitirSessaoOwner(porProvedor);

    if (!perfil.email) {
      throw new BadRequestException(
        'O provedor não informou um e-mail, e a conta de dono precisa de um. Cadastre-se com e-mail e senha.',
      );
    }

    const porEmail = await this.prisma.owner.findUnique({ where: { email: perfil.email } });
    if (porEmail) {
      if (!perfil.emailVerificado) {
        throw new ConflictException(
          'Já existe uma barbearia com este e-mail. Entre com sua senha e vincule o login social pelo perfil.',
        );
      }
      const atualizado = await this.prisma.owner.update({
        where: { id: porEmail.id },
        data: {
          [campo]: perfil.providerId,
          emailVerificado: true,
          avatarUrl: porEmail.avatarUrl ?? perfil.avatarUrl,
        },
      });
      return this.emitirSessaoOwner(atualizado);
    }

    /*
     * Conta de dono nova pelo social.
     *
     * Só é criada com e-mail verificado. A conta do dono controla agenda,
     * dados pessoais de clientes e faturamento — criar uma a partir de um
     * e-mail não confirmado é abrir a porta para alguém ocupar o e-mail de
     * um negócio real antes do próprio dono.
     */
    if (!perfil.emailVerificado) {
      throw new BadRequestException(
        'Seu e-mail não está confirmado no provedor. Confirme lá e tente de novo, ou cadastre-se com e-mail e senha.',
      );
    }

    const novo = await this.prisma.owner.create({
      data: {
        name: perfil.nome || 'Dono',
        email: perfil.email,
        // Sem senha de propósito: quem entrou pelo social não escolheu uma.
        // Gravar hash de string aleatória criaria uma senha que ninguém
        // conhece mas que existe e vira alvo.
        passwordHash: null,
        whatsapp: '',
        barbershopName: perfil.nome ? `Barbearia de ${perfil.nome.split(' ')[0]}` : 'Minha Barbearia',
        emailVerificado: true,
        avatarUrl: perfil.avatarUrl,
        [campo]: perfil.providerId,
      },
    });
    return this.emitirSessaoOwner(novo, true);
  }

  private emitirSessaoCliente(client: any, novo = false) {
    return {
      token: this.jwt.sign({ sub: client.id, role: 'client' }),
      papel: 'client' as const,
      novo,
      // `cadastroIncompleto` diz à tela que ainda falta o WhatsApp real,
      // sem o qual o cliente não recebe confirmação nem lembrete.
      cadastroIncompleto: !client.whatsapp || client.whatsapp.includes(':'),
      user: {
        id: client.id,
        name: client.name,
        email: client.email,
        whatsapp: client.whatsapp,
        avatarUrl: client.avatarUrl,
      },
    };
  }

  private emitirSessaoOwner(owner: any, novo = false) {
    return {
      token: this.jwt.sign({ sub: owner.id, role: 'owner' }),
      papel: 'owner' as const,
      novo,
      cadastroIncompleto: !owner.whatsapp || !owner.barbershopAddress,
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        barbershopName: owner.barbershopName,
        avatarUrl: owner.avatarUrl,
        // Sinaliza à interface que ainda não há senha definida, para poder
        // oferecer a criação de uma.
        temSenha: Boolean(owner.passwordHash),
      },
    };
  }

  /** URL de volta para o frontend, com o resultado do login. */
  urlRetorno(resultado: { token: string; papel: string; novo: boolean; cadastroIncompleto: boolean }): string {
    const base = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const params = new URLSearchParams({
      token: resultado.token,
      papel: resultado.papel,
      novo: String(resultado.novo),
      completar: String(resultado.cadastroIncompleto),
    });
    return `${base.replace(/\/$/, '')}/auth/callback#${params.toString()}`;
  }

  urlErro(mensagem: string): string {
    const base = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/auth/callback#${new URLSearchParams({ erro: mensagem }).toString()}`;
  }
}
