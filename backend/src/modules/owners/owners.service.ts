import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { sanitizarOwner } from '../../common/security/sanitizar';

@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
      include: { workingHours: true },
    });
    if (!owner) throw new NotFoundException('Dono não encontrado');
    return sanitizarOwner(owner);
  }

  /**
   * Retorna o primeiro dono cadastrado — usado pela SPA quando não há link
   * público específico (`/agendar/:ownerId`). Só expõe dados públicos.
   */
  async findDefaultPublic() {
    const owner = await this.prisma.owner.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, barbershopName: true, barbershopAddress: true },
    });
    return owner;
  }

  async update(id: string, dto: UpdateOwnerDto) {
    if (dto.email) {
      const outro = await this.prisma.owner.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (outro) throw new ConflictException('Este e-mail já está em uso');
    }
    if (dto.whatsapp) {
      const outro = await this.prisma.owner.findFirst({
        where: { whatsapp: dto.whatsapp, id: { not: id } },
      });
      if (outro) throw new ConflictException('Este WhatsApp já está em uso');
    }
    const owner = await this.prisma.owner.update({ where: { id }, data: dto });
    return sanitizarOwner(owner);
  }
}
