import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'diego@navalha.co', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '5511998876655', required: false })
  @IsOptional()
  @IsString()
  whatsapp?: string;
}

export class ConfirmPasswordResetDto {
  @ApiProperty({ description: 'Token recebido no e-mail/WhatsApp' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
