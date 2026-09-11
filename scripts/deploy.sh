#!/usr/bin/env bash
#
# Deploy do guia-1305c na Vercel.
#
#   scripts/deploy.sh                  # preview
#   scripts/deploy.sh --prod           # produção (assume anfyi.com.br)
#
# Flags:
#   --prod              publica em produção
#   --prebuilt          constrói aqui (vercel build) e envia .vercel/output
#   --skip-migrations   não checa migration pendente em produção
#   --allow-dirty       deixa passar árvore de trabalho suja
#   --yes               não pergunta nada; migration pendente vira erro (CI)
#   --dry-run           roda as guardas e a checagem de migration, e para antes
#                       de construir ou publicar
#
# Por que as etapas 6 a 8 existem: em 09 e 10/09/2026 três deploys de produção
# terminaram com readyState=BLOCKED, zero funções e sem assumir anfyi.com.br —
# e o comando devolveu sucesso. Exit code zero não é prova de que subiu.

set -euo pipefail

readonly APEX="anfyi.com.br"
readonly HEALTH_URLS=(
  "https://anfyi.com.br"
  "https://app.anfyi.com.br/login"
  "https://admin.anfyi.com.br"
)

if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; OFF=$'\033[0m'
else
  BOLD=""; RED=""; GREEN=""; YELLOW=""; DIM=""; OFF=""
fi

step() { printf '\n%s==> %s%s\n' "$BOLD" "$*" "$OFF"; }
ok()   { printf '    %s✓%s %s\n' "$GREEN" "$OFF" "$*"; }
warn() { printf '    %s!%s %s\n' "$YELLOW" "$OFF" "$*"; }
note() { printf '    %s%s%s\n' "$DIM" "$*" "$OFF"; }

# Lê uma chave de um arquivo .env baixado, tirando as aspas do valor.
env_value() { sed -n "s/^$1=//p" "$2" | head -1 | sed 's/^"//; s/"$//'; }
die()  { printf '\n%s✗ %s%s\n' "$RED" "$*" "$OFF" >&2; exit 1; }

TMP_FILES=()
cleanup() {
  if (( ${#TMP_FILES[@]} > 0 )); then rm -f "${TMP_FILES[@]}"; fi
}
trap cleanup EXIT

TARGET="preview"
PREBUILT=0
SKIP_MIGRATIONS=0
ALLOW_DIRTY=0
ASSUME_YES=0
DRY_RUN=0
[[ -n "${CI:-}" ]] && ASSUME_YES=1

usage() { sed -n '3,19p' "$0" | sed 's/^# \{0,1\}//'; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod|--production) TARGET="production" ;;
    --prebuilt)          PREBUILT=1 ;;
    --skip-migrations)   SKIP_MIGRATIONS=1 ;;
    --allow-dirty)       ALLOW_DIRTY=1 ;;
    --yes|-y)            ASSUME_YES=1 ;;
    --dry-run)           DRY_RUN=1 ;;
    -h|--help)           usage; exit 0 ;;
    *)                   die "flag desconhecida: $1" ;;
  esac
  shift
done

confirm() {
  local reply
  if (( ASSUME_YES )); then return 0; fi
  printf '    %s?%s %s [s/N] ' "$YELLOW" "$OFF" "$1"
  read -r reply </dev/tty || return 1
  [[ "$reply" =~ ^[SsYy]$ ]]
}

# ─────────────────────────────────────────────────────── 1/8  Pré-requisitos
step "1/8  Pré-requisitos"

for cmd in git vercel node npm npx curl jq; do
  command -v "$cmd" >/dev/null 2>&1 || die "'$cmd' não está no PATH."
done

REPO_ROOT="$(git rev-parse --show-toplevel)" || die "não estou dentro de um repositório git."
cd "$REPO_ROOT"

if [[ -n "${VERCEL_ORG_ID:-}" && -n "${VERCEL_PROJECT_ID:-}" ]]; then
  ok "projeto por VERCEL_ORG_ID/VERCEL_PROJECT_ID (${VERCEL_PROJECT_ID})"
