<#
.SYNOPSIS
  Sobe a stack de desenvolvimento da Barbearia Luck com um comando.

.DESCRIPTION
  Postgres + Redis (Docker), backend NestJS (3001) e frontend Next.js (3000).
  O script e idempotente: pode ser rodado quantas vezes quiser. Ele corrige
  sozinho o que consegue (env faltando, segredo vazio, deps ausentes,
  migration pendente, porta presa) e so pergunta quando a correcao apaga algo.

.PARAMETER SkipSeed
  Nao roda o seed do banco.

.PARAMETER Reset
  Derruba os volumes do Docker e recria o banco do zero. Destrutivo.

.PARAMETER NoBrowser
  Nao abre o navegador ao final.

.EXAMPLE
  .\dev.cmd
  .\dev.cmd -Reset
#>

[CmdletBinding()]
param(
  [switch]$SkipSeed,
  [switch]$Reset,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$ROOT = Split-Path -Parent $PSScriptRoot
$BACKEND = Join-Path $ROOT 'backend'
$FRONTEND = Join-Path $ROOT 'frontend'

# ── saida ────────────────────────────────────────────────────────────────
function Write-Step($msg) { Write-Host "`n[ $msg ]" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  OK   $msg" -ForegroundColor Green }
function Write-Fix($msg)  { Write-Host "  FIX  $msg" -ForegroundColor Yellow }
function Write-Warn($msg) { Write-Host "  !    $msg" -ForegroundColor Yellow }
function Die($msg) {
  Write-Host "`n  ERRO $msg`n" -ForegroundColor Red
  exit 1
}

Write-Host @"

  BARBEARIA LUCK - ambiente de desenvolvimento
  $ROOT

"@ -ForegroundColor White

# ── 1. pre-requisitos ────────────────────────────────────────────────────
Write-Step '1/6  Pre-requisitos'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Die 'Node nao encontrado. Instale o Node 20+ em https://nodejs.org'
}
$nodeMajor = [int]((node -v) -replace 'v(\d+).*', '$1')
if ($nodeMajor -lt 20) { Die "Node 20+ obrigatorio (voce tem $(node -v))" }
Write-Ok "Node $(node -v)"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Die 'Docker nao encontrado. Instale o Docker Desktop e abra ele antes de rodar.'
}

# O Docker Desktop demora a subir; esperar e melhor que falhar na cara do usuario.
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Fix 'Docker Desktop parece parado - tentando abrir e aguardando ate 90s...'
  Start-Process 'Docker Desktop' -ErrorAction SilentlyContinue
  $esperou = 0
  while ($LASTEXITCODE -ne 0 -and $esperou -lt 90) {
    Start-Sleep -Seconds 3; $esperou += 3
    docker info 2>&1 | Out-Null
  }
  if ($LASTEXITCODE -ne 0) { Die 'Docker nao respondeu. Abra o Docker Desktop manualmente e rode de novo.' }
}
Write-Ok 'Docker respondendo'

# ── 2. configuracao ──────────────────────────────────────────────────────
Write-Step '2/6  Configuracao do backend'

$envPath = Join-Path $BACKEND '.env'
$envExample = Join-Path $BACKEND '.env.example'

if (-not (Test-Path $envPath)) {
  Copy-Item $envExample $envPath
  Write-Fix '.env criado a partir do .env.example'
}

$envTexto = Get-Content $envPath -Raw

# A API recusa subir com segredo vazio ou de exemplo - geramos um real.
$segredoRuim = ($envTexto -match 'JWT_SECRET\s*=\s*""') -or
               ($envTexto -match 'JWT_SECRET\s*=\s*"?seu-secret-aqui"?') -or
               ($envTexto -notmatch 'JWT_SECRET')

if ($segredoRuim) {
  $segredo = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  if ($envTexto -match 'JWT_SECRET') {
    $envTexto = $envTexto -replace 'JWT_SECRET\s*=.*', "JWT_SECRET=`"$segredo`""
  } else {
    $envTexto += "`nJWT_SECRET=`"$segredo`""
  }
  Set-Content -Path $envPath -Value $envTexto -NoNewline
  Write-Fix 'JWT_SECRET gerado (32 bytes) - a API recusa subir sem um segredo real'
} else {
  Write-Ok 'JWT_SECRET presente'
}

# CORS_ORIGINS passou a ser lido pela validacao de ambiente.
if ($envTexto -notmatch 'CORS_ORIGINS') {
  Add-Content -Path $envPath -Value "`nCORS_ORIGINS=`"http://localhost:3000`""
  Write-Fix 'CORS_ORIGINS adicionada'
}

# ── 3. banco ─────────────────────────────────────────────────────────────
Write-Step '3/6  Postgres e Redis'

