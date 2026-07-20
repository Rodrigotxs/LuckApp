import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { SlotsService, Slot } from './slots.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto, UpdatePaymentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Agendamentos')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private appointmentsService: AppointmentsService,
    private slotsService: SlotsService,
  ) {}

  @Public()
  @Get('available-slots')
  slotsDisponiveis(
    @Query('ownerId') ownerId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
    @Query('barberId') barberId?: string,
    @Query('unitId') unitId?: string,
  ): Promise<Slot[]> {
    return this.slotsService.calcularSlotsDisponiveis(ownerId, date, serviceId, barberId, unitId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  criar(@CurrentUser() user: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.criar(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('owner')
  listarOwner(
    @CurrentUser() user: any,
    @Query('data') data?: string,
    @Query('status') status?: string,
  ) {
    return this.appointmentsService.listarDoOwner(user.id, { data, status });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('client')
  listarCliente(@CurrentUser() user: any) {
    return this.appointmentsService.listarDoCliente(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  atualizarStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.appointmentsService.atualizarStatus(user.id, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/payment')
  atualizarPagamento(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.appointmentsService.atualizarPagamento(user.id, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  cancelar(@CurrentUser() user: any, @Param('id') id: string) {
    return this.appointmentsService.cancelar(id, user.id, user.role);
  }
}
