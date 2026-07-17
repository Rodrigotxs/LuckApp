import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SlotsService } from './slots.service';
import { ServicesModule } from '../services/services.module';
import { GoogleCalendarModule } from '../integrations/google-calendar/google-calendar.module';
import { WhatsappModule } from '../integrations/whatsapp/whatsapp.module';

@Module({
  imports: [ServicesModule, GoogleCalendarModule, WhatsappModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, SlotsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
