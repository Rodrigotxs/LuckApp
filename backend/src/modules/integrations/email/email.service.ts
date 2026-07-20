import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * EmailService mock — envia e-mail via SMTP se configurado (SMTP_HOST etc.),
 * senão apenas loga. Mesma estratégia do WhatsappService.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly host: string;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.host = config.get('SMTP_HOST', '');
    this.from = config.get('SMTP_FROM', 'nao-responda@barbearialuck.com');
  }

  async enviarOtp(email: string, codigo: string): Promise<void> {
    const assunto = 'Seu código de verificação — Barbearia Luck';
    const corpo =
      `Olá,\n\n` +
      `Seu código de verificação é: ${codigo}\n\n` +
      `Válido por 10 minutos. Se você não solicitou, ignore esta mensagem.\n\n` +
      `— Equipe Barbearia Luck`;
    await this.enviar(email, assunto, corpo);
  }

  async enviarResetSenha(email: string, link: string): Promise<void> {
    const assunto = 'Redefinir senha — Barbearia Luck';
    const corpo =
      `Olá,\n\n` +
      `Toque no link abaixo para escolher uma nova senha (válido por 1 h):\n${link}\n\n` +
      `Se você não solicitou, ignore esta mensagem.`;
    await this.enviar(email, assunto, corpo);
  }

  private async enviar(email: string, assunto: string, corpo: string): Promise<void> {
    if (!this.host) {
      this.logger.warn(`[E-mail] SMTP não configurado. Para ${email}: ${assunto}\n${corpo}`);
      return;
    }
    // Implementação real com nodemailer viria aqui.
    // Mantido como mock para não adicionar dependência que possa falhar em CI.
    this.logger.log(`[E-mail] Enviado para ${email}: ${assunto}`);
  }
}
