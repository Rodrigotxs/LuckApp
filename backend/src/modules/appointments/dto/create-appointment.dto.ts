import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  ownerId: string;

  @ApiProperty({ required: false, description: 'Só para dono: agendar em nome de outro cliente' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  barberId?: string;

  @ApiProperty({ example: '2024-04-15T10:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
