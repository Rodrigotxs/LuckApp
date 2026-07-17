import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  whatsapp: string;

  @ApiProperty({ example: 'Maria Santos' })
  @IsString()
  name: string;
}
