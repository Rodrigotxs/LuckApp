import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Envio de e-mail transacional (OTP e reset de senha).
 *
 * A versão anterior era um esqueleto com dois defeitos sérios:
 *
 *  1. **Mentia.** Com `SMTP_HOST` definido, registrava "Enviado para..." no log
 *     e não enviava nada. Reset de senha e OTP por e-mail quebravam em silêncio,
 *     e o log dizia que tinha dado certo — a pior combinação possível.
 *
 *  2. **Vazava credencial no log.** Sem SMTP, imprimia o corpo inteiro da
 *     mensagem, o que inclui o código OTP e o link de reset. Em desenvolvimento
 *     isso é o mecanismo esperado; em produção é entregar a chave da conta a
 *     quem tiver acesso ao log.
 *
 * Agora: envia de verdade, falha alto quando não consegue, e o modo "só log"
 * existe apenas fora de produção.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly host: string;
  private readonly from: string;
  private readonly isProducao: boolean;
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    this.host = config.get<string>('SMTP_HOST', '');
    this.from = config.get<string>('SMTP_FROM', 'nao-responda@barbearialuck.com');
    this.isProducao = config.get<string>('NODE_ENV') === 'production';

    if (this.host) {
      const porta = Number(config.get('SMTP_PORT', 587));
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: porta,
        // 465 é TLS implícito; as demais usam STARTTLS.
        secure: porta === 465,
        auth: config.get('SMTP_USER')
          ? { user: config.get<string>('SMTP_USER'), pass: config.get<string>('SMTP_PASS') }
          : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
      });
    }
  }

  /**
   * Confere a conexão SMTP na subida.
   *
   * Descobrir que a senha do SMTP está errada no momento em que um cliente
   * tenta recuperar a senha é tarde demais. Melhor saber ao subir.
   */
  async onModuleInit() {
    if (!this.transporter) {
      const aviso =
        'SMTP_HOST não configurado: e-mails de OTP e reset NÃO serão enviados.';
      if (this.isProducao) {
        // Em produção isso é falha de configuração, não modo de desenvolvimento.
        this.logger.error(`${aviso} O fluxo de recuperação de conta está quebrado.`);
      } else {
        this.logger.warn(`${aviso} Os códigos aparecem no log abaixo.`);
      }
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log(`SMTP conectado em ${this.host}`);
    } catch (e: any) {
      // Não derruba a aplicação: o resto do produto funciona sem e-mail.
      // Mas registra como ERRO, e cada envio vai falhar alto a partir daqui.
      this.logger.error(`SMTP configurado mas inacessível (${this.host}): ${e?.message}`);
    }
  }

  async enviarOtp(email: string, codigo: string): Promise<void> {
    await this.enviar(
      email,
      'Seu código de verificação — Barbearia Luck',
      `Olá,\n\n` +
        `Seu código de verificação é: ${codigo}\n\n` +
        `Válido por 10 minutos. Se você não solicitou, ignore esta mensagem.\n\n` +
        `— Equipe Barbearia Luck`,
      // Marca o conteúdo como sensível: nunca vai para o log em produção.
      { sensivel: true },
    );
  }

  async enviarResetSenha(email: string, link: string): Promise<void> {
    await this.enviar(
      email,
      'Redefinir senha — Barbearia Luck',
      `Olá,\n\n` +
        `Toque no link abaixo para escolher uma nova senha (válido por 1 h):\n${link}\n\n` +
        `Se você não solicitou, ignore esta mensagem.`,
      { sensivel: true },
    );
  }

  private async enviar(
    email: string,
    assunto: string,
    corpo: string,
    { sensivel = false }: { sensivel?: boolean } = {},
  ): Promise<void> {
    if (!this.transporter) {
      /*
       * Sem SMTP configurado.
       *
       * Em produção isto é uma falha, e precisa estourar: quem chamou espera
       * que o usuário receba alguma coisa. Silenciar aqui é o bug que estamos
       * corrigindo.
       *
       * Fora de produção, imprimir o código no log É o mecanismo de teste
       * documentado — sem ele não dá para desenvolver o fluxo de OTP.
       */
      if (this.isProducao) {
        throw new ServiceUnavailableException(
          'Serviço de e-mail indisponível. Tente pelo WhatsApp.',
        );
      }
      this.logger.warn(`[DEV] E-mail não enviado (sem SMTP). Para ${email}:\n${corpo}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.from, to: email, subject: assunto, text: corpo });
      // O log registra o destinatário e o assunto, nunca o corpo — que carrega
      // o código e o link de uso único.
      this.logger.log(`E-mail enviado para ${this.mascarar(email)}: ${assunto}`);
    } catch (e: any) {
      // Falha alto. Antes, o erro nem existia porque nada era enviado.
      this.logger.error(
        `Falha ao enviar e-mail para ${this.mascarar(email)}: ${e?.message}`,
        sensivel ? undefined : e?.stack,
      );
      throw new ServiceUnavailableException(
        'Não foi possível enviar o e-mail agora. Tente novamente em instantes.',
      );
    }
  }

  /**
   * `ana.silva@gmail.com` vira `an***@gmail.com`.
   *
   * E-mail em log é dado pessoal sob a LGPD, e log costuma ser centralizado,
   * retido por muito tempo e visível para mais gente do que se imagina.
   */
  private mascarar(email: string): string {
    const [usuario, dominio] = email.split('@');
    if (!dominio) return '***';
    const visivel = usuario.slice(0, 2);
    return `${visivel}${'*'.repeat(Math.max(1, usuario.length - 2))}@${dominio}`;
  }
}
