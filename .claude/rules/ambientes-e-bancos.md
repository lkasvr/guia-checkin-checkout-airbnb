---
paths:
  - prisma/**
  - prisma.config.ts
  - src/lib/db.ts
  - src/auth.ts
  - vercel.json
  - .env*
---

# Ambientes e bancos

Dois ambientes, **dois bancos distintos**, credenciais que não se cruzam. Nenhuma
senha está escrita neste arquivo — ele é versionado. Os valores vivem em
`CREDENCIAIS.local.md` (não versionado, na raiz), em `.env.development.local` e
no ambiente Production da Vercel.

## O mapa

|  | Desenvolvimento | Produção |
|---|---|---|
| onde roda | `npm run dev` na sua máquina | `*.anfyi.com.br` |
| projeto Neon | `green-pond-72694052` | o mesmo |
| branch Neon | `dev` (`br-shiny-mountain-av4fs9ps`) | `main` (`br-empty-haze-avkwjqxt`) |
| endpoint | `ep-empty-pine-avivuhc0` | `ep-quiet-sun-avueq9cu` |
| database | `devdb` | `neondb` |
| role | `dev_owner` | `neondb_owner` |
| env da Vercel | Development **e** Preview | Production |

A role `dev_owner` **não** abre produção (`password authentication failed`), e as
duas senhas são diferentes. Trocar o host numa URL de dev não alcança produção.

## Arquivos de ambiente na sua máquina

| arquivo | conteúdo | quem escreve |
|---|---|---|
| `.env.local` | as 15 chaves de banco, apontando para a `dev` | `vercel env pull` **reescreve o arquivo inteiro** |
| `.env.development.local` | `AUTH_SECRET`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD_HASH` | só você; o `vercel env pull` não toca |

O `prisma.config.ts` carrega os dois, nessa ordem de precedência — a mesma do
Next. Se um override de banco for para o `.env.development.local`, ele vale
tanto para o app quanto para `migrate`/`seed`; não coloque banco só num dos dois.

**Só existem 15 chaves de banco porque a integração Neon as cria. O código lê
apenas `DATABASE_URL` (runtime, pooled, `src/lib/db.ts`) e `DATABASE_URL_UNPOOLED`
(CLI do Prisma, direta, `prisma.config.ts`).** As `PG*`/`POSTGRES_*` são
conveniência; se mudar uma URL, mude todas, senão sobra uma armadilha silenciosa.

## Rodar local

```bash
npm run dev              # sobe apontando para a branch dev / devdb
npm run db:studio        # Prisma Studio no mesmo banco
```

Confirme o alvo antes de qualquer comando de escrita:

```bash
npx prisma migrate status   # imprime database e host; tem de dizer devdb / ep-empty-pine
```

Login: os e-mails e senhas estão em `CREDENCIAIS.local.md`. Depois de entrar,
`/dashboard` é o painel do anfitrião; **o painel do superadmin é `/admin`, e não
há link para ele** — digite na barra de endereços (`src/app/login/page.tsx`
redireciona sempre para `/dashboard`).

Em produção o roteamento é por subdomínio (`src/proxy.ts`): `app.anfyi.com.br` →
dashboard, `admin.anfyi.com.br` → superadmin, `<slug>.anfyi.com.br` → o guia. Em
`localhost` e `*.vercel.app` só a raiz vira guia; o resto são rotas normais.

## Falar com os bancos

As connection strings saem do Neon, nunca de memória:

```bash
npx -y neonctl@3.6.0 connection-string dev  --project-id green-pond-72694052 \
  --role-name dev_owner --database-name devdb
npx -y neonctl@3.6.0 connection-string main --project-id green-pond-72694052
```

Para `psql`, prefira a URL **direta** (sem `-pooler`) — o pooler recusa alguns
comandos de DDL e sessão.

## Regras duras

1. **`migrate` e `seed` nunca miram produção por acidente.** Eles usam
   `DATABASE_URL_UNPOOLED` do `.env.local`, que aponta para a `dev`. Para agir em
   produção, passe a URL na linha do comando — explicitamente, uma vez só:
   ```bash
   DATABASE_URL_UNPOOLED='...neondb...' SEED_HOST_PASSWORD='...' npm run db:seed
   ```
   Não edite o `.env.local` para "só testar uma coisa" em produção.

2. **O seed é idempotente e não mexe em credencial sem ordem explícita.**
   `prisma/seed.ts` só grava senha quando `SEED_HOST_PASSWORD` vem no ambiente, e
   só cria a estadia de exemplo (com `doorCode` falso) quando `SEED_DEMO_STAY=1`.
   Rodar o seed sem essas duas variáveis é seguro em qualquer banco.

3. **Senha de anfitrião se troca pelo painel, não pelo seed.** `/admin` → card do
   anfitrião → "Redefinir senha". O seed é o caminho de emergência.

4. **Senha nunca passa por `trim()`.** `src/auth.ts` compara o valor cru que o
   navegador envia; aparar na escrita grava o hash de outra string e tranca a
   pessoa fora. Em `src/app/admin/actions.ts` existe `rawStr()` só para isso.

5. **Depois de `vercel env pull`, confira o `.env.local`.** Ele volta com os
   valores do ambiente Development — hoje a branch `dev`, o que está certo. Mas o
   arquivo é reescrito por inteiro: qualquer chave que você tenha acrescentado à
   mão some. Chave local nova vai para `.env.development.local`.

## Mudar variável na Vercel

Mudança de env var **só vale em deployment novo** — o deployment no ar guarda os
valores assados no build. Depois de alterar, `vercel redeploy <url-de-producao>`.

Três armadilhas medidas no Vercel CLI 51.8.0:

- `vercel env rm <chave> <ambiente>` apaga o **registro inteiro** quando existe um
  só registro para aquele nome, mesmo especificando o ambiente. Com registros já
  separados por escopo (situação atual), remove só o escopo pedido.
- `vercel api … -d '<json>'` e o POST em lote (array) devolvem `Invalid JSON (400)`.
  Use `vercel api … --input <arquivo>`, um objeto por requisição.
- `vercel env add <chave> preview --value … --yes` entra em laço pedindo a git
  branch. Para o escopo Preview, use o `vercel api`.

## O `$` do hash bcrypt

`SUPERADMIN_PASSWORD_HASH` é gravado com escapes diferentes em cada lugar:

- `.env.development.local` → **com `\$`**. O loader do Next (`@next/env` →
  `dotenv-expand`) trata `$2b`, `$10` como variáveis e destruiria o hash.
- Vercel, Production → **literal, sem escape**. Lá não passa por dotenv.

Errar isso não gera erro em log nenhum: o login apenas responde "E-mail ou senha
inválidos.". Gere o hash assim:

```bash
node -e 'require("bcryptjs").hash(process.argv[1],10).then(h=>console.log(h))' 'NOVA'
```

## Rotacionar a senha do banco de produção

O procedimento completo, com a janela de indisponibilidade que ele implica, está
em `CREDENCIAIS.local.md`, seção "Ao rotacionar". Em resumo: Postgres não aceita
duas senhas para a mesma role, então entre a rotação e o fim do redeploy o site
fica sem banco.
