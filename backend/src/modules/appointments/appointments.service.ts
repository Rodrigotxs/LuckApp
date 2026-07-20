import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleCalendarService } from '../integrations/google-calendar/google-calendar.service';
import { WhatsappService } from '../integrations/whatsapp/whatsapp.service';
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
  ) {}

  async criar(clientId: string, dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, ownerId: dto.ownerId, active: true },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    const startAt = parseISO(dto.startAt);
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
    return this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
      include: { client: true, service: true },
    });
  }

  async atualizarPagamento(ownerId: string, id: string, dto: UpdatePaymentDto) {
    await this.verificarPropriedadeOwner(ownerId, id);
    return this.prisma.appointment.update({
      where: { id },
      data: { paymentStatus: dto.paymentStatus, paymentMethod: dto.paymentMethod },
    });
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
