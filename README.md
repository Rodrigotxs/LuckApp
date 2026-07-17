# Barbearia Luck

Sistema de agendamento multi-tenant para barbearias. Backend NestJS + Frontend Next.js mobile-first.

## Stack

- **Backend:** Node.js + TypeScript + NestJS + PostgreSQL + Prisma ORM
- **Frontend:** React + Next.js 16 (App Router) + Tailwind CSS
- **Auth:** JWT (donos) + OTP via WhatsApp (clientes)
- **Integrações:** Google Calendar API + WhatsApp (Evolution API / Twilio)
- **Infra:** Docker Compose (PostgreSQL + Redis)

## Identidade visual

| Token | Hex | Uso |
|---|---|---|
| `--color-red` | `#C0392B` | CTAs, bordas de destaque |
| `--color-navy` | `#1A3A6B` | Cabeçalhos, elementos secundários |
| `--color-white` | `#FFFFFF` | Fundo principal |
| `--color-gray-light` | `#F5F5F5` | Fundo secundário |
| `--color-gray` | `#BDBDBD` | Divisores, desabilitado |
| `--color-charcoal` | `#2C2C2C` | Texto principal |

## Estrutura

```
barbearia-luck/
├── backend/          # NestJS API (porta 3001)
├── frontend/         # Next.js (porta 3000)
└── docker-compose.yml
```

## Como rodar

### 1. Subir infraestrutura
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
npm install
npx prisma migrate deploy   # aplica as migrations
npx prisma db seed          # cria barbearia demo (opcional)
npm run start:dev
```
- API: http://localhost:3001
- Docs Swagger: http://localhost:3001/api/docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
- App: http://localhost:3000

## Conta demo (após `prisma db seed`)

- E-mail: `demo@barbearialuck.com`
- Senha: `123456`
- Link público de agendamento: `http://localhost:3000/agendar/<ownerId>` (o `ownerId` é impresso pelo seed)

## Variáveis de ambiente

### `backend/.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barbearia_luck"
JWT_SECRET="seu-secret-aqui"
JWT_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6379"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"

WHATSAPP_API_URL=""
WHATSAPP_API_KEY=""
WHATSAPP_INSTANCE=""

FRONTEND_URL="http://localhost:3000"
PORT=3001
```

### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Endpoints principais

### Auth
- `POST /auth/owner/register` — cadastro do dono
- `POST /auth/owner/login` — login do dono → JWT
- `POST /auth/client/send-otp` — envia OTP via WhatsApp
- `POST /auth/client/verify-otp` — valida OTP → JWT do cliente
- `GET /auth/google` — inicia OAuth Google Calendar
- `GET /auth/google/callback` — recebe tokens

### Serviços
- `GET /services` — lista do dono autenticado
- `POST /services` — cria serviço
- `PATCH /services/:id` — edita
- `DELETE /services/:id` — desativa
- `GET /services/public/:ownerId` — lista pública para agendamento

### Agendamentos
- `GET /appointments/available-slots?ownerId&date&serviceId` — horários livres
- `POST /appointments` — cliente cria agendamento
- `GET /appointments/owner` — agenda do dono
- `GET /appointments/client` — histórico do cliente
- `PATCH /appointments/:id/status` — atualiza status
- `PATCH /appointments/:id/payment` — registra pagamento
- `DELETE /appointments/:id` — cancela

### Financeiro
- `GET /financial/summary?period=today|week|month`
- `GET /financial/report?startDate&endDate`
- `GET /financial/goals` / `PATCH /financial/goals`

## Telas

**Cliente:** `/`, `/cadastro/cliente`, `/cadastro/verificar`, `/agendar/[ownerId]`, `/agendar/[ownerId]/horario`, `/agendar/[ownerId]/confirmar`

**Dono:** `/login`, `/cadastro/dono`, `/cadastro/barbearia`, `/cadastro/servicos`, `/cadastro/google`, `/painel`, `/painel/financeiro`, `/painel/clientes`, `/painel/configuracoes`

## Lembretes automáticos

Cron job (`@Cron('*/5 * * * *')`) verifica agendamentos com 1 h de antecedência e dispara mensagem via WhatsApp. Ver `backend/src/modules/integrations/whatsapp/whatsapp-reminder.service.ts`.

## Lógica de slots disponíveis

`backend/src/modules/appointments/slots.service.ts`:
1. Carrega serviço e horário de funcionamento do dia da semana
2. Busca agendamentos do banco (não cancelados) e eventos do Google Calendar
3. Gera slots de `service.durationMin` em `service.durationMin` entre `startTime` e `endTime`
4. Marca como ocupado os que colidem com algum período busy ou já passaram
