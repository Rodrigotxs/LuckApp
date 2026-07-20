import { Controller, Post, Body, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { LoginOwnerDto } from './dto/login-owner.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SendOwnerOtpDto, VerifyOwnerOtpDto } from './dto/owner-otp.dto';
import { SendClientEmailOtpDto, VerifyClientEmailOtpDto } from './dto/email-otp.dto';
import { RequestPasswordResetDto, ConfirmPasswordResetDto } from './dto/password-reset.dto';
import {
  LoginClientDto, SetClientPasswordDto,
  RequestClientPasswordResetDto, ConfirmClientPasswordResetDto,
} from './dto/client-password.dto';
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

  @Public()
  @Post('client/send-email-otp')
  @ApiOperation({ summary: 'Envia OTP para o e-mail do cliente' })
  enviarOtpEmail(@Body() dto: SendClientEmailOtpDto) {
    return this.authService.enviarOtpClienteEmail(dto);
  }

  @Public()
  @Post('client/verify-email-otp')
  @ApiOperation({ summary: 'Valida OTP recebido por e-mail e retorna JWT do cliente' })
  verificarOtpEmail(@Body() dto: VerifyClientEmailOtpDto) {
    return this.authService.verificarOtpClienteEmail(dto);
  }

  @Public()
  @Post('client/login')
  @ApiOperation({ summary: 'Login do cliente com email/whatsapp + senha' })
  loginCliente(@Body() dto: LoginClientDto) {
    return this.authService.loginCliente(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('client/set-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cliente autenticado define/troca sua senha' })
  definirSenhaCliente(@CurrentUser() user: any, @Body() dto: SetClientPasswordDto) {
    return this.authService.definirSenhaCliente(user.id, dto);
  }

  @Public()
  @Post('client/password-reset/request')
  @ApiOperation({ summary: 'Solicita link de reset de senha do cliente' })
  solicitarResetSenhaCliente(@Body() dto: RequestClientPasswordResetDto) {
    return this.authService.solicitarResetSenhaCliente(dto);
  }

  @Public()
  @Post('client/password-reset/confirm')
  @ApiOperation({ summary: 'Confirma nova senha do cliente usando token' })
  confirmarResetSenhaCliente(@Body() dto: ConfirmClientPasswordResetDto) {
    return this.authService.confirmarResetSenhaCliente(dto);
  }

  @Public()
  @Post('owner/send-otp')
  @ApiOperation({ summary: 'Envia OTP via WhatsApp para o dono (login sem senha)' })
  enviarOtpOwner(@Body() dto: SendOwnerOtpDto) {
    return this.authService.enviarOtpOwner(dto);
  }

  @Public()
  @Post('owner/verify-otp')
  @ApiOperation({ summary: 'Valida OTP do dono e retorna JWT' })
  verificarOtpOwner(@Body() dto: VerifyOwnerOtpDto) {
    return this.authService.verificarOtpOwner(dto);
  }

  @Public()
  @Post('owner/password-reset/request')
  @ApiOperation({ summary: 'Solicita link de reset de senha (por email ou WhatsApp)' })
  solicitarResetSenha(@Body() dto: RequestPasswordResetDto) {
    return this.authService.solicitarResetSenha(dto);
  }

  @Public()
  @Post('owner/password-reset/confirm')
  @ApiOperation({ summary: 'Confirma nova senha usando token' })
  confirmarResetSenha(@Body() dto: ConfirmPasswordResetDto) {
    return this.authService.confirmarResetSenha(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('google')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia OAuth Google Calendar (redirect)' })
  googleAuth(@CurrentUser() user: any, @Res() res: any) {
    const url = this.googleCalendar.gerarUrlAutorizacao(user.id);
    return res.redirect(url);
  }

  @UseGuards(JwtAuthGuard)
  @Get('google/url')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna URL de autorização OAuth Google Calendar (para redirect no frontend)' })
  googleAuthUrl(@CurrentUser() user: any) {
    const url = this.googleCalendar.gerarUrlAutorizacao(user.id);
    return { url };
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
