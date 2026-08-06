import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BarbersService } from './barbers.service';
import { CreateBarberDto, UpdateBarberDto } from './dto/barber.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Barbeiros')
@Controller('barbers')
export class BarbersController {
  constructor(private barbersService: BarbersService) {}

  @Public()
  @Get('public/:ownerId')
  @ApiOperation({ summary: 'Lista pública de barbeiros (opcionalmente filtrada por unidade)' })
  listarPublico(@Param('ownerId') ownerId: string, @Query('unitId') unitId?: string) {
    return this.barbersService.listarPublico(ownerId, unitId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  listar(@CurrentUser() user: any, @Query('unitId') unitId?: string) {
    return this.barbersService.listar(user.id, unitId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  criar(@CurrentUser() user: any, @Body() dto: CreateBarberDto) {
    return this.barbersService.criar(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  atualizar(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateBarberDto) {
    return this.barbersService.atualizar(user.id, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  desativar(@CurrentUser() user: any, @Param('id') id: string) {
    return this.barbersService.desativar(user.id, id);
  }
}
