<#
.SYNOPSIS
  Sobe a stack de desenvolvimento da Barbearia Luck com um comando.

.DESCRIPTION
  Postgres + Redis (Docker), backend NestJS (3001) e frontend Next.js (3000).
  O script e idempotente: pode ser rodado quantas vezes quiser. Ele corrige
  sozinho o que consegue (env faltando, segredo fraco, deps ausentes,
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

<#
  Executa um programa externo sem deixar o PowerShell confundir stderr com erro.

  Este helper existe por um motivo concreto: com $ErrorActionPreference='Stop',
  o operador `2>&1` transforma cada linha de stderr num ErrorRecord terminante.
  O Docker escreve o progresso normal ("Network default Creating") em stderr,
  entao `docker compose up -d 2>&1 | Out-Null` abortava o script com
  NativeCommandError mesmo tendo funcionado.

  Aqui a preferencia e rebaixada durante a chamada e o sucesso passa a ser
  julgado unicamente pelo codigo de saida, que e o contrato real de um
  programa externo.
#>
function Invoke-Native {
  param(
    [Parameter(Mandatory)][string]$Programa,
    [string[]]$Argumentos = @(),
    [switch]$Silencioso
  )

  $anterior = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    if ($Silencioso) {
      & $Programa @Argumentos 2>&1 | Out-Null
    } else {
      & $Programa @Argumentos 2>&1 | ForEach-Object { Write-Host "       $_" -ForegroundColor DarkGray }
    }
    return $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $anterior
  }
}

# Mesma ideia do Invoke-Native, mas devolvendo a saida em texto.
function Get-NativeOut {
  param(
    [Parameter(Mandatory)][string]$Programa,
    [string[]]$Argumentos = @()
  )

  $anterior = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $saida = & $Programa @Argumentos 2>&1 |
      Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] }
    return (($saida | Out-String).Trim())
  } finally {
    $ErrorActionPreference = $anterior
  }
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

if ((Invoke-Native 'docker' @('info') -Silencioso) -ne 0) {
  Write-Fix 'Docker Desktop parece parado - tentando abrir e aguardando ate 120s...'

  $caminhos = @(
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
  ) | Where-Object { Test-Path $_ }

  if ($caminhos) {
    Start-Process -FilePath $caminhos[0] -ErrorAction SilentlyContinue
  } else {
    Write-Warn 'Nao achei o executavel do Docker Desktop - abra manualmente'
  }

  $esperou = 0
  $subiu = $false
  while ($esperou -lt 120) {
    Start-Sleep -Seconds 3
    $esperou += 3
    Write-Host '.' -NoNewline
    if ((Invoke-Native 'docker' @('info') -Silencioso) -eq 0) { $subiu = $true; break }
  }
  Write-Host ''
  if (-not $subiu) { Die 'Docker nao respondeu em 120s. Abra o Docker Desktop e rode de novo.' }
}
Write-Ok 'Docker respondendo'

# ── 2. configuracao ──────────────────────────────────────────────────────
Write-Step '2/6  Configuracao do backend'

$envPath = Join-Path $BACKEND '.env'
$envExample = Join-Path $BACKEND '.env.example'

if (-not (Test-Path $envPath)) {
  if (-not (Test-Path $envExample)) { Die "Nem .env nem .env.example existem em $BACKEND" }
  Copy-Item $envExample $envPath
  Write-Fix '.env criado a partir do .env.example'
}

$envTexto = Get-Content $envPath -Raw
if ($null -eq $envTexto) { $envTexto = '' }

# A API foi endurecida e recusa subir com segredo ausente, de exemplo ou curto.
# Melhor gerar um real aqui do que deixar o backend morrer na subida.
$segredoAtual = ''
if ($envTexto -match 'JWT_SECRET\s*=\s*"?([^"\r\n]*)"?') { $segredoAtual = $Matches[1].Trim() }