Push-Location $ROOT
try {
  if ($Reset) {
    Write-Warn 'Reset pedido - isso APAGA todos os dados do banco local.'
    $r = Read-Host '     Digite RESET para confirmar'
    if ($r -ne 'RESET') { Die 'Cancelado.' }
    docker compose down -v | Out-Null
    Write-Fix 'Volumes removidos'
  }

  docker compose up -d 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Die 'docker compose up falhou. Rode "docker compose up" para ver o erro.' }

  Write-Host '  ...  aguardando o Postgres aceitar conexao' -NoNewline
  $pronto = $false
  foreach ($i in 1..60) {
    docker compose exec -T postgres pg_isready -U postgres 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { $pronto = $true; break }
    Start-Sleep -Seconds 1
    Write-Host '.' -NoNewline
  }
  Write-Host ''
  if (-not $pronto) { Die 'Postgres nao ficou pronto em 60s. Veja: docker compose logs postgres' }
  Write-Ok 'Postgres pronto'
} finally { Pop-Location }

# ── 4. backend ───────────────────────────────────────────────────────────
Write-Step '4/6  Backend'

Push-Location $BACKEND
try {
  if (-not (Test-Path (Join-Path $BACKEND 'node_modules'))) {
    Write-Fix 'node_modules ausente - instalando (pode demorar alguns minutos)'
    npm install
    if ($LASTEXITCODE -ne 0) { Die 'npm install do backend falhou' }
  }
  Write-Ok 'Dependencias instaladas'

  # O client do Prisma e gerado; sem ele o backend nao sobe.
  npx prisma generate 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Die 'prisma generate falhou. Se for bloqueio de rede, verifique proxy/firewall.' }
  Write-Ok 'Prisma client gerado'

  npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { Die 'prisma migrate deploy falhou. Veja o erro acima.' }
  Write-Ok 'Migrations aplicadas'

  if (-not $SkipSeed) {
    npx prisma db seed 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Ok 'Seed aplicado' }
    else { Write-Warn 'Seed nao rodou (provavelmente ja existia) - seguindo' }
  }
} finally { Pop-Location }

# ── 5. frontend ──────────────────────────────────────────────────────────
Write-Step '5/6  Frontend'

Push-Location $FRONTEND
try {
  if (-not (Test-Path (Join-Path $FRONTEND 'node_modules'))) {
    Write-Fix 'node_modules ausente - instalando'
    npm install
    if ($LASTEXITCODE -ne 0) { Die 'npm install do frontend falhou' }
  }
  Write-Ok 'Dependencias instaladas'
} finally { Pop-Location }

# ── 6. subir os servidores ───────────────────────────────────────────────
Write-Step '6/6  Subindo os servidores'

function Liberar-Porta($porta, $nome) {
  $conexoes = Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue
  if (-not $conexoes) { return }

  foreach ($c in $conexoes) {
    $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if (-not $proc) { continue }
    # So mata o que e claramente um servidor de dev nosso. Matar processo
    # alheio as cegas ja custou dado de gente boa.
    if ($proc.ProcessName -in @('node', 'next-router-worker', 'nest')) {
      Write-Fix "Porta $porta presa por $($proc.ProcessName) (PID $($proc.Id)) - encerrando"
      Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 800
    } else {
      Die "Porta $porta ocupada por '$($proc.ProcessName)' (PID $($proc.Id)), que nao parece ser o $nome. Feche manualmente."
    }
  }
}

Liberar-Porta 3001 'backend'
Liberar-Porta 3000 'frontend'

Start-Process -FilePath 'cmd.exe' `
  -ArgumentList '/k', "title Luck API (3001) && cd /d `"$BACKEND`" && npm run start:dev"
Write-Ok 'Backend subindo em janela propria'

Start-Process -FilePath 'cmd.exe' `
  -ArgumentList '/k', "title Luck Web (3000) && cd /d `"$FRONTEND`" && npm run dev"
Write-Ok 'Frontend subindo em janela propria'

function Esperar-Url($url, $segundos) {
  foreach ($i in 1..$segundos) {
    try {
      Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null
      return $true
    } catch {
      # 4xx tambem significa que ha alguem escutando.
      if ($_.Exception.Response) { return $true }
    }
    Start-Sleep -Seconds 1
    Write-Host '.' -NoNewline
  }
  return $false
}

Write-Host '  ...  aguardando a API responder' -NoNewline
$apiOk = Esperar-Url 'http://localhost:3001/api/docs' 90
Write-Host ''
if ($apiOk) { Write-Ok 'API no ar' } else { Write-Warn 'API demorou - veja a janela "Luck API"' }

Write-Host '  ...  aguardando o frontend compilar' -NoNewline
$webOk = Esperar-Url 'http://localhost:3000' 120
Write-Host ''
if ($webOk) { Write-Ok 'Frontend no ar' } else { Write-Warn 'Frontend demorou - veja a janela "Luck Web"' }

if ($webOk -and -not $NoBrowser) { Start-Process 'http://localhost:3000' }

Write-Host @"

  ---------------------------------------------------------------
   App        http://localhost:3000
   Swagger    http://localhost:3001/api/docs
   Login demo demo@barbearialuck.com / 123456

   Os codigos de OTP aparecem no LOG do backend - a integracao de
   WhatsApp e e-mail e mock em desenvolvimento, nao envia nada.

   Para parar: feche as duas janelas e rode 'docker compose down'.
  ---------------------------------------------------------------

"@ -ForegroundColor White
