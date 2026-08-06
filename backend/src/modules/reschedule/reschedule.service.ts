import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgendaRulesService } from '../appointments/agenda-rules.service';
import { WhatsappService } from '../integrations/whatsapp/whatsapp.service';
import { CreateRescheduleDto, UpdateRescheduleDto } from './dto/reschedule.dto';
import { parseISO, addMinutes, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class RescheduleService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private agenda: AgendaRulesService,
  ) {}

  async solicitar(clientId: string, dto: CreateRescheduleDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { owner: true, service: true },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    if (appointment.clientId !== clientId) throw new ForbiddenException('Sem permissão');
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      throw new BadRequestException('Não é possível remarcar este agendamento');
    }

    // Recusa horário no passado já aqui. Antes, só a aprovação verificava —
    // então o pedido ficava pendente na fila do dono para morrer no clique.
    if (parseISO(dto.requestedStart).getTime() < Date.now() - 60 * 1000) {
      throw new BadRequestException('Horário solicitado está no passado');
    }

    // Cancelar pedidos pendentes anteriores para o mesmo agendamento
    await this.prisma.rescheduleRequest.updateMany({
      where: { appointmentId: dto.appointmentId, status: 'PENDING' },
      data: { status: 'CANCELLED_BY_CLIENT', respondedAt: new Date() },
    });

    const request = await this.prisma.rescheduleRequest.create({
      data: {
        appointmentId: dto.appointmentId,
        clientId,
        ownerId: appointment.ownerId,
        requestedStart: parseISO(dto.requestedStart),
        message: dto.message,
      },
    });

    // Notificar dono via WhatsApp
    try {
      await this.whatsapp.notificar(
        appointment.owner.whatsapp,
        `📅 *Pedido de reagendamento*\n\n` +
          `Um cliente solicitou remarcar o agendamento de ${appointment.service.name} ` +
          `para ${format(parseISO(dto.requestedStart), "dd/MM 'às' HH:mm", { locale: ptBR })}.\n\n` +
          `Acesse o painel para aprovar ou recusar.`,
      );
    } catch {
      // Falha silenciosa na notificação
    }

    return request;
  }

  async listarDoCliente(clientId: string) {
    return this.prisma.rescheduleRequest.findMany({
      where: { clientId },
      include: {
        appointment: { include: { service: true, owner: { select: { barbershopName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listarDoDono(ownerId: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.rescheduleRequest.findMany({
      where: { ownerId, ...(status ? { status } : {}) },
      include: {
        appointment: { include: { service: true } },
        client: { select: { id: true, name: true, whatsapp: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async responder(ownerId: string, id: string, dto: UpdateRescheduleDto) {
    const request = await this.prisma.rescheduleRequest.findUnique({
      where: { id },
      include: {
        appointment: { include: { service: true, owner: true } },
        client: true,
      },
    });
    if (!request) throw new NotFoundException('Pedido não encontrado');
    if (request.ownerId !== ownerId) throw new ForbiddenException('Sem permissão');
    if (request.status !== 'PENDING') throw new BadRequestException('Pedido já respondido');

    // Aprovado → move o agendamento para o novo horário
    if (dto.status === 'APPROVED') {
      if (request.requestedStart.getTime() < Date.now() - 60 * 1000) {
        throw new BadRequestException('Não é possível aprovar remarcação para horário no passado');
      }
      const newEnd = addMinutes(request.requestedStart, request.appointment.service.durationMin);
      const barberId = request.appointment.barberId;

      // As mesmas regras da criação valem aqui. Enquanto elas moravam só no
      // AppointmentsService, aprovar um reagendamento conseguia mover o
      // atendimento para fora do expediente ou para cima de um bloqueio.
      await this.agenda.validarJanela(ownerId, request.requestedStart, newEnd, barberId);

      // O escopo do conflito inclui o barbeiro: antes filtrava só por dono, e
      // um horário ocupado com outro barbeiro barrava a remarcação sem motivo.
      const conflito = await this.agenda.encontrarConflito(
        ownerId,
        request.requestedStart,
        newEnd,
        barberId,
        request.appointmentId,
      );
      if (conflito) throw new ConflictException('Horário solicitado indisponível');

      try {
        await this.prisma.appointment.update({
          where: { id: request.appointmentId },
          data: { startAt: request.requestedStart, endAt: newEnd },
        });
      } catch (e: any) {
        // A constraint EXCLUDE do banco é quem arbitra a corrida. Sem esta
        // tradução, quem perde recebe 500 com erro de Prisma.
        if (this.agenda.ehConflitoDeBanco(e)) {
          throw new ConflictException('Horário solicitado indisponível');
        }
        throw e;
      }
    }

    const updated = await this.prisma.rescheduleRequest.update({
      where: { id },
      data: { status: dto.status, respondedAt: new Date() },
    });

    // Notificar cliente
    try {
      const msg =
        dto.status === 'APPROVED'
          ? `✅ *Reagendamento aprovado*\n\n` +
            `Seu horário foi remarcado para ` +
            `${format(request.requestedStart, "dd/MM 'às' HH:mm", { locale: ptBR })}.`
          : `❌ *Reagendamento recusado*\n\n` +
            `Infelizmente o novo horário solicitado não foi aprovado. ` +
            `Entre em contato com a barbearia para mais opções.`;
      await this.whatsapp.notificar(request.client.whatsapp, msg);
    } catch {}

    return updated;
  }

  async cancelar(clientId: string, id: string) {
    const request = await this.prisma.rescheduleRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Pedido não encontrado');
    if (request.clientId !== clientId) throw new ForbiddenException('Sem permissão');
    if (request.status !== 'PENDING') throw new BadRequestException('Pedido já respondido');

    return this.prisma.rescheduleRequest.update({
      where: { id },
      data: { status: 'CANCELLED_BY_CLIENT', respondedAt: new Date() },
    });
  }
}
