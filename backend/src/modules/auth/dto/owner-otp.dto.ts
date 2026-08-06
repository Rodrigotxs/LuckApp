import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOwnerOtpDto {
  @ApiProperty({ example: '5511998876655' })
  @IsString()
  whatsapp: string;
}

export class VerifyOwnerOtpDto {
  @ApiProperty({ example: '5511998876655' })
  @IsString()
  whatsapp: string;

  @ApiProperty({ example: '482391' })
  @IsString()
  @Length(6, 6, { message: 'Código OTP deve ter 6 dígitos' })
  code: string;
}
