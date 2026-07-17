import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async listarClientes(ownerId: string) {
    const agendamentos = await this.prisma.appointment.findMany({
      where: { ownerId },
      include: { client: true, service: true },
      orderBy: { startAt: 'desc' },
      distinct: ['clientId'],
    });

    return agendamentos.map((a) => ({
      ...a.client,
      ultimoServico: a.service.name,
      ultimoAgendamento: a.startAt,
    }));
  }
}
