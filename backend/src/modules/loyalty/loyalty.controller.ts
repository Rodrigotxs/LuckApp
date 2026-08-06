import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Fidelidade')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Status de fidelidade do cliente autenticado' })
  status(@CurrentUser() user: any) {
    return this.loyaltyService.obterStatus(user.id);
  }

  @Post('me/redeem')
  @ApiOperation({ summary: 'Resgatar recompensa (corte grátis)' })
  resgatar(@CurrentUser() user: any) {
    return this.loyaltyService.resgatar(user.id);
  }
}
