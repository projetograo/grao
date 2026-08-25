# Projeto Grão — Documentação técnica

Este documento existe pra você (ou qualquer outra pessoa) entender como o app
funciona por dentro sem precisar reler o arquivo inteiro linha por linha.
Escrito em agosto de 2026, depois da migração de senha em texto/hash pro
Firebase Authentication.

## O que é

Site de apoio missionário da família Baracho ("Projeto Grão"), hospedado
gratuitamente no GitHub Pages: **https://projetograo.github.io/grao/**.
Não confundir com o **Grão Devocional**, que é outro app da família — esse
é feito em Next.js/Supabase e vive num repositório separado.

## Como está publicado

- **Repositório:** github.com/projetograo/grao
- **Hospedagem:** GitHub Pages, publicado automaticamente a cada commit/upload
  na branch principal (via GitHub Actions — aba "Actions" do repositório).
- **Não existe build.** É HTML puro. Editar o arquivo, subir, e o site já
  reflete a mudança em ~1 minuto (às vezes trava por instabilidade do próprio
  GitHub — conferir githubstatus.com se um deploy ficar preso).
- **Se um deploy quebrar algo:** o GitHub guarda todo o histórico de commits.
  Dá pra reverter pro arquivo anterior a qualquer momento pela aba de
  commits/deployments do repositório.

## Estrutura do arquivo

Tudo vive num único `index.html` (HTML + CSS + JavaScript juntos, sem build).
Ele é grande (quase 3000 linhas) — aqui está o mapa de onde fica cada coisa:

| Linhas (aprox.) | O que tem lá |
|---|---|
| 1-330 | `<head>`, CSS de todo o app, sprite de ícones SVG (`<symbol id="i...">`) |
| 340-430 | Tela de login |
| 378-430 | Modal de cadastro ("Quero ter acesso") |
| 434-670 | Telas do app (Início, Família, Notícias, Caminhada, Parceria) |
| 675-900 | Painel admin inteiro (menu + 7 abas) |
| 900-1010 | Modais de contribuição financeira |
| 1010+ | Todo o JavaScript |

Dentro do JavaScript, as funções não seguem uma ordem rígida, mas os blocos
grandes são: autenticação/login (~1097-1240), painel admin
(~1278-2030), textos/tradução (~2233-2360, hoje só português),
renderização das telas públicas (~2360-2520), compartilhamento e
métricas (~2522-2565), contribuições financeiras (~2564-2650),
aprovação de parceiros (~2649-2745), e cadastro/pagamento (~2758-2940).

**Ícones:** o app usa um sprite SVG próprio (não emoji) definido no topo do
arquivo, com símbolos tipo `#ih` (casa), `#in` (notícia), `#imny`
(parceria), etc. Ao adicionar um botão novo, prefira reusar um símbolo
existente ou criar um novo no mesmo estilo (`stroke-width="1.5"`,
`viewBox="0 0 24 24"`) em vez de emoji.

## Autenticação e permissões

- **Firebase Authentication** (e-mail/senha) — projeto `projeto-grao-c3b3d`.
- Cada pessoa tem um documento em `profiles/{uid}` (UID = o mesmo ID da
  conta no Firebase Auth) com os campos: `email`, `nome`, `genero`, `admin`
  (true/false), `status` (`pending` / `approved` / `rejected`).
- **Fluxo de acesso:** alguém se cadastra (`submitRegister`) → perfil criado
  com `status:'pending'` → aparece pro admin em "Solicitações pendentes" →
  admin aprova (`approvePending`) → `status` vira `'approved'` → a pessoa já
  consegue logar.
- **Virar admin:** só é feito manualmente, editando o documento no Firestore
  Console (`admin: true`) — não existe botão no app pra "promover" alguém
  além do que já é admin usar `addAdmin()` (busca por e-mail e liga a flag).
- **Regras do Firestore/Storage** ficam em arquivos separados
  (`firestore.rules`, `storage.rules`) publicados direto no Firebase
  Console — não fazem parte do `index.html`.

## Coleções do Firestore

