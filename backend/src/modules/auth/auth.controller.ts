import { Controller, Post, Body, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { LoginOwnerDto } from './dto/login-owner.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from '../../common/decorators/public.decorator';
import { GoogleCalendarService } from '../integrations/google-calendar/google-calendar.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleCalendar: GoogleCalendarService,
  ) {}

  @Public()
  @Post('owner/register')
  @ApiOperation({ summary: 'Cadastro do dono da barbearia' })
  registrar(@Body() dto: RegisterOwnerDto) {
    return this.authService.registerOwner(dto);
  }

  @Public()
  @Post('owner/login')
  @ApiOperation({ summary: 'Login do dono com email e senha' })
  login(@Body() dto: LoginOwnerDto) {
    return this.authService.loginOwner(dto);
  }

  @Public()
  @Post('client/send-otp')
  @ApiOperation({ summary: 'Envia OTP via WhatsApp para o cliente' })
  enviarOtp(@Body() dto: SendOtpDto) {
    return this.authService.enviarOtp(dto);
  }

  @Public()
  @Post('client/verify-otp')
  @ApiOperation({ summary: 'Valida OTP e retorna JWT do cliente' })
  verificarOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verificarOtp(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('google')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia OAuth Google Calendar' })
  googleAuth(@CurrentUser() user: any, @Res() res: any) {
    const url = this.googleCalendar.gerarUrlAutorizacao(user.id);
    return res.redirect(url);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Callback OAuth Google Calendar' })
  async googleCallback(@Req() req: any, @Res() res: any) {
    const { code, state: ownerId } = req.query;
    await this.googleCalendar.trocarCodigoPorTokens(ownerId, code);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/cadastro/google?status=success`);
  }
}
