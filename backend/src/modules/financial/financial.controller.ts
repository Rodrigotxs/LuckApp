import { BadRequestException, Controller, Get, Patch, Query, Body, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { Response } from 'express';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;
function assertDate(value: string, name: string) {
  if (!value || !ISO_DATE.test(value)) {
    throw new BadRequestException(`${name} inválida (formato esperado: YYYY-MM-DD)`);
  }
}

class UpdateGoalDto {
  @IsNumber()
  @Min(0)
  monthlyGoal: number;
}

type Periodo = 'today' | 'week' | 'month' | 'year';
type PaymentMethodFilter = 'CASH' | 'PIX' | 'CARD' | undefined;

@ApiTags('Financeiro')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
  constructor(private financialService: FinancialService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro por período' })
  resumo(
    @CurrentUser() user: any,
    @Query('period') period: Periodo = 'month',
    @Query('serviceId') serviceId?: string,
    @Query('paymentMethod') paymentMethod?: PaymentMethodFilter,
  ) {
    return this.financialService.resumo(user.id, period, serviceId, paymentMethod);
  }

  @Get('report')
  @ApiOperation({ summary: 'Relatório detalhado por intervalo de datas' })
  relatorio(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('serviceId') serviceId?: string,
    @Query('paymentMethod') paymentMethod?: PaymentMethodFilter,
  ) {
    assertDate(startDate, 'startDate');
    assertDate(endDate, 'endDate');
    return this.financialService.relatorio(user.id, startDate, endDate, serviceId, paymentMethod);
  }

  @Get('export.csv')
  @ApiOperation({ summary: 'Baixa CSV do relatório para Excel' })
  async exportar(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('serviceId') serviceId: string | undefined,
    @Query('paymentMethod') paymentMethod: PaymentMethodFilter,
    @Res() res: Response,
  ) {
    assertDate(startDate, 'startDate');
    assertDate(endDate, 'endDate');
    const csv = await this.financialService.exportarCSV(user.id, startDate, endDate, serviceId, paymentMethod);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-barbearia-luck.csv"`);
    res.send(csv);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Meta mensal e progresso' })
  meta(@CurrentUser() user: any) {
    return this.financialService.meta(user.id);
  }

  @Patch('goals')
  @ApiOperation({ summary: 'Atualiza meta mensal' })
  atualizarMeta(@CurrentUser() user: any, @Body() dto: UpdateGoalDto) {
    return this.financialService.atualizarMeta(user.id, dto.monthlyGoal);
  }
}
