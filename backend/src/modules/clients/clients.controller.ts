import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista clientes do dono autenticado' })
  listar(@CurrentUser() user: any) {
    return this.clientsService.listarClientes(user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna dados do cliente autenticado' })
  perfil(@CurrentUser() user: any) {
    return this.clientsService.findById(user.id);
  }
}
