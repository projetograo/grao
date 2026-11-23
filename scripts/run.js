'use strict';
// Rotinas automáticas do Projeto Grão.
//   node run.js poll          -> a cada 15 min: boas-vindas, aviso de informativo, push de novidades
//   node run.js daily         -> 1x por dia: aniversários e pedidos de oração do mês
//   node run.js teste <tipo>  -> manda um exemplo SÓ para o e-mail da organização
//                                (tipos: boas-vindas, informativo, aniversario, oracoes, push)
// Segredos (GitHub → Settings → Secrets): BREVO_API_KEY e FIREBASE_SERVICE_ACCOUNT.

const emails = require('./emails');

const APP_URL = emails.APP_URL;
const SENDER = {
  email: process.env.SENDER_EMAIL || 'nossoprojetograo@gmail.com',
  name: process.env.SENDER_NAME || 'Família Baracho',
};
const TEST_TO = process.env.TEST_TO || SENDER.email;
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

// ── Brevo ────────────────────────────────────────────────────────────────
async function brevoSend({ to, name, subject, html, text }) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY não definida');
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to, name: name || undefined }],
      replyTo: { email: SENDER.email, name: SENDER.name },
      subject, htmlContent: html, textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// ── Firebase ─────────────────────────────────────────────────────────────
function makeContext() {
  const admin = require('firebase-admin');
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  return {
    db: admin.firestore(),
    messaging: admin.messaging(),
    now: () => new Date(),
    sendMail: brevoSend,
    pause: () => sleep(200),
  };
}

// Data de hoje em Maceió (YYYY-MM-DD), independente do relógio do servidor.
function hojeMaceio(now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Maceio', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

async function parceiros(ctx, { incluirAdmin = false } = {}) {
  const snap = await ctx.db.collection('profiles').where('status', '==', 'approved').get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.email && p.emailOptOut !== true && (incluirAdmin || p.admin !== true));
}

async function mandar(ctx, p, tpl) {
  try {
    await ctx.sendMail({ to: p.email, name: p.nome, subject: tpl.subject, html: tpl.html, text: tpl.text });
    return true;
  } catch (e) {
    log(`  falhou para ${p.email}: ${e.message}`);
    return false;
  } finally {
    await ctx.pause();
  }
}

// ── Push ─────────────────────────────────────────────────────────────────
async function pushTodos(ctx, { title, body, url }) {
  const snap = await ctx.db.collection('pushTokens').get();
  const tokens = [...new Set(snap.docs.map((d) => d.id))];
  return pushPara(ctx, tokens, { title, body, url });
}

async function pushPara(ctx, tokens, { title, body, url }) {
  let ok = 0, fail = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    const lote = tokens.slice(i, i + 500);
    const r = await ctx.messaging.sendEachForMulticast({
      tokens: lote,
      data: { title: String(title), body: String(body || ''), url: url || APP_URL },
      webpush: { headers: { Urgency: 'high', TTL: '86400' } },
    });
    r.responses.forEach((resp, idx) => {
      if (resp.success) { ok++; return; }
      fail++;
      const code = resp.error && resp.error.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        ctx.db.collection('pushTokens').doc(lote[idx]).delete().catch(() => {});
      }
    });
  }
  log(`  push: ${ok} enviados, ${fail} falharam (${tokens.length} aparelhos)`);
  return { ok, fail };
}

// ── POLL (a cada 15 min) ────────────────────────────────────────────────
async function pollBoasVindas(ctx) {
  const snap = await ctx.db.collection('profiles').where('welcomePending', '==', true).get();
  for (const d of snap.docs) {
    const p = { id: d.id, ...d.data() };
    if (p.status !== 'approved' || !p.email) { await d.ref.update({ welcomePending: false }); continue; }
    log(`boas-vindas → ${p.email}`);
    const ok = p.emailOptOut === true ? true : await mandar(ctx, p, emails.welcome({ nome: p.nome, genero: p.genero }));
    if (ok) await d.ref.update({ welcomePending: false, welcomeSentAt: ctx.now().toISOString() });
  }
}

async function pollInformativos(ctx) {
  const snap = await ctx.db.collection('news').where('notifyPending', '==', true).get();
  for (const d of snap.docs) {
    const n = d.data();
    const lista = await parceiros(ctx);
    log(`informativo "${n.name}" → ${lista.length} parceiros`);
    let ok = 0, fail = 0;
    for (const p of lista) {
      (await mandar(ctx, p, emails.news({ nome: p.nome, titulo: n.name, resumo: n.summary }))) ? ok++ : fail++;
    }
    await pushTodos(ctx, { title: 'Novo informativo 🌱', body: n.name, url: APP_URL });
    await d.ref.update({
      notifyPending: false, emailSent: true, emailSentAt: ctx.now().toISOString(),
      emailOk: ok, emailFail: fail,
    });
  }
}

async function pollNovidades(ctx) {
  const pr = await ctx.db.collection('prayers').where('pushPending', '==', true).get();
  if (!pr.empty) {
    const titulos = pr.docs.map((d) => d.data().title).filter(Boolean);
    await pushTodos(ctx, {
      title: pr.size === 1 ? 'Novo pedido de oração 🙏' : `${pr.size} novos pedidos de oração 🙏`,
      body: titulos.slice(0, 2).join(' · '),
    });
    for (const d of pr.docs) await d.ref.update({ pushPending: false });
  }
  const tl = await ctx.db.collection('timeline').where('pushPending', '==', true).get();
  if (!tl.empty) {
    const titulos = tl.docs.map((d) => d.data().title).filter(Boolean);
    await pushTodos(ctx, {
      title: tl.size === 1 ? 'A Caminhada avançou' : 'A Caminhada ganhou novidades',
      body: titulos.slice(0, 2).join(' · '),
    });
    for (const d of tl.docs) await d.ref.update({ pushPending: false });
  }
  const an = await ctx.db.collection('announcements').where('pushPending', '==', true).get();
  for (const d of an.docs) {
    const a = d.data();
    await pushTodos(ctx, { title: a.title || 'O Grão foi atualizado', body: a.body || '' });
    await d.ref.update({ pushPending: false, sentAt: ctx.now().toISOString() });
  }
}

