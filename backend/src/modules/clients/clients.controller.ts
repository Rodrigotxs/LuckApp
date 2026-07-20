import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Roles('owner')
  @Get()
  @ApiOperation({ summary: 'Lista clientes do dono autenticado' })
  listar(@CurrentUser() user: any) {
    return this.clientsService.listarClientes(user.id);
  }

  @Roles('client')
  @Get('me')
  @ApiOperation({ summary: 'Retorna dados do cliente autenticado' })
  perfil(@CurrentUser() user: any) {
    return this.clientsService.findById(user.id);
  }

  @Roles('client')
  @Patch('me')
  @ApiOperation({ summary: 'Atualiza dados do cliente autenticado' })
  atualizar(@CurrentUser() user: any, @Body() dto: UpdateClientDto) {
    return this.clientsService.atualizar(user.id, dto);
  }

  @Roles('owner')
  @Post('find-or-create')
  @ApiOperation({ summary: 'Dono cria/localiza um cliente pelo WhatsApp (para agendar manualmente)' })
  findOrCreate(@Body() dto: { name: string; whatsapp: string; email?: string }) {
    return this.clientsService.findOrCreate(dto);
  }
}
