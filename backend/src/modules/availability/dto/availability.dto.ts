import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvailabilityBlockDto {
  @ApiProperty({ example: '2024-04-29T00:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2024-04-29T23:59:59.000Z' })
  @IsDateString()
  endAt: string;

  @ApiProperty({ required: false, description: 'true = bloqueia o dia inteiro' })
  @IsOptional()
  @IsBoolean()
  fullDay?: boolean;

  @ApiProperty({ required: false, example: 'Consulta médica' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false, description: 'Se ausente, bloqueia toda a agenda do dono' })
  @IsOptional()
  @IsString()
  barberId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unitId?: string;
}

export class BlockDayDto {
  @ApiProperty({ example: '2024-04-29' })
  @IsDateString()
  date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  barberId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BlockSlotDto {
  @ApiProperty({ example: '2024-04-29T08:30:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2024-04-29T09:00:00.000Z' })
  @IsDateString()
  endAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  barberId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
