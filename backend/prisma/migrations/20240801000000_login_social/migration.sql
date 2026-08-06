-- ─────────────────────────────────────────────────────────────────────────
-- Login social (Google e Facebook) para cliente e dono
--
-- Decisoes que valem registro:
--
-- 1. IDs de provedor sao colunas separadas e UNICAS. A mesma pessoa pode
--    vincular Google e Facebook na mesma conta, e um id de provedor nunca
--    pode apontar para duas contas.
--
-- 2. `passwordHash` do Owner passa a ser NULAVEL. Um dono que se cadastrou
--    pelo Google nunca escolheu senha; obrigar uma coluna NOT NULL levaria a
--    gravar hash de string aleatoria, que e pior — vira uma senha que ninguem
--    conhece mas que existe e pode ser alvo.
--
-- 3. `emailVerificado` registra se o provedor confirmou o e-mail. E o campo
--    que autoriza vincular um login social a uma conta que ja existe: sem
--    isso, qualquer um cria conta num provedor com o e-mail da vitima e
--    assume a conta dela.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE "Owner"  ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "Owner"  ADD COLUMN IF NOT EXISTS "googleId"        TEXT;
ALTER TABLE "Owner"  ADD COLUMN IF NOT EXISTS "facebookId"      TEXT;
ALTER TABLE "Owner"  ADD COLUMN IF NOT EXISTS "emailVerificado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Owner"  ADD COLUMN IF NOT EXISTS "avatarUrl"       TEXT;

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "googleId"        TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "facebookId"      TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "emailVerificado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "avatarUrl"       TEXT;

-- O cliente identificado so por e-mail nao tem WhatsApp de verdade; o cadastro
-- por OTP ja usava o prefixo "email:" como placeholder. Login social usa o
-- mesmo padrao, e a coluna continua unica.
CREATE UNIQUE INDEX IF NOT EXISTS "Owner_googleId_key"    ON "Owner"("googleId")    WHERE "googleId"   IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Owner_facebookId_key"  ON "Owner"("facebookId")  WHERE "facebookId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Client_googleId_key"   ON "Client"("googleId")   WHERE "googleId"   IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Client_facebookId_key" ON "Client"("facebookId") WHERE "facebookId" IS NOT NULL;

-- Contas que ja existiam entraram por e-mail+senha ou OTP; nenhuma delas teve
-- o e-mail confirmado por provedor externo, entao o padrao false esta correto.
