import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { OwnersModule } from './modules/owners/owners.module';
import { ClientsModule } from './modules/clients/clients.module';
import { UnitsModule } from './modules/units/units.module';
import { BarbersModule } from './modules/barbers/barbers.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { RescheduleModule } from './modules/reschedule/reschedule.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { FinancialModule } from './modules/financial/financial.module';
import { GoogleCalendarModule } from './modules/integrations/google-calendar/google-calendar.module';
import { WhatsappModule } from './modules/integrations/whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Dois níveis: rajada curta e teto por minuto. Rotas sensíveis
    // (login, OTP, reset) apertam ainda mais com @Throttle no controller.
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 100 },
    ]),
    PrismaModule,
    AuthModule,
    OwnersModule,
    ClientsModule,
    UnitsModule,
    BarbersModule,
    ServicesModule,
    AppointmentsModule,
    AvailabilityModule,
    RescheduleModule,
    LoyaltyModule,
    FinancialModule,
    GoogleCalendarModule,
    WhatsappModule,
  ],
  providers: [
    // A ordem importa: throttle -> autenticação -> autorização.
    //
    // Estes guards são GLOBAIS de propósito. Antes eles eram aplicados rota a
    // rota com @UseGuards, o que tornava o @Public() decorativo e fazia com
    // que qualquer rota nova que esquecesse o decorator nascesse pública e
    // sem checagem de papel. Agora o padrão é "fechado", e abrir exige o
    // @Public() explícito.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
