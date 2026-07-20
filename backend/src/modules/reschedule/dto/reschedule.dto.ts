import { IsDateString, IsOptional, IsString, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRescheduleDto {
  @ApiProperty({ example: 'appointment-uuid' })
  @IsString()
  @IsNotEmpty()
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
  @IsIn(['APPROVED', 'REJECTED'], { message: 'Status deve ser APPROVED ou REJECTED' })
  status: 'APPROVED' | 'REJECTED';
}
