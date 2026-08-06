import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,15}$/, { message: 'WhatsApp deve conter apenas dígitos (10-15)' })
  whatsapp: string;

  @ApiProperty({ example: 'Maria Santos' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100)
  name: string;
}
