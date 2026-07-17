import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappReminderService } from './whatsapp-reminder.service';

@Module({
  providers: [WhatsappService, WhatsappReminderService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
