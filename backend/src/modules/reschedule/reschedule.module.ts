import { Module } from '@nestjs/common';
import { RescheduleController } from './reschedule.controller';
import { RescheduleService } from './reschedule.service';
import { WhatsappModule } from '../integrations/whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  controllers: [RescheduleController],
  providers: [RescheduleService],
  exports: [RescheduleService],
})
export class RescheduleModule {}
