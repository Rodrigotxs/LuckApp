import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global de erro.
 *
 * Dois objetivos de segurança:
 *  1. O cliente nunca recebe stack trace nem mensagem interna de banco —
 *     isso vaza estrutura de tabela, caminho de arquivo e versão de lib.
 *  2. Todo erro inesperado vira log estruturado com um requestId, para dar
 *     rastreabilidade sem precisar devolver detalhe ao usuário.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let body: Record<string, unknown>;
    if (isHttp) {
      const resposta = exception.getResponse();
      body =
        typeof resposta === 'string'
          ? { statusCode: status, message: resposta }
          : { statusCode: status, ...(resposta as object) };
    } else {
      body = {
        statusCode: status,
        message: 'Erro interno. Tente novamente em instantes.',
      };
    }

    const requestId = (req.headers['x-request-id'] as string) || randomId();
    body.requestId = requestId;
    body.path = req.url;

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} -> ${status} [${requestId}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (status !== 404) {
      this.logger.warn(`${req.method} ${req.url} -> ${status} [${requestId}]`);
    }

    res.status(status).json(body);
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
