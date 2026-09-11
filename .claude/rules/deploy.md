---
paths:
  - scripts/deploy.sh
  - .github/workflows/**
---

# Deploy

Dois caminhos, o mesmo script. O projeto Vercel `guia-1305c`
(`prj_1egGjvrM5W7KIgf0LtYSvzARlCNE`, time `Numix`) **não tem integração Git** —
nada acontece só por empurrar commit. Quem publica é a CLI.

| | Merge na `main` | CLI na sua máquina |
|---|---|---|
| quem dispara | GitHub Actions (`.github/workflows/deploy.yml`) | você |
| autenticação | secret `VERCEL_TOKEN` | sua sessão do `vercel login` |
| alvo | produção | `npm run deploy` (preview) / `npm run deploy:prod` |
| migration pendente | aborta o job | pergunta se aplica |

```bash
npm run deploy                       # preview
npm run deploy:prod                  # produção
npm run deploy:prod -- --dry-run     # só as guardas, não publica
```

## Por que o script confere o resultado

Em 09 e 10/09/2026 três deploys de produção terminaram com
`readyState=BLOCKED`, zero funções λ e sem assumir `anfyi.com.br` — **e o
comando devolveu sucesso**. O site seguiu servindo o deployment de 23/08. Exit
code zero não é prova de que subiu; por isso os passos 6 a 8:

6. `vercel inspect --json` tem de dizer `readyState=READY`, e o deployment tem
   de ter mais de zero funções λ. Zero função significa que o Next não foi
   construído (o Framework Preset do projeto é `Other`; quem conserta é o
   `"framework": "nextjs"` do `vercel.json`).
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
