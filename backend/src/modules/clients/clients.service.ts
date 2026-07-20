import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateClientDto } from './dto/update-client.dto';

// Campos sensíveis que nunca devem sair do backend
function sanitizarClient<T extends Record<string, any>>(client: T): Omit<T, 'passwordHash' | 'otpCode' | 'otpExpiresAt' | 'emailOtpCode' | 'emailOtpExpiresAt' | 'passwordResetToken' | 'passwordResetExpires'> {
  const {
    passwordHash, otpCode, otpExpiresAt,
    emailOtpCode, emailOtpExpiresAt,
    passwordResetToken, passwordResetExpires,
    ...safe
  } = client as any;
  return safe;
}

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return sanitizarClient(client);
  }

  /** Usado pelo painel do dono ao agendar manualmente para um cliente sem cadastro. */
  async findOrCreate(data: { name: string; whatsapp: string; email?: string }) {
    const existente = await this.prisma.client.findUnique({ where: { whatsapp: data.whatsapp } });
    if (existente) return sanitizarClient(existente);
    const criado = await this.prisma.client.create({ data });
    return sanitizarClient(criado);
  }

  async atualizar(id: string, dto: UpdateClientDto) {
    if (dto.whatsapp) {
      const outro = await this.prisma.client.findFirst({
        where: { whatsapp: dto.whatsapp, id: { not: id } },
      });
      if (outro) throw new ConflictException('Este WhatsApp já está em uso');
    }
    if (dto.email) {
      const outro = await this.prisma.client.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (outro) throw new ConflictException('Este e-mail já está em uso');
    }
    const client = await this.prisma.client.update({ where: { id }, data: dto });
    return sanitizarClient(client);
  }

  async listarClientes(ownerId: string) {
    const agendamentos = await this.prisma.appointment.findMany({
      where: { ownerId },
      include: {
        // Só busca campos públicos do cliente
        client: {
          select: {
            id: true, name: true, whatsapp: true, email: true,
            loyaltyPoints: true, createdAt: true,
          },
        },
        service: { select: { name: true } },
      },
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
