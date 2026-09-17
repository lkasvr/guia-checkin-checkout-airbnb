# Git Workflow

## Nunca commitar direto na branch principal

A branch principal deste projeto (`main`, a branch que segue produção) **nunca** recebe commit direto de uma sessão de agente.

1. Antes de commitar qualquer mudança, confira em qual branch você está (`git branch --show-current`).
2. Se estiver na branch principal, crie uma branch nova antes do primeiro commit: `git checkout -b tipo/descricao-curta` (mesmo padrão de prefixo dos commits, `fix/`, `feat/`, `chore/`).
3. Nunca dê `git push` direto pra branch principal nem abra PR que você mesmo aprova/mergeia. Sempre peça permissão para `git push`.

## Granularidade de commit

Prefira um commit por unidade lógica de mudança (ex: um por "passo" de uma tarefa maior), não um commit gigante no final. Facilita reverter uma parte sem desfazer o resto.

Ao dividir um arquivo modificado por duas mudanças não relacionadas entre commits diferentes (`git add -p`), **confira sempre `git diff --cached --stat` antes de rodar `git commit`**, é fácil arrastar uma hunk staged de um passo anterior pro commit errado sem perceber.

## Estilo de mensagem

`tipo(escopo): descrição curta em português`, no imperativo. Exemplos reais do histórico: `feat(clima): gráfico de tendência do time no tempo`, `fix(inativos): acaba com vazamento de inativos + badges nos cards do hub`. Sem Conventional Commits estrito (não há commitlint configurado), mas o padrão `tipo(escopo):` é consistente, siga-o.

## O fluxo, passo a passo

1. **Toda mudança começa numa branch nova, nunca direto na principal**. Antes de criar a branch, o agente sincroniza com a versão mais recente da principal (o que outras pessoas já publicaram), pra evitar trabalhar em cima de uma versão desatualizada e gerar conflito na hora de juntar depois.
2. **A pessoa não precisa saber comando de Git.** Basta pedir a mudança em linguagem natural. Quem cria a branch, escreve o código e organiza o commit é o agente de IA.
3. **Antes de considerar qualquer mudança pronta, ela precisa ser testada num ambiente local**, rodando só na máquina de quem pediu, sem afetar ninguém. O agente sobe esse ambiente e avisa onde olhar (um endereço tipo `localhost`).
4. **Nada vai pra produção sem aprovação explícita da pessoa**, depois de ver funcionando no ambiente local. A frase que libera isso é algo como "testei, está aprovado, pode subir". Enquanto essa aprovação não vier, a mudança fica só na branch, sem afetar o sistema real.
5. **Antes de abrir o Pull Request, o agente roda a checagem de tipo do projeto** (e lint ou teste automatizado, se o projeto tiver). Se algo falhar, o agente corrige antes de continuar, não abre PR com verificação quebrada. O agente evita rodar o build completo de produção nesse momento, porque o build exige as credenciais reais de produção, e nem todo mundo tem essas credenciais na própria máquina.
6. **Depois de tudo passar**, o agente registra a mudança (commit), envia pro GitHub (push), e abre um Pull Request. **O agente sempre entrega o link direto do Pull Request**, pra pessoa só clicar e aprovar, sem precisar procurar. Isso ainda não entra na branch principal sozinho, precisa ser aprovado (por outra pessoa, por outro agente, ou pelo dono do projeto) antes do merge.
7. **Só depois do merge** é que o sistema automático de deploy publica a mudança de verdade pros usuários.

## Regras de segurança básicas

- Nunca peça pro agente colocar senha, token ou chave de API direto no código. Essas informações vivem em variáveis de ambiente, configuradas fora do código-fonte.
- Nunca cole senha, token ou chave real numa conversa com o agente de IA. Isso fica registrado na conversa. Se precisar configurar uma credencial, faça isso direto no painel do serviço (Vercel, Supabase, etc.), sem passar o valor pelo chat.
- Se o agente disser que algo "deveria estar funcionando" mas não testou de verdade, ele deve verificar antes de confirmar. Se você perceber uma afirmação sem verificação, pergunte "você testou isso agora, ou está assumindo?".
- Se uma mudança envolve login, permissão de usuário, ou dado de pagamento, trate com mais cautela: peça uma segunda revisão antes de aprovar o merge, mesmo que o teste local tenha funcionado.

## Quando algo dá errado

Se um erro aparecer em produção, a primeira opção não é corrigir, é **voltar pra última versão que funcionava** (rollback), se a plataforma de hospedagem usada nesse projeto tiver esse recurso disponível. Isso resolve o problema pros usuários na hora, sem pressa, e dá tempo de corrigir com calma depois. Só depois do rollback, ou se não houver essa opção, a correção segue o fluxo normal: branch nova, testar local, aprovar, então subir. Corrigir com calma seguindo o processo é mais seguro do que corrigir rápido sem ele.