$proibidos = @('', 'seu-secret-aqui', 'changeme', 'secret', 'jwt-secret', 'dev', 'test')

# Um segredo pode ter 32+ caracteres e ainda assim ser obviamente descartavel.
# Palavra em texto claro dizendo "nao use isso" e sinal suficiente.
$pareceDescartavel = $segredoAtual -match '(?i)(dev-only|nao-usar|not-for-prod|example|placeholder|troque|change-?me)'

$segredoRuim = ($envTexto -notmatch 'JWT_SECRET') -or
               ($proibidos -contains $segredoAtual.ToLower()) -or
               ($segredoAtual.Length -lt 32) -or
               $pareceDescartavel

if ($segredoRuim) {
  $motivo = if ($segredoAtual.Length -gt 0 -and $segredoAtual.Length -lt 32) { 'era curto demais' } else { 'estava vazio ou era de exemplo' }
  $segredo = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  if ($envTexto -match 'JWT_SECRET') {
    $envTexto = $envTexto -replace 'JWT_SECRET\s*=.*', "JWT_SECRET=`"$segredo`""
  } else {
    $envTexto = $envTexto.TrimEnd() + "`nJWT_SECRET=`"$segredo`"`n"
  }
  Set-Content -Path $envPath -Value $envTexto -NoNewline
  Write-Fix "JWT_SECRET gerado - o anterior $motivo"
} else {
  Write-Ok "JWT_SECRET presente ($($segredoAtual.Length) caracteres)"
}

if ($envTexto -notmatch 'CORS_ORIGINS') {
  Add-Content -Path $envPath -Value "`nCORS_ORIGINS=`"http://localhost:3000`""
  Write-Fix 'CORS_ORIGINS adicionada'
} else {
  Write-Ok 'CORS_ORIGINS presente'
}

# NODE_ENV=production num ambiente local faz a validacao exigir coisas de
# producao e o Swagger sumir. Quase sempre e engano.
if ($envTexto -match 'NODE_ENV\s*=\s*"?production"?') {
  Write-Warn 'NODE_ENV=production no .env local - o Swagger fica desligado e a validacao fica mais rigida'
}

<#
  A DATABASE_URL precisa apontar para o Postgres que o compose sobe.

  Isto ja quebrou de verdade: um .env trazido de outra maquina apontava para
  a porta 5433, o compose subia o banco na 5432, e a falha so aparecia la na
  frente no 'prisma migrate deploy' com um P1001 generico. Conferir aqui custa
  nada e transforma um erro obscuro num aviso claro.
#>
$portaCompose = '5432'
$composePath = Join-Path $ROOT 'docker-compose.yml'
if (Test-Path $composePath) {
  $composeTexto = Get-Content $composePath -Raw
  if ($composeTexto -match "(?m)^\s*-\s*'?(\d+):5432'?") { $portaCompose = $Matches[1] }
}

if ($envTexto -match 'DATABASE_URL\s*=\s*"?([^"\r\n]+)"?') {
  $urlBanco = $Matches[1]
  if ($urlBanco -match '@[^:/]+:(\d+)/') {
    $portaEnv = $Matches[1]
    if ($portaEnv -ne $portaCompose) {
      Write-Warn "DATABASE_URL aponta para a porta $portaEnv, mas o docker-compose publica a $portaCompose"
      Write-Warn 'Corrigindo para bater com o compose - se voce usa um Postgres proprio, edite o .env depois'
      $envTexto = $envTexto -replace '(DATABASE_URL\s*=\s*"?[^"\r\n]*@[^:/]+):\d+/', "`${1}:$portaCompose/"
      Set-Content -Path $envPath -Value $envTexto -NoNewline
      Write-Fix "DATABASE_URL ajustada para a porta $portaCompose"
    } else {
      Write-Ok "DATABASE_URL na porta $portaCompose, batendo com o compose"
    }
  }
} else {
  Die 'DATABASE_URL ausente no .env'
}

