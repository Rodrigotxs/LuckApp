import { Controller, Get, Patch, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class UpdateGoalDto {
  @IsNumber()
  @Min(0)
  monthlyGoal: number;
}

@ApiTags('Financeiro')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
  constructor(private financialService: FinancialService) {}

  @Get('summary')
  resumo(@CurrentUser() user: any, @Query('period') period: 'today' | 'week' | 'month' = 'month') {
    return this.financialService.resumo(user.id, period);
  }

  @Get('report')
  relatorio(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialService.relatorio(user.id, startDate, endDate);
  }

  @Get('goals')
  meta(@CurrentUser() user: any) {
    return this.financialService.meta(user.id);
  }

  @Patch('goals')
  atualizarMeta(@CurrentUser() user: any, @Body() dto: UpdateGoalDto) {
    return this.financialService.atualizarMeta(user.id, dto.monthlyGoal);
  }
}
