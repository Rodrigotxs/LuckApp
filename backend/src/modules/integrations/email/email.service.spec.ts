import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer');
const nodemailerMock = nodemailer as jest.Mocked<typeof nodemailer>;

describe('EmailService', () => {
  let sendMail: jest.Mock;
  let verify: jest.Mock;

  const criar = (env: Record<string, any>) => {
    const config = { get: jest.fn((k: string, padrao?: any) => env[k] ?? padrao) };
    return new EmailService(config as any);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sendMail = jest.fn().mockResolvedValue({ messageId: 'x' });
    verify = jest.fn().mockResolvedValue(true);
    (nodemailerMock.createTransport as jest.Mock).mockReturnValue({ sendMail, verify });
  });

  const COM_SMTP = { SMTP_HOST: 'smtp.exemplo.com', SMTP_USER: 'u', SMTP_PASS: 'p' };

  describe('envio real', () => {
    it('envia de verdade quando o SMTP está configurado', async () => {
      const s = criar(COM_SMTP);
      await s.enviarOtp('ana@x.com', '123456');

      expect(sendMail).toHaveBeenCalledTimes(1);
      const msg = sendMail.mock.calls[0][0];
      expect(msg.to).toBe('ana@x.com');
      expect(msg.text).toContain('123456');
    });

    it('usa TLS implícito na 465 e STARTTLS nas demais', () => {
      criar({ ...COM_SMTP, SMTP_PORT: 465 });
      expect((nodemailerMock.createTransport as jest.Mock).mock.calls[0][0].secure).toBe(true);

      jest.clearAllMocks();
      (nodemailerMock.createTransport as jest.Mock).mockReturnValue({ sendMail, verify });
      criar({ ...COM_SMTP, SMTP_PORT: 587 });
      expect((nodemailerMock.createTransport as jest.Mock).mock.calls[0][0].secure).toBe(false);
    });

    it('confere a conexão SMTP ao subir', async () => {
      // Descobrir que a senha do SMTP está errada quando um cliente tenta
      // recuperar a conta é tarde demais.
      const s = criar(COM_SMTP);
      await s.onModuleInit();
      expect(verify).toHaveBeenCalled();
    });

    it('SMTP inacessível não derruba a aplicação', async () => {
      verify.mockRejectedValue(new Error('ECONNREFUSED'));
      const s = criar(COM_SMTP);
      await expect(s.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('NÃO mente que enviou', () => {
    it('falha alto quando o envio dá erro', async () => {
      // Regressão: a versão anterior registrava "Enviado para..." e não enviava
      // nada. Quem chamou nunca sabia que falhou.
      sendMail.mockRejectedValue(new Error('550 mailbox unavailable'));
      const s = criar(COM_SMTP);
      await expect(s.enviarOtp('ana@x.com', '123456')).rejects.toThrow(/Não foi possível enviar/);
    });

    it('em PRODUÇÃO sem SMTP, estoura em vez de fingir', async () => {
      const s = criar({ NODE_ENV: 'production' });
      await expect(s.enviarResetSenha('ana@x.com', 'http://x/reset?token=abc'))
        .rejects.toThrow(/indisponível/);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('fora de produção sem SMTP, registra no log e segue', async () => {
      // É o mecanismo documentado de desenvolvimento: o código de OTP é lido
      // do log do backend.
      const s = criar({ NODE_ENV: 'development' });
      await expect(s.enviarOtp('ana@x.com', '123456')).resolves.toBeUndefined();
    });
  });

  describe('não vaza segredo nem dado pessoal no log', () => {
    it('o log de sucesso NÃO contém o código nem o link', async () => {
      // Regressão: sem SMTP a versão anterior imprimia o corpo inteiro,
      // incluindo o OTP e o token de reset — em produção, credencial no log.
      const s = criar(COM_SMTP);
      const logs: string[] = [];
      jest.spyOn((s as any).logger, 'log').mockImplementation((m: any) => logs.push(String(m)));

      await s.enviarOtp('ana@x.com', '123456');
      await s.enviarResetSenha('ana@x.com', 'https://app/reset?token=SEGREDO');

      const tudo = logs.join('\n');
      expect(tudo).not.toContain('123456');
      expect(tudo).not.toContain('SEGREDO');
    });

    it('o log de erro também não vaza o corpo', async () => {
      sendMail.mockRejectedValue(new Error('falhou'));
      const s = criar(COM_SMTP);
      const erros: string[] = [];
      jest.spyOn((s as any).logger, 'error').mockImplementation((...a: any[]) =>
        erros.push(a.map(String).join(' ')),
      );

      await expect(s.enviarOtp('ana@x.com', '999888')).rejects.toThrow();
      expect(erros.join('\n')).not.toContain('999888');
    });

    it('mascara o e-mail no log — dado pessoal sob a LGPD', async () => {
      const s = criar(COM_SMTP);
      const logs: string[] = [];
      jest.spyOn((s as any).logger, 'log').mockImplementation((m: any) => logs.push(String(m)));

      await s.enviarOtp('ana.silva@gmail.com', '123456');

      const tudo = logs.join('\n');
      expect(tudo).not.toContain('ana.silva@gmail.com');
      expect(tudo).toContain('an');
      expect(tudo).toContain('@gmail.com');
    });

    it('mascarar não quebra com entrada estranha', async () => {
      const s = criar(COM_SMTP);
      await expect(s.enviarOtp('sem-arroba', '1')).resolves.toBeUndefined();
    });
  });

  describe('conteúdo das mensagens', () => {
    it('o OTP informa a validade', async () => {
      const s = criar(COM_SMTP);
      await s.enviarOtp('a@x.com', '123456');
      expect(sendMail.mock.calls[0][0].text).toMatch(/10 minutos/);
    });

    it('o reset informa a validade e leva o link', async () => {
      const s = criar(COM_SMTP);
      await s.enviarResetSenha('a@x.com', 'https://app/reset?token=abc');
      const texto = sendMail.mock.calls[0][0].text;
      expect(texto).toContain('https://app/reset?token=abc');
      expect(texto).toMatch(/1 h/);
    });

    it('usa o remetente configurado', async () => {
      const s = criar({ ...COM_SMTP, SMTP_FROM: 'luck@barbearia.com' });
      await s.enviarOtp('a@x.com', '1');
      expect(sendMail.mock.calls[0][0].from).toBe('luck@barbearia.com');
    });
  });
});
