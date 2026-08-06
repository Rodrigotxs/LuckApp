import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBarberDto {
  @ApiProperty({ example: 'Diego Monteiro' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'uuid da unidade' })
  @IsString()
  @IsNotEmpty({ message: 'unitId é obrigatório' })
  unitId: string;

  @ApiProperty({ example: 'Barbeiro sênior', required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ example: 4.9, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 'DM', required: false })
  @IsOptional()
  @IsString()
  avatarLabel?: string;
}

export class UpdateBarberDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarLabel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