elif [[ -f .vercel/project.json ]]; then
  ok "projeto linkado: $(jq -r '.projectName' .vercel/project.json)"
else
  die "projeto não linkado. Rode 'vercel link', ou exporte VERCEL_ORG_ID e VERCEL_PROJECT_ID."
fi

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  ok "autenticação por VERCEL_TOKEN"
else
  WHO="$(vercel whoami --format json 2>/dev/null | jq -r '.username // .name // empty')"
  [[ -n "$WHO" ]] || die "CLI não autenticada. Rode 'vercel login' ou exporte VERCEL_TOKEN."
  ok "autenticado como $WHO"
fi

ok "CLI $(vercel --version 2>/dev/null | tail -1)"

# ─────────────────────────────────────────────── 2/8  Estado do repositório
step "2/8  Estado do repositório"

BRANCH="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}"
SHA="$(git rev-parse --short HEAD)"

if [[ -n "$(git status --porcelain)" ]]; then
  if (( ALLOW_DIRTY )); then
    warn "árvore de trabalho suja — seguindo por causa de --allow-dirty"
  else
    git status --short | sed 's/^/      /'
    die "árvore de trabalho suja. O deploy envia os arquivos do disco, não o commit. Commite, dê stash, ou use --allow-dirty."
  fi
fi
ok "$BRANCH @ $SHA"

if [[ "$TARGET" == "production" && "$BRANCH" != "main" && "$BRANCH" != "HEAD" ]]; then
  confirm "Produção a partir de '$BRANCH', que não é a main. Continuar?" || die "cancelado."
fi

# ───────────────────────────────────────────────────────── 3/8  Migrations
step "3/8  Migrations"

if [[ "$TARGET" != "production" ]]; then
  # Development e Preview apontam para a branch dev do Neon — o mesmo banco que
  # o .env.local já descreve. Basta o status local, e ele não bloqueia.
  if npx prisma migrate status >/dev/null 2>&1; then
    ok "banco de desenvolvimento em dia"
  else
    warn "há migration pendente no banco de desenvolvimento (não bloqueia preview)"
  fi
elif (( SKIP_MIGRATIONS )); then
  warn "checagem pulada (--skip-migrations)"
