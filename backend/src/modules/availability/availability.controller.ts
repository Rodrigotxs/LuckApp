import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityBlockDto, BlockDayDto, BlockSlotDto } from './dto/availability.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Disponibilidade')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get('blocks')
  @ApiOperation({ summary: 'Lista bloqueios de agenda do dono' })
  listar(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('barberId') barberId?: string,
  ) {
    return this.availabilityService.listar(user.id, from, to, barberId);
  }

  @Post('blocks')
  @ApiOperation({ summary: 'Cria bloqueio genérico (intervalo custom)' })
  criar(@CurrentUser() user: any, @Body() dto: CreateAvailabilityBlockDto) {
    return this.availabilityService.criar(user.id, dto);
  }

  @Post('blocks/day')
  @ApiOperation({ summary: 'Bloqueia um dia inteiro' })
  bloquearDia(@CurrentUser() user: any, @Body() dto: BlockDayDto) {
    return this.availabilityService.bloquearDia(user.id, dto);
  }

  @Post('blocks/slot')
  @ApiOperation({ summary: 'Bloqueia um slot específico' })
  bloquearSlot(@CurrentUser() user: any, @Body() dto: BlockSlotDto) {
    return this.availabilityService.bloquearSlot(user.id, dto);
  }

  @Delete('blocks/:id')
  @ApiOperation({ summary: 'Remove bloqueio (libera o horário)' })
  remover(@CurrentUser() user: any, @Param('id') id: string) {
    return this.availabilityService.remover(user.id, id);
  }
}
