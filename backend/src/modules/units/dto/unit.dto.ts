import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ example: 'Unidade Atlântica' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'Av. Atlântica, 1400' })
  @IsString()
  @IsNotEmpty({ message: 'Endereço é obrigatório' })
  @MaxLength(200)
  address: string;

  @ApiProperty({ example: 'Copacabana, RJ', required: false })
  @IsOptional()
  @IsString()
  neighborhood?: string;
}

export class UpdateUnitDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
