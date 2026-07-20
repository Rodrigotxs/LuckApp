import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleCalendarService } from '../integrations/google-calendar/google-calendar.service';
import { WhatsappService } from '../integrations/whatsapp/whatsapp.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto, UpdatePaymentDto } from './dto/update-appointment.dto';
import { addMinutes, parseISO, startOfDay, endOfDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private googleCalendar: GoogleCalendarService,
    private whatsapp: WhatsappService,
    private loyalty: LoyaltyService,
  ) {}

  async criar(callerId: string, dto: CreateAppointmentDto, callerRole?: 'client' | 'owner') {
    // Se dono criando em nome de outro cliente, usa dto.clientId; senão o próprio caller
    const clientId = callerRole === 'owner' && dto.clientId ? dto.clientId : callerId;

    // Dono agendando para outro cliente: valida que esse cliente existe
    if (callerRole === 'owner' && dto.clientId) {
      const cliente = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
      if (!cliente) throw new NotFoundException('Cliente não encontrado');
    }

    // Dono agendando: o ownerId no dto tem que ser o próprio
    if (callerRole === 'owner' && dto.ownerId !== callerId) {
      throw new ForbiddenException('Não é possível agendar em outra barbearia');
    }

    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, ownerId: dto.ownerId, active: true },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    // barberId (se informado) tem que pertencer ao mesmo dono
    if (dto.barberId) {
      const barber = await this.prisma.barber.findFirst({
        where: { id: dto.barberId, ownerId: dto.ownerId },
      });
      if (!barber) throw new NotFoundException('Barbeiro não encontrado nesta barbearia');
    }
    // unitId (se informado) tem que pertencer ao mesmo dono
    if (dto.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: dto.unitId, ownerId: dto.ownerId },
      });
      if (!unit) throw new NotFoundException('Unidade não encontrada nesta barbearia');
    }

    const startAt = parseISO(dto.startAt);
    // Não permitir agendamento no passado (margem de 1 min)
    if (startAt.getTime() < Date.now() - 60 * 1000) {
      throw new BadRequestException('Horário no passado');
    }
    const endAt = addMinutes(startAt, service.durationMin);

    const conflito = await this.prisma.appointment.findFirst({
      where: {
        ownerId: dto.ownerId,
        ...(dto.barberId ? { barberId: dto.barberId } : {}),
        status: { notIn: ['CANCELLED'] },
        OR: [
          { startAt: { gte: startAt, lt: endAt } },
          { endAt: { gt: startAt, lte: endAt } },
          { startAt: { lte: startAt }, endAt: { gte: endAt } },
        ],
      },
    });
    if (conflito) throw new BadRequestException('Horário já ocupado');

    const appointment = await this.prisma.appointment.create({
      data: {
        ownerId: dto.ownerId,
        clientId,
        serviceId: dto.serviceId,
        unitId: dto.unitId,
        barberId: dto.barberId,
        startAt,
        endAt,
        notes: dto.notes,
      },
      include: { client: true, service: true, owner: true, unit: true, barber: true },
    });

    if (appointment.owner.googleAccessToken && appointment.owner.googleRefreshToken) {
      try {
        const eventId = await this.googleCalendar.criarEvento(
          appointment.owner.googleAccessToken,
          appointment.owner.googleRefreshToken,
          appointment.owner.id,
          {
            titulo: `${service.name} - ${appointment.client.name}`,
            inicio: startAt.toISOString(),
            fim: endAt.toISOString(),
            emailCliente: appointment.client.email,
            descricao: `Cliente: ${appointment.client.name}\nWhatsApp: ${appointment.client.whatsapp}\nServiço: ${service.name}`,
          },
        );
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: eventId },
        });
      } catch {
        // Google Calendar falhou, continua
      }
    }

    try {
      await this.whatsapp.enviarConfirmacao(appointment.client.whatsapp, {
        servico: service.name,
        data: format(startAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        horario: format(startAt, 'HH:mm'),
        endereco: appointment.owner.barbershopAddress || '',
        barbearia: appointment.owner.barbershopName,
      });
    } catch {
      // WhatsApp falhou, continua
    }

    return appointment;
  }

  async listarDoOwner(ownerId: string, filtros: { data?: string; status?: string }) {
    const where: any = { ownerId };
    if (filtros.data) {
      const data = parseISO(filtros.data);
      where.startAt = { gte: startOfDay(data), lte: endOfDay(data) };
    }
    if (filtros.status) where.status = filtros.status;

    return this.prisma.appointment.findMany({
      where,
      include: { client: true, service: true },
      orderBy: { startAt: 'asc' },
    });
  }

  async listarDoCliente(clientId: string) {
    return this.prisma.appointment.findMany({
      where: { clientId },
      include: { service: true, owner: { select: { barbershopName: true, barbershopAddress: true } } },
      orderBy: { startAt: 'desc' },
    });
  }

  async atualizarStatus(ownerId: string, id: string, dto: UpdateStatusDto) {
    await this.verificarPropriedadeOwner(ownerId, id);

    // Se está cancelando, limpar Google Calendar antes de gravar o novo status
    if (dto.status === 'CANCELLED') {
      const anterior = await this.prisma.appointment.findUnique({
        where: { id },
        include: { owner: true },
      });
      if (anterior?.googleEventId && anterior.owner.googleAccessToken && anterior.owner.googleRefreshToken) {
        try {
          await this.googleCalendar.deletarEvento(
            anterior.owner.googleAccessToken,
            anterior.owner.googleRefreshToken,
            anterior.owner.id,
            anterior.googleEventId,
          );
        } catch {
          // Falha silenciosa — evento pode já ter sido removido
        }
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
      include: { client: true, service: true },
    });
    await this.loyalty.concederPontos(id);
    return updated;
  }

  async atualizarPagamento(ownerId: string, id: string, dto: UpdatePaymentDto) {
    await this.verificarPropriedadeOwner(ownerId, id);
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { paymentStatus: dto.paymentStatus, paymentMethod: dto.paymentMethod },
    });
    await this.loyalty.concederPontos(id);
    return updated;
  }

  async cancelar(id: string, userId: string, role: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { owner: true, client: true, service: true },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');

    const autorizado =
      (role === 'owner' && appointment.ownerId === userId) ||
      (role === 'client' && appointment.clientId === userId);
    if (!autorizado) throw new ForbiddenException('Sem permissão');

    if (appointment.googleEventId && appointment.owner.googleAccessToken) {
      try {
        await this.googleCalendar.deletarEvento(
          appointment.owner.googleAccessToken,
          appointment.owner.googleRefreshToken,
          appointment.owner.id,
          appointment.googleEventId,
        );
      } catch {}
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  private async verificarPropriedadeOwner(ownerId: string, id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    if (appointment.ownerId !== ownerId) throw new ForbiddenException('Sem permissão');
    return appointment;
  }
}
