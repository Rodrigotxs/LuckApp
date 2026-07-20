import { IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RescheduleStatus } from '@prisma/client';

export class CreateRescheduleDto {
  @ApiProperty({ example: 'appointment-uuid' })
  @IsString()
  appointmentId: string;

  @ApiProperty({ example: '2024-04-30T14:30:00.000Z' })
  @IsDateString()
  requestedStart: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateRescheduleDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(RescheduleStatus)
  status: RescheduleStatus;
}
