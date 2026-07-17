import { IsNumber, IsString, IsBoolean, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkingHoursDto {
  @ApiProperty({ example: 1, description: '0=Dom, 1=Seg, ..., 6=Sáb' })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  active: boolean;
}

export class BulkWorkingHoursDto {
  @ApiProperty({ type: [CreateWorkingHoursDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkingHoursDto)
  horarios: CreateWorkingHoursDto[];
}