| Coleção | Quem escreve | Quem lê | Pra que serve |
|---|---|---|---|
| `profiles` | a própria pessoa (cadastro) / admin | dono do doc / admin | conta de cada parceiro |
| `news` | só admin | público | informativos publicados |
| `prayers` | só admin | público | motivos de oração gerais |
| `timeline` | só admin | público | marcos da Caminhada |
| `settings` | só admin | qualquer logado | versículo, música, foto da família (docs `home`, `music`, `appearance`) |
| `metrics` | qualquer logado (exceto admin, filtrado no código) | só admin | contadores de uso |
| `shares` | qualquer logado | só admin | quem compartilhou o quê |
| `parceiros_mensais` | qualquer logado (criação) / admin (edição) | só admin | contribuições financeiras cadastradas |

Coleções antigas **`partners`, `admins`, `pending_partners`** ainda existem
no banco (dados do sistema anterior à migração), mas nada no código as usa
mais, e as regras bloqueiam qualquer acesso a elas. Podem ser apagadas
quando não houver mais necessidade de consultar o histórico.

## O painel admin

Ao abrir (`openAdmin()`), aparece só um menu com 7 botões grandes — nenhum
conteúdo carrega até clicar em um. Cada aba é uma `<div class="adtabsec"
data-tab="...">`, escondida/mostrada via `showAdminTab()`:

- `parceiros` — pedidos pendentes, lista de aprovados, contribuições
- `config` — versículo da home, música, foto da família (era "Configuração geral")
- `novo` — formulário de publicar informativo (3 passos)
- `antigos` — lista de informativos já publicados; **editar um informativo
  faz o formulário de "novo" se mover pra dentro desta aba** via
  `moveNewsFormTo()`, em vez de duplicar o HTML do editor duas vezes
- `oracao` — motivos de oração gerais
- `caminhada` — linha do tempo / itens da Caminhada
- `metricas` — números de uso, compartilhamentos, atalho pro Google Analytics

## Serviços externos (onde gerenciar cada coisa)

| Serviço | Pra quê | Onde configurar |
|---|---|---|
| Firebase Authentication | login | console.firebase.google.com → projeto `projeto-grao-c3b3d` → Authentication |
| Firestore | banco de dados | mesmo console → Firestore Database |
| Firebase Storage | fotos (família, informativos) | mesmo console → Storage |
| EmailJS | e-mails de convite e aviso de informativo | emailjs.com — serviço `service_grao`, template `template_grao_1` (convite) e `template_novo_informativo` (aviso de informativo) |
| Google Analytics | métricas de visita | analytics.google.com — ID salvo no `localStorage` do navegador de quem configurou, não no Firestore (ver "Limitações" abaixo) |
| Stripe | pagamento com cartão | link fixo na constante `STRIPE_LINKS` no código |

## Limitações conhecidas (dívida técnica)

Registrado aqui pra não esquecer, não é uma crítica a ninguém — é só o
estado real do projeto em ago/2026:

1. **Arquivo único, sem separação de HTML/CSS/JS.** Funciona, mas cresce o
   risco de um bug num canto afetar outro sem ninguém perceber na hora.
2. **Sem testes automatizados.** Toda mudança precisa ser testada na mão,
   tela por tela.
3. **Sem ambiente de teste/staging.** O que é publicado no GitHub Pages já
   é visto por qualquer parceiro imediatamente.
4. **Dado duplicado entre `localStorage` e Firestore** (música, versículo,
   ID do Google Analytics, foto da família, listas de notícias/orações)
   — sincronizado manualmente por código espalhado em vários pontos. Já
   funcionou mal uma vez (ID do GA salvo só localmente, não em todo device).
5. **Sem documentação de arquitetura** até este arquivo existir.

## Assuntos em aberto (ago/2026)

- Domínio próprio ainda não comprado (parado na escolha do nome) — resolve
  o problema de e-mails caindo em spam (EmailJS + Firebase Auth mandando de
  `@gmail.com`/domínio genérico, sem SPF/DKIM).
- Reconvite dos parceiros do sistema antigo (pré-migração) — precisa ser
  feito manualmente, um a um, pelo formulário de convite do painel.
- Ticket aberto com o suporte do Firebase: customização do template de
  e-mail de redefinição de senha está bloqueada para este projeto.
