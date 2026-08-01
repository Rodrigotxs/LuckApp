import { Controller, Post, Body, Get, Req, Res, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
import { SocialAuthService, Papel } from './social/social-auth.service';
import { ehProviderValido } from './social/social-providers';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleCalendar: GoogleCalendarService,
    private social: SocialAuthService,
  ) {}

  // ─── Login social (Google / Facebook) ────────────────────────────────
  //
  // Atencao: as rotas /auth/google* mais abaixo sao do Google CALENDAR, nao
  // de login. Sao fluxos OAuth diferentes, com escopos diferentes.

  @Public()
  @Get('social/providers')
  @ApiOperation({ summary: 'Provedores de login social configurados neste ambiente' })
  providersSociais() {
    // A interface so mostra o botao do que existe de verdade. Botao que nao
    // leva a lugar nenhum custa mais confianca do que a ausencia dele.
    // `pendentes` vem vazio em producao — la o provedor sem credencial
    // simplesmente nao existe. Fora de producao ele diz o que falta, para a
    // secao nao sumir em silencio de quem esta montando o ambiente.
    return {
      providers: this.social.providersDisponiveis(),
      pendentes: this.social.providersPendentes(),
    };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Get('social/:provider')
  @ApiOperation({ summary: 'Inicia o login social e redireciona ao provedor' })
  iniciarSocial(
    @Param('provider') provider: string,
    @Query('papel') papel: string,
    @Res() res: any,
  ) {
    if (!ehProviderValido(provider)) throw new BadRequestException('Provedor nao suportado');
    if (papel !== 'client' && papel !== 'owner') {
      throw new BadRequestException("Informe papel=client ou papel=owner");
    }
    return res.redirect(this.social.gerarUrlAutorizacao(provider, papel as Papel));
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Get('social/:provider/callback')
  @ApiOperation({ summary: 'Callback do provedor social' })
  async callbackSocial(@Query() query: any, @Res() res: any) {
    // O usuario clicou em "cancelar" na tela do provedor.
    if (query.error) {
      return res.redirect(this.social.urlErro('Login cancelado.'));
    }
    try {
      const resultado = await this.social.concluirLogin(query.state, query.code);
      return res.redirect(this.social.urlRetorno(resultado));
    } catch (e: any) {
      // Erro aqui vira redirect com mensagem, nunca JSON cru numa aba do
      // navegador — o usuario voltou do provedor esperando ver a aplicacao.
      const msg = e?.response?.message || e?.message || 'Nao foi possivel entrar.';
      return res.redirect(this.social.urlErro(String(msg)));
    }
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('owner/register')
  @ApiOperation({ summary: 'Cadastro do dono da barbearia' })
  registrar(@Body() dto: RegisterOwnerDto) {
    return this.authService.registerOwner(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('owner/login')
  @ApiOperation({ summary: 'Login do dono com email e senha' })
  login(@Body() dto: LoginOwnerDto) {
    return this.authService.loginOwner(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('client/send-otp')
  @ApiOperation({ summary: 'Envia OTP via WhatsApp para o cliente' })
  enviarOtp(@Body() dto: SendOtpDto) {
    return this.authService.enviarOtp(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('client/verify-otp')
  @ApiOperation({ summary: 'Valida OTP e retorna JWT do cliente' })
  verificarOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verificarOtp(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('client/send-email-otp')
  @ApiOperation({ summary: 'Envia OTP para o e-mail do cliente' })
  enviarOtpEmail(@Body() dto: SendClientEmailOtpDto) {
    return this.authService.enviarOtpClienteEmail(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('client/verify-email-otp')
  @ApiOperation({ summary: 'Valida OTP recebido por e-mail e retorna JWT do cliente' })
  verificarOtpEmail(@Body() dto: VerifyClientEmailOtpDto) {
    return this.authService.verificarOtpClienteEmail(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
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
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('client/password-reset/request')
  @ApiOperation({ summary: 'Solicita link de reset de senha do cliente' })
  solicitarResetSenhaCliente(@Body() dto: RequestClientPasswordResetDto) {
    return this.authService.solicitarResetSenhaCliente(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('client/password-reset/confirm')
  @ApiOperation({ summary: 'Confirma nova senha do cliente usando token' })
  confirmarResetSenhaCliente(@Body() dto: ConfirmClientPasswordResetDto) {
    return this.authService.confirmarResetSenhaCliente(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('owner/send-otp')
  @ApiOperation({ summary: 'Envia OTP via WhatsApp para o dono (login sem senha)' })
  enviarOtpOwner(@Body() dto: SendOwnerOtpDto) {
    return this.authService.enviarOtpOwner(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('owner/verify-otp')
  @ApiOperation({ summary: 'Valida OTP do dono e retorna JWT' })
  verificarOtpOwner(@Body() dto: VerifyOwnerOtpDto) {
    return this.authService.verificarOtpOwner(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('owner/password-reset/request')
  @ApiOperation({ summary: 'Solicita link de reset de senha (por email ou WhatsApp)' })
  solicitarResetSenha(@Body() dto: RequestPasswordResetDto) {
    return this.authService.solicitarResetSenha(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
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