else
  PROD_ENV_FILE="$(mktemp "${TMPDIR:-/tmp}/guia-1305c-prod-env.XXXXXX")"
  chmod 600 "$PROD_ENV_FILE"
  TMP_FILES+=("$PROD_ENV_FILE")

  # Caminho explícito de arquivo: 'vercel env pull' sem argumento reescreveria
  # o .env.local inteiro com valores de produção (ver .claude/rules/ambientes-e-bancos.md).
  vercel env pull "$PROD_ENV_FILE" --environment=production --yes >/dev/null 2>&1 \
    || die "falhou 'vercel env pull --environment=production'."

  # Quatro variáveis de Production são type=sensitive na Vercel (AUTH_SECRET,
  # DATABASE_URL, DATABASE_URL_UNPOOLED e SUPERADMIN_PASSWORD_HASH). Sensitive
  # é write-only: o runtime recebe o valor, mas o 'env pull' devolve string
  # vazia. POSTGRES_URL_NON_POOLING é type=encrypted, vem preenchida e descreve
  # o mesmo endpoint direto de produção (ep-quiet-sun-avueq9cu / neondb).
  URL_SOURCE=""
  PROD_DIRECT_URL="${PROD_DIRECT_URL:-}"
  if [[ -n "$PROD_DIRECT_URL" ]]; then
    URL_SOURCE="variável PROD_DIRECT_URL do ambiente"
  else
    for key in DATABASE_URL_UNPOOLED POSTGRES_URL_NON_POOLING; do
      PROD_DIRECT_URL="$(env_value "$key" "$PROD_ENV_FILE")"
      if [[ -n "$PROD_DIRECT_URL" ]]; then URL_SOURCE="$key"; break; fi
    done
  fi

  if [[ -z "$PROD_DIRECT_URL" ]]; then
    die "nenhuma URL direta de produção disponível: DATABASE_URL_UNPOOLED e POSTGRES_URL_NON_POOLING vieram vazias do 'env pull'. Exporte PROD_DIRECT_URL com a connection string direta, ou tire o --skip-migrations de lado e migre à mão."
  fi

  PROD_HOST="$(printf '%s' "$PROD_DIRECT_URL" | sed -E 's#^[^@]*@([^/?]+).*#\1#')"
  PROD_DB="$(printf '%s' "$PROD_DIRECT_URL" | sed -E 's#^[^/]*//[^/]*/([^?]+).*#\1#')"
  ok "alvo: $PROD_DB @ $PROD_HOST (de $URL_SOURCE)"

  if [[ "$PROD_HOST" == *-pooler.* ]]; then
    warn "essa URL passa pelo pooler do Neon; o Prisma CLI recusa DDL por ele"
  fi

  # DIRECT_URL é o primeiro da cadeia em prisma.config.ts e não existe em
  # nenhum .env do projeto; o dotenv não sobrescreve o que já está no ambiente.
  # Nada pode sombrear este valor.
  set +e
  MIGRATE_OUT="$(DIRECT_URL="$PROD_DIRECT_URL" npx prisma migrate status 2>&1)"
  MIGRATE_RC=$?
  set -e

  if grep -q 'up to date' <<<"$MIGRATE_OUT"; then
    ok "produção em dia, nenhuma migration pendente"
  elif grep -qiE 'not yet been applied|following migration' <<<"$MIGRATE_OUT"; then
    printf '%s\n' "$MIGRATE_OUT" | sed 's/^/      /'
    if (( ASSUME_YES )); then
      die "há migration pendente em produção. Aplique rodando 'npm run deploy:prod' na sua máquina; o CI não altera banco sem alguém olhando."
    fi
    if confirm "Aplicar 'prisma migrate deploy' em $PROD_DB @ $PROD_HOST agora?"; then
      DIRECT_URL="$PROD_DIRECT_URL" npx prisma migrate deploy || die "'prisma migrate deploy' falhou."
      ok "migrations aplicadas em $PROD_DB"
    else
      confirm "Seguir com o deploy sem aplicar a migration?" || die "cancelado."
      warn "deploy seguindo com migration pendente em produção"
    fi
  else
    printf '%s\n' "$MIGRATE_OUT" | sed 's/^/      /'
    die "não consegui ler o estado das migrations (rc=$MIGRATE_RC)."
  fi
fi

if (( DRY_RUN )); then
  printf '\n%s✓ dry-run: guardas e migrations conferidas para %s%s\n' "$GREEN" "$TARGET" "$OFF"
  note "nada foi construído nem publicado; tire o --dry-run para deployar"
  exit 0
fi

# ────────────────────────────────────────────────────────────── 4/8  Build
step "4/8  Build"

DEPLOY_ARGS=(deploy --yes)
[[ "$TARGET" == "production" ]] && DEPLOY_ARGS+=(--prod)

if (( PREBUILT )); then
  if [[ "$TARGET" == "production" ]]; then
    warn "--prebuilt em produção: AUTH_SECRET, DATABASE_URL, DATABASE_URL_UNPOOLED e"
    warn "SUPERADMIN_PASSWORD_HASH são type=sensitive e voltam vazias do 'vercel pull',"
    warn "então o build local roda sem elas. O build remoto (sem --prebuilt) as recebe."
    confirm "Construir localmente mesmo assim?" || die "cancelado."
    vercel pull --yes --environment=production >/dev/null 2>&1 || die "falhou 'vercel pull --environment=production'."
    TMP_FILES+=(".vercel/.env.production.local")
    vercel build --prod || die "o build local falhou."
  else
    vercel pull --yes --environment=preview --git-branch "$BRANCH" >/dev/null 2>&1 \
      || die "falhou 'vercel pull --environment=preview'."
    TMP_FILES+=(".vercel/.env.preview.local")
    vercel build || die "o build local falhou."
  fi
  DEPLOY_ARGS+=(--prebuilt)
  ok "build local pronto em .vercel/output"
  note "o .vercel/.env.${TARGET}.local baixado será apagado ao fim desta execução"
