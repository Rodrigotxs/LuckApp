import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OwnersService } from './owners.service';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Donos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('owners')
export class OwnersController {
  constructor(private ownersService: OwnersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna dados do dono autenticado' })
  perfil(@CurrentUser() user: any) {
    return this.ownersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualiza dados do dono' })
  atualizar(@CurrentUser() user: any, @Body() dto: UpdateOwnerDto) {
    return this.ownersService.update(user.id, dto);
  }
}
