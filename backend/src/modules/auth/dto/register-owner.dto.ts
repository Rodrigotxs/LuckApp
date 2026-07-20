import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterOwnerDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiProperty({ example: '5511999999999' })
  @IsString()
  whatsapp: string;

  @ApiProperty({ example: 'Barbearia Luck' })
  @IsString()
  barbershopName: string;

  @ApiProperty({ example: 'Rua das Flores, 123', required: false })
  @IsOptional()
  @IsString()
  barbershopAddress?: string;

  @ApiProperty({ example: '05433-010', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  /**
   * Se informado, o backend também cria um Barber ligado a esta unidade,
   * tornando o dono visível como profissional no BarberPicker público.
   */
  @ApiProperty({ example: 'unit-uuid', required: false })
  @IsOptional()
  @IsString()
  unitId?: string;
}
