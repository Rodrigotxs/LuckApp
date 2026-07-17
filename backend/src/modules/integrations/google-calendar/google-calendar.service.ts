import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../../prisma/prisma.service';

interface CriarEventoParams {
  titulo: string;
  inicio: string;
  fim: string;
  emailCliente?: string;
  descricao?: string;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private criarOAuth2Client() {
    return new google.auth.OAuth2(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
      this.config.get('GOOGLE_REDIRECT_URI'),
    );
  }

  gerarUrlAutorizacao(ownerId: string): string {
    const oauth2 = this.criarOAuth2Client();
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: ownerId,
      prompt: 'consent',
    });
  }

  async trocarCodigoPorTokens(ownerId: string, code: string) {
    const oauth2 = this.criarOAuth2Client();
    const { tokens } = await oauth2.getToken(code);

    await this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined,
        googleTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    });

    return tokens;
  }

  private async obterClienteAutenticado(accessToken: string, refreshToken: string, ownerId: string) {
    const oauth2 = this.criarOAuth2Client();
    oauth2.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

    oauth2.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await this.prisma.owner.update({
          where: { id: ownerId },
          data: {
            googleAccessToken: tokens.access_token,
            googleTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          },
        });
      }
    });

    return oauth2;
  }

  async obterEventosOcupados(
    accessToken: string,
    refreshToken: string,
    timeMin: string,
    timeMax: string,
    ownerId: string,
  ): Promise<{ inicio: Date; fim: Date }[]> {
    const auth = await this.obterClienteAutenticado(accessToken, refreshToken, ownerId);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.freebusy.query({
      requestBody: { timeMin, timeMax, items: [{ id: 'primary' }] },
    });

    const busy = response.data.calendars?.primary?.busy || [];
    return busy.map((b) => ({ inicio: new Date(b.start), fim: new Date(b.end) }));
  }

  async criarEvento(
    accessToken: string,
    refreshToken: string,
    ownerId: string,
    params: CriarEventoParams,
  ): Promise<string> {
    const auth = await this.obterClienteAutenticado(accessToken, refreshToken, ownerId);
    const calendar = google.calendar({ version: 'v3', auth });

    const event: any = {
      summary: params.titulo,
      description: params.descricao,
      start: { dateTime: params.inicio, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: params.fim, timeZone: 'America/Sao_Paulo' },
    };
    if (params.emailCliente) event.attendees = [{ email: params.emailCliente }];

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data.id;
  }

  async deletarEvento(
    accessToken: string,
    refreshToken: string,
    ownerId: string,
    eventId: string,
  ): Promise<void> {
    const auth = await this.obterClienteAutenticado(accessToken, refreshToken, ownerId);
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({ calendarId: 'primary', eventId });
  }
}
