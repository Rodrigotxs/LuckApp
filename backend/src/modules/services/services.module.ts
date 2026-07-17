import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { WorkingHoursController } from './working-hours.controller';
import { WorkingHoursService } from './working-hours.service';

@Module({
  controllers: [ServicesController, WorkingHoursController],
  providers: [ServicesService, WorkingHoursService],
  exports: [ServicesService, WorkingHoursService],
})
export class ServicesModule {}