# ── 3. banco ─────────────────────────────────────────────────────────────
Write-Step '3/6  Postgres e Redis'

Push-Location $ROOT
try {
  if ($Reset) {
    Write-Warn 'Reset pedido - isso APAGA todos os dados do banco local.'
    $r = Read-Host '     Digite RESET para confirmar'
    if ($r -ne 'RESET') { Die 'Cancelado.' }
    Invoke-Native 'docker' @('compose', 'down', '-v') -Silencioso | Out-Null
    Write-Fix 'Volumes removidos'
  }

  # O Docker escreve o progresso em stderr; por isso passa pelo Invoke-Native.
  $codigo = Invoke-Native 'docker' @('compose', 'up', '-d') -Silencioso

  if ($codigo -ne 0) {
    # Caso mais comum de falha aqui: os containers ja existem, criados por
    # outro checkout do mesmo repositorio. O docker-compose.yml fixa
    # container_name, e o Compose deriva o nome do projeto da pasta — logo,
    # a mesma stack rodando de outra pasta bate de frente por nome.
    #
    # Se o Postgres ja esta no ar, abortar seria birra: o que o usuario quer
    # e o banco disponivel, e ele esta.
    $rodando = Get-NativeOut 'docker' @(
      'ps', '--filter', 'name=barbearia_luck', '--filter', 'status=running', '--format', '{{.Names}}'
    )

    if ($rodando -match 'barbearia_luck_db') {
      Write-Warn 'Os containers ja existiam (provavelmente de outro checkout) - reaproveitando'
      if ($rodando -notmatch 'barbearia_luck_redis') {
        Write-Warn 'O Redis nao esta rodando, mas o app nao depende dele em desenvolvimento'
      }
    } else {
      Write-Warn 'docker compose up falhou - repetindo com a saida visivel:'
      Invoke-Native 'docker' @('compose', 'up', '-d') | Out-Null
      Write-Host ''
      Write-Host '  Se o erro citar "container name is already in use", rode:' -ForegroundColor Yellow
      Write-Host '    docker rm -f barbearia_luck_db barbearia_luck_redis' -ForegroundColor Yellow
      Write-Host '  e chame o dev.cmd de novo. Isso remove os containers, nao os dados.' -ForegroundColor Yellow
      Write-Host ''
      Die 'Nao consegui subir os containers.'
    }
  } else {
    Write-Ok 'Containers no ar'
  }

  Write-Host '  ...  aguardando o Postgres aceitar conexao' -NoNewline
  $pronto = $false
  foreach ($i in 1..60) {
    # Pelo compose primeiro; se o container veio de outro projeto, o exec
    # direto pelo nome ainda funciona.
    if ((Invoke-Native 'docker' @('compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'postgres') -Silencioso) -eq 0) {
      $pronto = $true; break
    }
    if ((Invoke-Native 'docker' @('exec', 'barbearia_luck_db', 'pg_isready', '-U', 'postgres') -Silencioso) -eq 0) {
      $pronto = $true; break
    }
    Start-Sleep -Seconds 1
    Write-Host '.' -NoNewline
  }
  Write-Host ''
  if (-not $pronto) { Die 'Postgres nao ficou pronto em 60s. Veja: docker logs barbearia_luck_db' }
  Write-Ok 'Postgres pronto'
} finally { Pop-Location }

# ── 4. backend ───────────────────────────────────────────────────────────
Write-Step '4/6  Backend'

Push-Location $BACKEND
try {
  if (-not (Test-Path (Join-Path $BACKEND 'node_modules'))) {
    Write-Fix 'node_modules ausente - instalando (pode demorar alguns minutos)'
    if ((Invoke-Native 'npm' @('install')) -ne 0) { Die 'npm install do backend falhou' }
  }
  Write-Ok 'Dependencias instaladas'

  # O client do Prisma e gerado; sem ele o backend nao sobe.
  if ((Invoke-Native 'npx' @('prisma', 'generate') -Silencioso) -ne 0) {
    Write-Warn 'prisma generate falhou - repetindo com a saida visivel:'
    Invoke-Native 'npx' @('prisma', 'generate') | Out-Null
    Die 'prisma generate falhou. Se o erro citar binaries.prisma.sh, e bloqueio de rede (proxy/firewall).'
  }
  Write-Ok 'Prisma client gerado'

  <#
    Pre-voo antes de migrar.

    A migration de hardening cria e-mail unico e a constraint anti-sobreposicao.
    Constraint nao nasce sobre dado que ja a viola, entao a migration limpa
    antes: zera e-mail duplicado e apaga o agendamento mais novo de cada par
    sobreposto. Em banco de desenvolvimento isso quase sempre nao custa nada —
    mas "quase sempre" nao e garantia, e apagar linha sem avisar nao se faz.
  #>
  $prevoo = Join-Path $BACKEND 'scripts\verificar-antes-de-migrar.js'
  if (Test-Path $prevoo) {
    $codigoPrevoo = Invoke-Native 'node' @($prevoo)
    if ($codigoPrevoo -eq 2) {
      Write-Host ''
      Write-Warn 'A migration vai remover os dados listados acima.'
      $resposta = Read-Host '     Digite SIM para continuar, ou qualquer outra coisa para parar'
      if ($resposta -ne 'SIM') {
        Write-Host ''
        Write-Host '  Parado a seu pedido. Para guardar o estado atual antes de tentar de novo:' -ForegroundColor Yellow
        Write-Host '    docker exec barbearia_luck_db pg_dump -U postgres barbearia_luck > backup.sql' -ForegroundColor Yellow
        Write-Host ''
        Die 'Migration cancelada.'
      }
    }
  }

  if ((Invoke-Native 'npx' @('prisma', 'migrate', 'deploy')) -ne 0) {
    Write-Host ''
    Write-Host '  P1001 "can''t reach database"  -> confira a DATABASE_URL no backend\.env.' -ForegroundColor Yellow
    Write-Host '                                    Ela precisa apontar para localhost:' -NoNewline -ForegroundColor Yellow
    Write-Host "$portaCompose, que e o que o compose publica." -ForegroundColor Yellow
    Write-Host '  Erro de drift                 -> ".\dev.cmd -Reset" recria o banco (APAGA os dados).' -ForegroundColor Yellow
    Write-Host ''
    Die 'prisma migrate deploy falhou.'
  }
  Write-Ok 'Migrations aplicadas'

  if (-not $SkipSeed) {
    if ((Invoke-Native 'npx' @('prisma', 'db', 'seed') -Silencioso) -eq 0) {
      Write-Ok 'Seed aplicado'
    } else {
      Write-Warn 'Seed nao rodou (provavelmente ja existia) - seguindo'
    }
  }
} finally { Pop-Location }

# ── 5. frontend ──────────────────────────────────────────────────────────
Write-Step '5/6  Frontend'

Push-Location $FRONTEND
try {
  if (-not (Test-Path (Join-Path $FRONTEND 'node_modules'))) {
    Write-Fix 'node_modules ausente - instalando'
    if ((Invoke-Native 'npm' @('install')) -ne 0) { Die 'npm install do frontend falhou' }
  }
  Write-Ok 'Dependencias instaladas'
} finally { Pop-Location }

# ── 6. subir os servidores ───────────────────────────────────────────────
Write-Step '6/6  Subindo os servidores'

function Liberar-Porta($porta, $nome) {
  $conexoes = $null
  try {
    $conexoes = Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue
  } catch {
    # Get-NetTCPConnection nao existe em toda edicao do Windows.
    Write-Warn "Nao consegui checar a porta $porta - se der EADDRINUSE, feche o processo manualmente"
    return
  }
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
      # Um 4xx tambem significa que ha alguem escutando na porta.
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
