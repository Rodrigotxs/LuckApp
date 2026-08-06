import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Unidades')
@Controller('units')
export class UnitsController {
  constructor(private unitsService: UnitsService) {}

  @Public()
  @Get('public/:ownerId')
  @ApiOperation({ summary: 'Lista pública de unidades para agendamento' })
  listarPublico(@Param('ownerId') ownerId: string) {
    return this.unitsService.listarPublico(ownerId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Lista unidades do dono' })
  listar(@CurrentUser() user: any) {
    return this.unitsService.listar(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Cria nova unidade' })
  criar(@CurrentUser() user: any, @Body() dto: CreateUnitDto) {
    return this.unitsService.criar(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  atualizar(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.atualizar(user.id, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  desativar(@CurrentUser() user: any, @Param('id') id: string) {
    return this.unitsService.desativar(user.id, id);
  }
}
