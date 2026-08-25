# Checklist de QA — antes de publicar

Rode isso (ou peça pra eu te guiar) antes de subir uma mudança pro
GitHub Pages, principalmente se ela mexeu em login, painel admin, ou
regras do Firebase. Pra ajustes só visuais (cor, texto, espaçamento),
o "checklist rápido" já basta.

**Como testar:** abra o site publicado numa aba anônima (Ctrl+Shift+N),
com o DevTools aberto (F12 → aba Console) do lado. Qualquer coisa em
vermelho no console durante os testes abaixo é sinal de alerta, mesmo
que a tela pareça normal.

---

## Checklist rápido (mudança visual/cosmética — ~2 min)

- [ ] A página carrega sem tela em branco e sem CSS quebrado
- [ ] Não aparece nenhum erro vermelho no console ao carregar
- [ ] A parte que você mudou está visualmente como esperado
- [ ] Login continua funcionando (testar com uma conta qualquer)

## Checklist completo (mudança em login, painel admin, ou regras — ~15 min)

### 1. Cadastro → aprovação → login
- [ ] "Quero ter acesso" abre e aceita um cadastro novo (nome + e-mail + senha)
- [ ] Depois de cadastrar, a tela mostra "Solicitação enviada!"
- [ ] Logado como admin, a pessoa aparece em "Parceiros → Solicitações pendentes"
- [ ] Clicar em Aceitar remove da lista de pendentes e some pra aprovados
- [ ] A pessoa recém-aprovada consegue logar com o e-mail e senha que cadastrou
- [ ] Ela **não** vê o botão ADMIN no topo
- [ ] Clicar em Recusar também funciona e não deixa a pessoa logar

### 2. Login de admin
- [ ] Login com a conta admin real funciona
- [ ] O botão ADMIN aparece no topo
- [ ] Abrir o painel mostra o menu de 7 cartões, sem erro no console

### 3. Painel admin — cada aba abre sem erro
- [ ] Parceiros (pendentes, lista de aprovados, contribuições)
- [ ] Tela de início (versículo, música, foto)
- [ ] Novo informativo (os 3 passos: Básico → Conteúdo → Oração)
- [ ] Informativos antigos (lista aparece, sem itens quebrados)
- [ ] Oração
- [ ] Linha do tempo
- [ ] Métricas (números aparecem, sem travar)
- [ ] O botão "← Menu"/"← Voltar" no topo funciona nos dois sentidos

### 4. Publicar e editar informativo
- [ ] Publicar um informativo de teste completa os 3 passos e salva
- [ ] O informativo novo aparece na aba Notícias do app (visão do parceiro)
- [ ] Clicar em "Editar" nesse informativo mostra o formulário preenchido **dentro da aba Informativos antigos**, sem precisar trocar de aba
- [ ] Salvar a edição funciona e atualiza a lista
- [ ] "Cancelar" a edição limpa o formulário e devolve ele pra aba Novo informativo
- [ ] Apagar o informativo de teste funciona

### 5. Esqueci minha senha
- [ ] O link aparece na tela de login
- [ ] Pedir redefinição com um e-mail cadastrado não dá erro
- [ ] Pedir redefinição com um e-mail que não existe mostra a mesma mensagem (não pode revelar se o e-mail existe ou não)

### 6. Compartilhamento
- [ ] Compartilhar o app (botão na Home) registra em Métricas → Compartilhamentos, com o nome de quem compartilhou
- [ ] Compartilhar um informativo específico também registra, com o nome do informativo

### 7. Console limpo
- [ ] Em nenhum momento dos testes acima aparece `Missing or insufficient permissions`
- [ ] Em nenhum momento aparece `SyntaxError`
- [ ] Erros conhecidos e sem importância (service worker, player de música do YouTube) podem ser ignorados — se não souber se um erro novo é grave, me manda o print

---

## Quando pular o checklist completo

Mudança só de texto, cor, ou reorganização visual sem tocar em função
JavaScript nem em regra do Firebase → checklist rápido já é suficiente.

## Depois de qualquer mudança estrutural

Atualizar o `CONTEXTO.md` se a mudança criou uma coleção nova, uma aba
nova, ou mudou algum fluxo — isso já é hábito combinado, não esquecer.
