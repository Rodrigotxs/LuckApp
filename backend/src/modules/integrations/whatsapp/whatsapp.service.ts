import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface ConfirmacaoParams {
  servico: string;
  data: string;
  horario: string;
  endereco: string;
  barbearia: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly instance: string;

  constructor(private config: ConfigService) {
    this.apiUrl = config.get('WHATSAPP_API_URL', '');
    this.apiKey = config.get('WHATSAPP_API_KEY', '');
    this.instance = config.get('WHATSAPP_INSTANCE', 'default');
  }

  async enviarOtp(whatsapp: string, codigo: string): Promise<void> {
    const mensagem = `🔐 *Barbearia Luck*\n\nSeu código de verificação é: *${codigo}*\n\nVálido por 10 minutos. Não compartilhe com ninguém.`;
    await this.enviarMensagem(whatsapp, mensagem);
  }

  async enviarConfirmacao(whatsapp: string, params: ConfirmacaoParams): Promise<void> {
    const mensagem =
      `✂️ *Agendamento Confirmado!*\n\n` +
      `📋 Serviço: ${params.servico}\n` +
      `📅 Data: ${params.data}\n` +
      `🕐 Horário: ${params.horario}\n` +
      `📍 Endereço: ${params.endereco}\n\n` +
      `_Para cancelar, responda CANCELAR_`;
    await this.enviarMensagem(whatsapp, mensagem);
  }

  async enviarLembrete(whatsapp: string, params: ConfirmacaoParams): Promise<void> {
    const mensagem =
      `⏰ *Lembrete - ${params.barbearia}*\n\n` +
      `Você tem um agendamento em 1 hora!\n\n` +
      `📋 Serviço: ${params.servico}\n` +
      `🕐 Horário: ${params.horario}\n` +
      `📍 Endereço: ${params.endereco}`;
    await this.enviarMensagem(whatsapp, mensagem);
  }

  /** Envio genérico — usado por outros módulos para notificações customizadas. */
  async notificar(whatsapp: string, mensagem: string): Promise<void> {
    return this.enviarMensagem(whatsapp, mensagem);
  }

  private async enviarMensagem(numero: string, mensagem: string): Promise<void> {
    if (!this.apiUrl || !this.apiKey) {
      this.logger.warn(`[WhatsApp] API não configurada. Mensagem para ${numero}: ${mensagem}`);
      return;
    }

    try {
      await axios.post(
        `${this.apiUrl}/message/sendText/${this.instance}`,
        { number: numero, text: mensagem },
        { headers: { apikey: this.apiKey } },
      );
      this.logger.log(`[WhatsApp] Mensagem enviada para ${numero}`);
    } catch (error) {
      this.logger.error(`[WhatsApp] Falha ao enviar para ${numero}:`, error.message);
      throw error;
    }
  }
}
