'use strict';
// Modelos de e-mail do Projeto Grão. Cada função devolve { subject, html, text }.
// Só HTML com estilo "inline" (clientes de e-mail ignoram CSS externo).

const APP_URL = process.env.APP_URL || 'https://projetograo.github.io/grao/';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || 'amigo';

function layout({ preheader, title, bodyHtml, buttonLabel, buttonUrl, interno }) {
  const btn = buttonLabel
    ? `<tr><td align="center" style="padding:8px 32px 28px">
         <a href="${esc(buttonUrl || APP_URL)}" style="display:inline-block;background:#E8A870;color:#4A2E20;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:14px 30px;border-radius:50px">${esc(buttonLabel)}</a>
       </td></tr>` : '';
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F3EAE0">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader || '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3EAE0"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF9;border-radius:18px;overflow:hidden">
    <tr><td align="center" style="background:#4A2E20;padding:30px 24px 26px">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:34px;letter-spacing:3px;color:#FFF6EC">GR<span style="color:#E8A870;font-style:italic">ÃO</span></div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#C9A98C;margin-top:6px">vida compartilhada, pessoa a pessoa</div>
    </td></tr>
    <tr><td style="padding:30px 32px 8px;font-family:Georgia,'Times New Roman',serif;color:#3B2619">
      <div style="font-size:24px;line-height:1.3;margin-bottom:14px">${title}</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#5A4333">${bodyHtml}</div>
    </td></tr>
    ${btn}
    ${interno ? '' : `<tr><td style="padding:0 32px 26px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#3B2619">Com carinho,<br>Bruno, Malu, Tom e Cauê 🌱</td></tr>`}
    <tr><td style="background:#F8F1E9;padding:16px 32px;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:1.6;color:#8C7260;text-align:center">
      ${interno ? 'Aviso interno do painel do Grão. Só a família recebe.' : 'Você recebe este e-mail porque faz parte do Projeto Grão.<br>Não quer mais receber? É só responder com a palavra <b>SAIR</b>.'}
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function welcome({ nome, genero }) {
  const saud = genero === 'F' ? 'Bem-vinda' : 'Bem-vindo';
  const n = esc(firstName(nome));
  const html = layout({
    preheader: 'Sua conta no Grão foi aprovada.',
    title: genero === 'F' || genero === 'M' ? `${saud} ao Grão, ${n}!` : `Que bom ter você no Grão, ${n}!`,
    bodyHtml: `
      <p style="margin:0 0 14px">Sua conta foi aprovada e já está liberada. Que alegria ter você caminhando com a nossa família nesta jornada.</p>
      <p style="margin:0 0 8px"><b>Dois passos para aproveitar melhor o app:</b></p>
      <p style="margin:0 0 8px"><b>1. Coloque o Grão na tela inicial.</b> No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”. No Android: menu ⋮ e “Instalar app”.</p>
      <p style="margin:0 0 14px"><b>2. Ative os avisos.</b> Dentro do app, toque em “Ativar” no cartão de notificações para saber assim que sair um informativo.</p>`,
    buttonLabel: 'Abrir o Grão',
  });
  return {
    subject: `${saud} ao Grão 🌱`,
    html,
    text: `${saud} ao Grão, ${firstName(nome)}! Sua conta foi aprovada. Entre em ${APP_URL}\n\nCom carinho, Bruno, Malu, Tom e Cauê`,
  };
}

function news({ nome, titulo, resumo }) {
  const n = esc(firstName(nome));
  const html = layout({
    preheader: String(resumo || '').slice(0, 110),
    title: 'Saiu um novo informativo',
    bodyHtml: `
      <p style="margin:0 0 14px">Olá, ${n}! Acabamos de publicar um novo informativo no app.</p>
      <div style="background:#F8F1E9;border-left:3px solid #E8A870;border-radius:6px;padding:14px 16px;margin:0 0 6px">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#3B2619;margin-bottom:6px">${esc(titulo)}</div>
        <div style="font-size:14px;line-height:1.6;color:#5A4333">${esc(resumo)}</div>
      </div>`,
    buttonLabel: 'Ler o informativo',
  });
  return {
    subject: `Novo informativo: ${titulo}`,
    html,
    text: `Olá, ${firstName(nome)}! Saiu um novo informativo: ${titulo}\n${resumo}\n\nLeia em ${APP_URL}\n\nCom carinho, Bruno, Malu, Tom e Cauê`,
  };
}

function birthday({ nome }) {
  const n = esc(firstName(nome));
  const html = layout({
    preheader: 'Um abraço da família Baracho no seu dia.',
    title: `Parabéns, ${n}! 🎂`,
    bodyHtml: `
      <p style="margin:0 0 14px">Hoje o dia é seu, e a gente não podia deixar passar. Agradecemos a Deus pela sua vida e por você caminhar com a nossa família.</p>
      <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#3B2619">“O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti, e tenha misericórdia de ti; o Senhor sobre ti levante o seu rosto, e te dê a paz.” <span style="font-style:normal;font-size:13px;color:#8C7260">Números 6.24-26</span></p>
      <p style="margin:0">Que este novo ano de vida seja cheio da graça dele.</p>`,
  });
  return {
    subject: `Parabéns, ${firstName(nome)}! 🎂`,
    html,
    text: `Parabéns, ${firstName(nome)}! Hoje o dia é seu. Agradecemos a Deus pela sua vida.\n\nCom carinho, Bruno, Malu, Tom e Cauê`,
  };
}

function prayers({ nome, mes, itens }) {
  const n = esc(firstName(nome));
  const lista = (itens || []).map((p) => `
      <tr><td style="padding:0 0 12px">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#3B2619;margin-bottom:2px">${esc(p.title)}</div>
        <div style="font-size:14px;line-height:1.6;color:#5A4333">${esc(p.body)}</div>
      </td></tr>`).join('');
  const html = layout({
    preheader: `Pedidos de oração de ${mes}.`,
    title: `Pedidos de oração de ${esc(mes)}`,
    bodyHtml: `
      <p style="margin:0 0 14px">Olá, ${n}! Obrigado por orar por nós. Neste mês, pedimos que você ore conosco por:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px">${lista}</table>
      <p style="margin:6px 0 0">Seguimos juntos, pessoa a pessoa.</p>`,
    buttonLabel: 'Abrir o Grão',
  });
  const txt = (itens || []).map((p) => `- ${p.title}: ${p.body}`).join('\n');
  return {
    subject: `Pedidos de oração de ${mes}`,
    html,
    text: `Olá, ${firstName(nome)}! Pedidos de oração de ${mes}:\n${txt}\n\nCom carinho, Bruno, Malu, Tom e Cauê`,
  };
}

// Aviso interno: aniversários de parceiros de perto (e da família deles) para a família ligar ou mandar um presente.
// itens: [{ quando: 'hoje'|'em 7 dias', quem, rel, idade, parceiro: {...ficha} }]
function familyBirthdays({ itens }) {
  const bloco = (it) => {
    const p = it.parceiro || {};
    const linhas = [];
    if (p.phone) linhas.push(`📞 ${esc(p.phone)}`);
    if (p.email) linhas.push(`✉️ ${esc(p.email)}`);
    if (p.endereco || p.cidade) linhas.push(`📍 ${esc([p.endereco, p.cidade].filter(Boolean).join(' · '))}`);
    if (p.valor) linhas.push(`💛 Contribui: ${esc(p.valor)}`);
    if (p.oracao) linhas.push(`🙏 ${esc(p.oracao)}`);
    if (p.notas) linhas.push(`📝 ${esc(p.notas)}`);
    return `<div style="background:#F8F1E9;border-left:3px solid #E8A870;border-radius:6px;padding:14px 16px;margin:0 0 12px">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#B7763A;margin-bottom:4px">${esc(it.quando)}</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#3B2619">${esc(it.quem)}${it.idade ? ` faz ${esc(it.idade)} ${it.idade === 1 ? 'ano' : 'anos'}` : ''}</div>
      ${it.rel ? `<div style="font-size:13px;color:#8C7260;margin:2px 0 8px">${esc(it.rel)}</div>` : '<div style="height:8px"></div>'}
      <div style="font-size:14px;line-height:1.7;color:#5A4333;white-space:pre-wrap">${linhas.join('<br>')}</div>
    </div>`;
  };
  const hoje = itens.filter((i) => i.quando === 'hoje');
  const nomes = itens.map((i) => i.quem).join(', ');
  const html = layout({
    preheader: nomes,
    title: hoje.length ? 'Aniversário hoje 🎂' : 'Aniversário chegando 🎂',
    bodyHtml: `<p style="margin:0 0 14px">${hoje.length ? 'Uma boa hora para ligar, mandar uma mensagem ou um presente.' : 'Dá tempo de preparar um carinho.'}</p>${itens.map(bloco).join('')}`,
    buttonLabel: 'Abrir o painel',
    interno: true,
  });
  const subj = hoje.length
    ? `🎂 Hoje: ${hoje.map((i) => i.quem).join(', ')}`
    : `🎂 Em 7 dias: ${itens.map((i) => i.quem).join(', ')}`;
  const text = itens.map((i) => `${i.quando}: ${i.quem}${i.rel ? ' (' + i.rel + ')' : ''}${i.parceiro && i.parceiro.phone ? ' - ' + i.parceiro.phone : ''}`).join('\n');
  return { subject: subj, html, text };
}

// Resumo semanal para a família: quem cuidar, aniversários, boas-vindas e inscrições esperando.
function weeklyCare({ cuidar, aniversarios, boasVindas, pendentes }) {
  const sec = (titulo, linhas) => linhas.length ? `<div style="margin:0 0 18px"><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#B7763A;margin-bottom:8px">${esc(titulo)}</div>${linhas.map((l) => `<div style="background:#F8F1E9;border-left:3px solid #E8A870;border-radius:6px;padding:10px 14px;margin:0 0 8px;font-size:14px;line-height:1.6;color:#3B2619">${l}</div>`).join('')}</div>` : '';
  const html = layout({
    preheader: 'Quem cuidar nesta semana',
    title: 'Semana de cuidado 🌱',
    bodyHtml: `<p style="margin:0 0 16px">Sem pressa: uma conversa de cada vez, do jeito de vocês.</p>`
      + sec('Para conversar', cuidar.map((c) => `<b>${esc(c.nome)}</b> · ${esc(c.quando)}${c.phone ? ' · ' + esc(c.phone) : ''}${c.nota ? `<br><span style="color:#8C7260">Última conversa: ${esc(c.nota)}</span>` : ''}`))
      + sec('Aniversários dos próximos dias', aniversarios.map((a) => `<b>${esc(a.quem)}</b> · ${esc(a.quando)}${a.rel ? ' · ' + esc(a.rel) : ''}`))
      + sec('Boas-vindas no WhatsApp esperando', boasVindas.map((b) => `<b>${esc(b.nome)}</b>${b.phone ? ' · ' + esc(b.phone) : ''}`))
      + sec('Inscrições para aceitar', pendentes.map((p) => `<b>${esc(p.nome)}</b>${p.cidade ? ' · ' + esc(p.cidade) : ''}`)),
    buttonLabel: 'Abrir o painel',
    interno: true,
  });
  const total = cuidar.length + aniversarios.length + boasVindas.length + pendentes.length;
  return { subject: `🌱 Semana de cuidado: ${total} ${total === 1 ? 'coisa' : 'coisas'}`, html, text: `Para conversar: ${cuidar.map((c) => c.nome).join(', ') || '—'}` };
}

module.exports = { welcome, news, birthday, prayers, familyBirthdays, weeklyCare, firstName, esc, APP_URL };
