-- ─────────────────────────────────────────────────────────────────────────
-- Hardening de segurança e integridade
--
-- 1. Contador de tentativas de OTP  -> corta força bruta no código de 6 dígitos
-- 2. E-mail único por cliente       -> login por e-mail deixa de ser ambíguo
-- 3. Constraint anti-double-booking -> o banco passa a ser a fonte da verdade
-- 4. Índices de apoio               -> consultas de conflito e agenda
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Tentativas de OTP -------------------------------------------------------
ALTER TABLE "Client"  ADD COLUMN IF NOT EXISTS "otpAttempts"      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Client"  ADD COLUMN IF NOT EXISTS "emailOtpAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Owner"   ADD COLUMN IF NOT EXISTS "otpAttempts"      INTEGER NOT NULL DEFAULT 0;

-- 2. E-mail único por cliente (parcial: vários clientes podem não ter e-mail) -
-- Antes de criar o índice, desduplicamos mantendo o registro mais antigo.
UPDATE "Client" c
   SET "email" = NULL
 WHERE "email" IS NOT NULL
   AND EXISTS (
     SELECT 1 FROM "Client" o
      WHERE o."email" = c."email"
        AND o."createdAt" < c."createdAt"
   );

CREATE UNIQUE INDEX IF NOT EXISTS "Client_email_key"
    ON "Client"("email") WHERE "email" IS NOT NULL;

-- 3. Anti-double-booking -----------------------------------------------------
-- A checagem em application code (SELECT de conflito seguido de INSERT) tem
-- janela de corrida: dois pedidos simultâneos passam os dois no SELECT e
-- gravam os dois. Só o banco consegue arbitrar isso.
--
-- A chave do EXCLUDE é (dono, barbeiro, intervalo). Agendamento sem barbeiro
-- definido cai num UUID sentinela, de modo que "sem barbeiro" continua sendo
-- uma agenda própria e não colide com a de um barbeiro específico.
-- Agendamentos CANCELLED ficam de fora — o horário volta a ficar livre.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DELETE FROM "Appointment" a
 USING "Appointment" b
 WHERE a."id" > b."id"
   AND a."ownerId" = b."ownerId"
   AND COALESCE(a."barberId", '00000000-0000-0000-0000-000000000000')
     = COALESCE(b."barberId", '00000000-0000-0000-0000-000000000000')
   AND a."status" <> 'CANCELLED'
   AND b."status" <> 'CANCELLED'
   AND a."startAt" < b."endAt"
   AND a."endAt"   > b."startAt";

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_sem_sobreposicao"
  EXCLUDE USING gist (
    "ownerId" WITH =,
    (COALESCE("barberId", '00000000-0000-0000-0000-000000000000')) WITH =,
    tsrange("startAt", "endAt", '[)') WITH &&
  ) WHERE ("status" <> 'CANCELLED');

-- Um agendamento tem que terminar depois de começar.
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_intervalo_valido" CHECK ("endAt" > "startAt");

-- 4. Índices de apoio --------------------------------------------------------
CREATE INDEX IF NOT EXISTS "Appointment_ownerId_status_startAt_idx"
    ON "Appointment"("ownerId", "status", "startAt");
CREATE INDEX IF NOT EXISTS "Appointment_clientId_startAt_idx"
    ON "Appointment"("clientId", "startAt");
CREATE INDEX IF NOT EXISTS "Client_passwordResetToken_idx"
    ON "Client"("passwordResetToken") WHERE "passwordResetToken" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Owner_passwordResetToken_idx"
    ON "Owner"("passwordResetToken") WHERE "passwordResetToken" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Owner_whatsapp_idx" ON "Owner"("whatsapp");
