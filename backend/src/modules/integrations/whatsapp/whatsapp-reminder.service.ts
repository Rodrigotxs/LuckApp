import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { format, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class WhatsappReminderService {
  private readonly logger = new Logger(WhatsappReminderService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
  ) {}

  // Executa a cada 5 minutos verificando agendamentos 1h à frente
  @Cron('*/5 * * * *')
  async enviarLembretes() {
    const agora = new Date();
    const em1hora = addHours(agora, 1);
    const inicio = new Date(em1hora.getTime() - 2.5 * 60 * 1000);
    const fim = new Date(em1hora.getTime() + 2.5 * 60 * 1000);

    const agendamentos = await this.prisma.appointment.findMany({
      where: {
        startAt: { gte: inicio, lte: fim },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: { client: true, service: true, owner: true },
    });

    for (const agendamento of agendamentos) {
      try {
        await this.whatsapp.enviarLembrete(agendamento.client.whatsapp, {
          servico: agendamento.service.name,
          data: format(agendamento.startAt, "dd 'de' MMMM", { locale: ptBR }),
          horario: format(agendamento.startAt, 'HH:mm'),
          endereco: agendamento.owner.barbershopAddress || '',
          barbearia: agendamento.owner.barbershopName,
        });
        this.logger.log(`Lembrete enviado para ${agendamento.client.name}`);
      } catch {
        this.logger.warn(`Falha ao enviar lembrete para ${agendamento.client.whatsapp}`);
      }
    }
  }
}
