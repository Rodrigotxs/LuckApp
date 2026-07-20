import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RescheduleService } from './reschedule.service';
import { CreateRescheduleDto, UpdateRescheduleDto } from './dto/reschedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reagendamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reschedule-requests')
export class RescheduleController {
  constructor(private rescheduleService: RescheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Cliente solicita reagendamento' })
  solicitar(@CurrentUser() user: any, @Body() dto: CreateRescheduleDto) {
    return this.rescheduleService.solicitar(user.id, dto);
  }

  @Get('client')
  @ApiOperation({ summary: 'Cliente lista seus pedidos' })
  listarCliente(@CurrentUser() user: any) {
    return this.rescheduleService.listarDoCliente(user.id);
  }

  @Get('owner')
  @ApiOperation({ summary: 'Dono lista pedidos recebidos' })
  listarDono(@CurrentUser() user: any, @Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.rescheduleService.listarDoDono(user.id, status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Dono aprova ou recusa pedido' })
  responder(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateRescheduleDto) {
    return this.rescheduleService.responder(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cliente cancela seu pedido pendente' })
  cancelar(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rescheduleService.cancelar(user.id, id);
  }
}
