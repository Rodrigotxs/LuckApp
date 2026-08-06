import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkingHoursService } from './working-hours.service';
import { BulkWorkingHoursDto } from './dto/working-hours.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Horários de Funcionamento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('working-hours')
export class WorkingHoursController {
  constructor(private workingHoursService: WorkingHoursService) {}

  @Get()
  listar(@CurrentUser() user: any) {
    return this.workingHoursService.listar(user.id);
  }

  @Post()
  salvar(@CurrentUser() user: any, @Body() dto: BulkWorkingHoursDto) {
    return this.workingHoursService.salvarBulk(user.id, dto);
  }
}
