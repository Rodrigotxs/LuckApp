import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OwnersModule } from './modules/owners/owners.module';
import { ClientsModule } from './modules/clients/clients.module';
import { UnitsModule } from './modules/units/units.module';
import { BarbersModule } from './modules/barbers/barbers.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { FinancialModule } from './modules/financial/financial.module';
import { GoogleCalendarModule } from './modules/integrations/google-calendar/google-calendar.module';
import { WhatsappModule } from './modules/integrations/whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    OwnersModule,
    ClientsModule,
    UnitsModule,
    BarbersModule,
    ServicesModule,
    AppointmentsModule,
    FinancialModule,
    GoogleCalendarModule,
    WhatsappModule,
  ],
})
export class AppModule {}
