import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginClientDto {
  @ApiProperty({ example: 'ricardo.almeida@gmail.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '5511987654321', required: false })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  password: string;
}

export class SetClientPasswordDto {
  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RequestClientPasswordResetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  whatsapp?: string;
}

export class ConfirmClientPasswordResetDto {
  @ApiProperty({ description: 'Token recebido no e-mail/WhatsApp' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