async function poll(ctx) {
  await pollBoasVindas(ctx);
  await pollInformativos(ctx);
  await pollNovidades(ctx);
}

// ── DIÁRIO (1x por dia, 8h em Maceió) ───────────────────────────────────
function ehAniversarioHoje(nascimento, hoje) {
  // nascimento "YYYY-MM-DD"; hoje "YYYY-MM-DD"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento || '')) return false;
  const md = nascimento.slice(5), hojeMd = hoje.slice(5);
  if (md === hojeMd) return true;
  // 29/fev em ano não bissexto → comemora em 28/fev
  const ano = Number(hoje.slice(0, 4));
  const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
  return md === '02-29' && hojeMd === '02-28' && !bissexto;
}

async function aniversarios(ctx) {
  const hoje = hojeMaceio(ctx.now());
  const ano = Number(hoje.slice(0, 4));
  const lista = await parceiros(ctx, { incluirAdmin: true });
  for (const p of lista) {
    if (!ehAniversarioHoje(p.nascimento, hoje) || p.birthdayEmailYear === ano) continue;
    log(`aniversário → ${p.email}`);
    if (await mandar(ctx, p, emails.birthday({ nome: p.nome }))) {
      await ctx.db.collection('profiles').doc(p.id).update({ birthdayEmailYear: ano });
    }
  }
}

async function oracoesDoMes(ctx) {
  const hoje = hojeMaceio(ctx.now());
  const mesChave = hoje.slice(0, 7); // YYYY-MM
  const ref = ctx.db.collection('system').doc('state');
  const st = await ref.get();
  const estado = st.exists ? st.data() : {};
  if (!estado.lastMonthlyPrayer) {
    // primeira vez: só marca o mês atual, para não mandar fora de hora. O primeiro envio é no mês seguinte.
    await ref.set({ lastMonthlyPrayer: mesChave }, { merge: true });
    log(`orações do mês: inicializado em ${mesChave}, primeiro envio no próximo mês`);
    return;
  }
  if (estado.lastMonthlyPrayer === mesChave) return;
  const snap = await ctx.db.collection('prayers').get();
  const itens = snap.docs.map((d) => d.data()).filter((p) => p.title);
  const mes = MESES[Number(mesChave.slice(5)) - 1];
  if (itens.length) {
    const lista = await parceiros(ctx);
    log(`orações de ${mes} → ${lista.length} parceiros`);
    for (const p of lista) await mandar(ctx, p, emails.prayers({ nome: p.nome, mes, itens }));
  }
  await ref.set({ lastMonthlyPrayer: mesChave }, { merge: true });
}

async function daily(ctx) {
  await aniversarios(ctx);
  await oracoesDoMes(ctx);
}

// ── TESTE (só para o e-mail da organização) ─────────────────────────────
async function teste(ctx, tipo) {
  const alvo = { email: TEST_TO, nome: 'Bruno', genero: 'M' };
  const exemplos = {
    'boas-vindas': () => emails.welcome({ nome: alvo.nome, genero: 'M' }),
    informativo: () => emails.news({ nome: alvo.nome, titulo: 'Quinto informativo', resumo: 'Exemplo de resumo do informativo, como vai aparecer no e-mail.' }),
    aniversario: () => emails.birthday({ nome: alvo.nome }),
    oracoes: () => emails.prayers({ nome: alvo.nome, mes: MESES[ctx.now().getMonth()], itens: [
      { title: 'Direção clara', body: 'Pela confirmação do campo entre os povos não alcançados.' },
      { title: 'Nossa família', body: 'Pela saúde e pelo cuidado de cada um de nós.' } ] }),
  };
  if (tipo === 'push') {
    const admins = await ctx.db.collection('profiles').where('admin', '==', true).get();
    const uids = admins.docs.map((d) => d.id);
    const tokens = [];
    for (let i = 0; i < uids.length; i += 30) {
      const t = await ctx.db.collection('pushTokens').where('uid', 'in', uids.slice(i, i + 30)).get();
      t.docs.forEach((d) => tokens.push(d.id));
    }
    if (!tokens.length) { log('Nenhum aparelho de admin com notificação ativada.'); return; }
    await pushPara(ctx, tokens, { title: 'Teste do Grão 🔔', body: 'Se você está vendo isto, as notificações funcionam.' });
    return;
  }
  if (!exemplos[tipo]) throw new Error('Tipo de teste desconhecido: ' + tipo);
  const tpl = exemplos[tipo]();
  tpl.subject = '[TESTE] ' + tpl.subject;
  await ctx.sendMail({ to: alvo.email, name: alvo.nome, subject: tpl.subject, html: tpl.html, text: tpl.text });
  log(`E-mail de teste (${tipo}) enviado para ${alvo.email}`);
}

async function main() {
  const [modo, tipo] = process.argv.slice(2);
  const ctx = makeContext();
  if (modo === 'poll') await poll(ctx);
  else if (modo === 'daily') await daily(ctx);
  else if (modo === 'teste') await teste(ctx, tipo);
  else throw new Error('Uso: node run.js poll | daily | teste <tipo>');
}

module.exports = { poll, daily, teste, ehAniversarioHoje, hojeMaceio, aniversarios, oracoesDoMes };

if (require.main === module) {
  main().then(() => process.exit(0)).catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
}
