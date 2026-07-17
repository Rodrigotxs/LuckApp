import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte Social' })
  @IsString()
  name: string;

  @ApiProperty({ example: 35.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 30, description: 'Duração em minutos' })
  @IsNumber()
  @Min(5)
  durationMin: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
