import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ example: 'Unidade Atlântica' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Av. Atlântica, 1400' })
  @IsString()
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