else
  ok "build remoto na Vercel (passe --prebuilt para construir aqui)"
fi

# ───────────────────────────────────────────────────────────── 5/8  Deploy
step "5/8  Deploy ($TARGET)"

DEPLOY_URL="$(vercel "${DEPLOY_ARGS[@]}" | grep -oE 'https://[^[:space:]]+' | tail -1)" \
  || die "o comando 'vercel ${DEPLOY_ARGS[*]}' falhou."
[[ -n "$DEPLOY_URL" ]] || die "o deploy não devolveu uma URL."
ok "$DEPLOY_URL"

# ──────────────────────────────────────── 6/8  Verificação do deployment
step "6/8  Verificação do deployment"

vercel inspect "$DEPLOY_URL" --wait --timeout 10m >/dev/null 2>&1 || true

META="$(vercel inspect "$DEPLOY_URL" --json 2>/dev/null)" || die "não consegui inspecionar $DEPLOY_URL."
READY_STATE="$(jq -r '.readyState // "DESCONHECIDO"' <<<"$META")"
DEPLOY_ID="$(jq -r '.id' <<<"$META")"
LAMBDAS="$(jq '[.builds[]?.output[]? | select(.type == "lambda")] | length' <<<"$META")"

if [[ "$READY_STATE" != "READY" ]]; then
  die "readyState=$READY_STATE (esperado READY). O deployment $DEPLOY_ID não está no ar e não assumiu domínio nenhum."
fi

if (( LAMBDAS == 0 )); then
  if [[ "$TARGET" == "production" ]]; then
    die "o deployment $DEPLOY_ID subiu com 0 funções — o Next não foi construído. Confira o Framework Preset do projeto (hoje é 'Other'; quem corrige é o \"framework\": \"nextjs\" do vercel.json)."
  fi
  warn "0 funções neste deployment"
fi
ok "READY · $LAMBDAS funções · $DEPLOY_ID"

# ─────────────────────────────────────────────────────────── 7/8  Domínios
step "7/8  Domínios"

if [[ "$TARGET" == "production" ]]; then
  LIVE_ID="$(vercel inspect "https://$APEX" --json 2>/dev/null | jq -r '.id // "?"')"
  if [[ "$LIVE_ID" == "$DEPLOY_ID" ]]; then
    ok "$APEX → $DEPLOY_ID"
    jq -r '.aliases[]? | "    · " + .' <<<"$META"
  else
    die "$APEX ainda serve $LIVE_ID, não $DEPLOY_ID. Promova com: vercel promote $DEPLOY_URL"
  fi
else
  ok "preview não mexe em domínio de produção"
fi

# ──────────────────────────────────────────────────────── 8/8  Health check
step "8/8  Health check"

HEALTH_FAILED=0
if [[ "$TARGET" == "production" ]]; then
  CHECK_URLS=("${HEALTH_URLS[@]}")
else
  CHECK_URLS=("$DEPLOY_URL")
fi

for url in "${CHECK_URLS[@]}"; do
  CODE="$(curl -sS -o /dev/null -w '%{http_code}' -L -m 25 "$url" 2>/dev/null || echo "000")"
  if [[ "$CODE" =~ ^[23] ]]; then
    ok "$CODE  $url"
  elif [[ "$TARGET" != "production" ]]; then
    warn "$CODE  $url (preview pode estar atrás da proteção de deployment)"
  else
    warn "$CODE  $url"
    HEALTH_FAILED=1
  fi
done

(( HEALTH_FAILED == 0 )) || die "o deployment está READY e aliasado, mas algum domínio não respondeu 2xx/3xx."

printf '\n%s✓ %s no ar%s  %s\n' "$GREEN" "$TARGET" "$OFF" "$DEPLOY_URL"
[[ "$TARGET" == "production" ]] && printf '  https://%s\n' "$APEX"
exit 0
