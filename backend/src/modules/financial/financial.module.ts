import { Module } from '@nestjs/common';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { OwnersModule } from '../owners/owners.module';

@Module({
  imports: [OwnersModule],
  controllers: [FinancialController],
  providers: [FinancialService],
})
export class FinancialModule {}
