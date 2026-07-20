import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendClientEmailOtpDto {
  @ApiProperty({ example: 'ricardo.almeida@gmail.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'Ricardo Almeida' })
  @IsString()
  name: string;
}

export class VerifyClientEmailOtpDto {
  @ApiProperty({ example: 'ricardo.almeida@gmail.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: '482391' })
  @IsString()
  @Length(6, 6, { message: 'Código OTP deve ter 6 dígitos' })
  code: string;
}
