---
paths:
  - scripts/deploy.sh
  - .github/workflows/**
---

# Deploy

Três caminhos chegam ao projeto Vercel `guia-1305c`
(`prj_1egGjvrM5W7KIgf0LtYSvzARlCNE`, time `Numix`, plano **Hobby**). O projeto
**está linkado** ao repositório `lkasvr/guia-checkin-checkout-airbnb`
(production branch `main`, desde 20/07/2026): todo push cria um deployment
`source: git`, além do que o workflow ou a sua CLI criam.

| | Integração Git | Merge na `main` | CLI na sua máquina |
|---|---|---|---|
| quem dispara | todo push | GitHub Actions (`.github/workflows/deploy.yml`) | você |
| autenticação | a própria integração | secret `VERCEL_TOKEN` | sua sessão do `vercel login` |
| alvo | produção na `main`, preview no resto | produção | `npm run deploy` (preview) / `npm run deploy:prod` |
| migration pendente | não olha | aborta o job | pergunta se aplica |
| confere o resultado | não | sim (passos 6 a 8) | sim |

Um merge na `main` cria **dois** deployments de produção, um por caminho. Em
12/09/2026 o da integração nasceu às 22:04:04Z e o do workflow às 22:04:56Z; o
do workflow ficou com `readySubstate=PROMOTED`. Desligar um dos dois é decisão
em aberto.

```bash
npm run deploy                       # preview
npm run deploy:prod                  # produção
npm run deploy:prod -- --dry-run     # só as guardas, não publica
```

## Quem pode ser autor do commit

No plano Hobby a Vercel só constrói deployment cujo **commit HEAD é autorado
pelo dono do time** (`lkasvr`). Não importa quem deploya nem por qual caminho:
o `creator` foi `lkasvr` em todos os casos medidos, inclusive nos bloqueados.
Commit com autor `annahjubs` nasce assim:

    readyState=BLOCKED   buildSkipped=true   0 funções   alias não assumido
    readyStateReason: "The deployment was blocked because the commit author
    doesn't have permission to create deployments for this project."

O motivo só aparece na API, não no `vercel inspect`:

```bash
vercel api /v13/deployments/<id-ou-host> | jq -r .readyStateReason
```

Medido em 19/09/2026 nos 30 deployments mais recentes: 18 BLOCKED desde
31/08/2026, todos com autor `annahjubs`; todos os READY com autor `lkasvr`.
Diante de um BLOCKED a CLI 51.8.0 ora devolve sucesso (09 e 10/09/2026), ora
fica presa em `Building...` até o `timeout-minutes: 20` do workflow matar o job
(17 e 19/09/2026, runs 35258599872 e 35460744531, conclusão `cancelled`).
Regra da Vercel:
<https://vercel.com/docs/deployments/troubleshoot-project-collaboration#team-configuration>.

Consequência prática: **PR da Anna é mergeado pelo Lucas**, com "Create a merge
commit". O merge commit fica autorado por quem clica, e o deploy passa (PR #5,
12/09/2026). Se a Anna clicar em Merge, a `main` avança mas produção não (PRs #4,
#6 e #7). Não dá para travar isso no GitHub: branch protection em repositório
privado exige GitHub Pro. A saída definitiva é o plano Pro na Vercel, com a Anna
no time (a conta dela, `02annajulia-1748`, já está ligada ao GitHub).

## Por que o script confere o resultado

Exit code zero do `vercel deploy` não é prova de que subiu. Por isso o passo 5
deploya com `--no-wait` e a espera é feita nos passos 6 a 8, lendo a API:

6. polling em `vercel api /v13/deployments/<host>` até `READY`, `ERROR`,
   `CANCELED` ou `BLOCKED` (10 min no máximo). Fora de `READY`, imprime o
   `readyStateReason` e aborta. `READY` com zero funções λ também aborta: o Next
   não foi construído (o Framework Preset do projeto é `Other`; quem conserta é
   o `"framework": "nextjs"` do `vercel.json`).
7. `vercel inspect https://anfyi.com.br --json` tem de devolver o **mesmo `id`**
   do deployment recém-criado. Se não devolver, o script manda promover:
   `vercel promote <url>`.
8. `anfyi.com.br`, `app.anfyi.com.br/login` e `admin.anfyi.com.br` têm de
   responder 2xx ou 3xx.

## As quatro variáveis `sensitive`

No ambiente Production, quatro variáveis são `type=sensitive` na Vercel:

    AUTH_SECRET   DATABASE_URL   DATABASE_URL_UNPOOLED   SUPERADMIN_PASSWORD_HASH

`sensitive` é **write-only**: o runtime recebe o valor, mas `vercel env pull`
devolve string vazia. Confira com
`vercel api /v9/projects/<projectId>/env | jq '.envs[] | {key, type}'`.

Duas consequências, ambas já tratadas no script:

- **A checagem de migration não pode usar `DATABASE_URL_UNPOOLED`.** O passo 3
  cai para `POSTGRES_URL_NON_POOLING` (`type=encrypted`, vem preenchida), que
  descreve o mesmo endpoint direto: `ep-quiet-sun-avueq9cu` / `neondb`. Dá para
  passar por cima exportando `PROD_DIRECT_URL`.
- **Não construa produção localmente.** `--prebuilt` faz `vercel build` aqui,
  com essas quatro vazias. O workflow deploya **sem** `--prebuilt` de propósito:
  só o build remoto enxerga os valores reais. O script pede confirmação se você
  insistir.

## O passo 3 aponta o Prisma para produção

Pelo `DIRECT_URL`, não pelo `DATABASE_URL_UNPOOLED`: `DIRECT_URL` é o primeiro
da cadeia em `prisma.config.ts` e não existe em nenhum `.env` do projeto, e o
`dotenv` não sobrescreve o que já está no `process.env`. Nada pode sombreá-lo.

`prisma migrate status` só lê a tabela `_prisma_migrations`. Aplicar é que muda
o banco, e isso só acontece depois de você responder `s`.

## Secrets do repositório GitHub

Três, em *Settings → Secrets and variables → Actions*:

| secret | de onde sai |
|---|---|
| `VERCEL_TOKEN` | vercel.com/account/settings/tokens, escopo do time `Numix` |
| `VERCEL_ORG_ID` | `jq -r .orgId .vercel/project.json` |
| `VERCEL_PROJECT_ID` | `jq -r .projectId .vercel/project.json` |

Os dois IDs vão como secret, e não como `env` do workflow, porque `.vercel/` é
ignorado pelo git justamente para não os versionar.

## Regras duras

1. **O CI nunca altera banco.** Com `--yes` (é o que o workflow usa), migration
   pendente **aborta** o job. Quem aplica é uma pessoa, rodando
   `npm run deploy:prod` na própria máquina e respondendo ao prompt.
2. **Árvore suja bloqueia o deploy.** O `vercel deploy` envia os arquivos do
   disco, não o commit. `--allow-dirty` existe, mas o que subir não corresponde
   a commit nenhum.
3. **Mudança de env var só vale em deployment novo.** Depois de alterar, rode
   `npm run deploy:prod` ou `vercel redeploy <url-de-producao>`.
4. **Fixe a versão da CLI.** O workflow usa `vercel@51.8.0`. As armadilhas de
   `.claude/rules/ambientes-e-bancos.md` e a forma do `vercel inspect --json`
   foram medidas nessa versão.
5. **Merge na `main` é o Lucas quem faz.** Enquanto o plano for Hobby, o commit
   HEAD tem de ser dele, senão o deployment nasce BLOCKED (ver "Quem pode ser
   autor do commit").
