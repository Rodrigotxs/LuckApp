import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    // Não expõe campos sensíveis
    const { otpCode, otpExpiresAt, emailOtpCode, emailOtpExpiresAt, passwordResetToken, passwordResetExpires, ...safe } = client;
    return safe;
  }

  async atualizar(id: string, dto: UpdateClientDto) {
    // Se trocando WhatsApp, garante unicidade
    if (dto.whatsapp) {
      const outro = await this.prisma.client.findFirst({
        where: { whatsapp: dto.whatsapp, id: { not: id } },
      });
      if (outro) throw new ConflictException('Este WhatsApp já está em uso');
    }
    const client = await this.prisma.client.update({ where: { id }, data: dto });
    const { otpCode, otpExpiresAt, emailOtpCode, emailOtpExpiresAt, passwordResetToken, passwordResetExpires, ...safe } = client;
    return safe;
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
