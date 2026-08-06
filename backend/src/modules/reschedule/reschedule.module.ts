import { Module } from '@nestjs/common';
import { RescheduleController } from './reschedule.controller';
import { RescheduleService } from './reschedule.service';
import { WhatsappModule } from '../integrations/whatsapp/whatsapp.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [WhatsappModule, AppointmentsModule],
  controllers: [RescheduleController],
  providers: [RescheduleService],
  exports: [RescheduleService],
})
export class RescheduleModule {}
