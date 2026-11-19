// ===== Tema 8 · Els cinc regnes — lògica de la web =====
(function () {
  'use strict';
  const D = window.DADES;
  const T = 't8:';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const get = (k, d) => store.get(T + k, d);
  const set = (k, v) => store.set(T + k, v);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Bossa sense repetició: no torna a sortir cap element fins que han sortit tots (es desa per joc)
  function drawBag(key, all, n, id) {
    const ids = all.map(id), bags = get('bag', {});
    let bag = (bags[key] || []).filter(x => ids.includes(x));
    const out = [];
    while (out.length < Math.min(n, ids.length)) {
      if (!bag.length) bag = shuffle(ids.filter(x => !out.includes(x)));
      if (!bag.length) break;
      out.push(bag.shift());
    }
    bags[key] = bag; set('bag', bags);
    return shuffle(out).map(x => all[ids.indexOf(x)]);
  }
  // ---------- Rànquing: punts per encert, rapidesa i ratxa ----------
  const GAME_NAMES = { 'test-mc': 'Test', 'test-tf': 'Vertader o fals', 'classifica': 'Classifica', 'cell-find': 'Troba la part', 'cell-name': 'Com es diu?', 'cell-which': 'Quina cèl·lula la té?' };
  const newRun = () => ({ pts: 0, streak: 0, t0: Date.now() });
  function runHit(r) { const s = (Date.now() - r.t0) / 1000; r.streak++; r.pts += 100 + Math.max(0, Math.round(50 * (1 - s / 10))) + 10 * (r.streak - 1); }
  function runMiss(r) { r.streak = 0; }
  // Medalla segons l'encert (%): or ≥ 90, plata ≥ 70, bronze ≥ 50
  function medalHTML(acc, tag) {
    const m = acc >= 90 ? ['Or', 'or'] : acc >= 70 ? ['Plata', 'plata'] : acc >= 50 ? ['Bronze', 'bronze'] : null;
    return m ? `<div class="medal ${m[1]}" aria-label="Medalla ${m[0]}">${m[0]}</div>` : `<${tag} class="no-medal">Continua practicant!</${tag}>`;
  }
  function rankBlock(game, run, ok, n) {
    const all = get('rank', {}), list = all[game] || [];
    const acc = n > 0 ? Math.round(100 * ok / n) : 0;
    const prevBest = list.length ? Math.round(+list[0].p) || 0 : 0;
    const isRecord = list.length === 0 || run.pts > prevBest;
    let comp = '';
    if (isRecord && list.length > 0) { comp = 'Nou rècord personal! +' + (run.pts - prevBest) + ' punts'; }
    else if (isRecord && list.length === 0) { comp = 'Primera partida!'; }
    else { comp = 'Et falten ' + (prevBest - run.pts) + ' punts per al teu rècord (' + prevBest + ')'; }
    const entry = { p: run.pts, ok, n, d: new Date().toLocaleDateString('ca') };
    list.push(entry); list.sort((a, b) => b.p - a.p); all[game] = list.slice(0, 10); set('rank', all);
    const top5 = list.slice(0, 5);
    const topGames = top5.map((e, i) => {
      const isMe = e === entry ? 'me' : '';
      return `<li class="${isMe}"><span class="rk">${i + 1}</span><span class="rp">${Math.round(+e.p) || 0} pts</span><span class="rd">${Math.round(+e.ok) || 0}/${Math.round(+e.n) || 0} · ${esc(String(e.d))}</span></li>`;
    }).join('');
    const medalHtml = n > 0 ? medalHTML(acc, 'p') : '';
    return `<div class="rank-box"><p class="rank-pts">${run.pts}</p>${medalHtml}<p class="rank-comp">${comp}</p><ol class="rank top-games">${topGames}</ol></div>`;
  }
  function rankingSection() {
    return `<h2 class="section-title">Els teus rècords</h2><p class="muted">Juga contra tu mateixa: guanya medalles i supera els teus rècords. Punts: 100 per encert + fins a 50 per rapidesa + 10 per cada encert seguit.</p><div class="personal-bests">${Object.keys(GAME_NAMES).map(g => bestCard(g)).join('')}</div>`;
  }
  function bestCard(g) {
    const list = get('rank', {})[g] || [];
    if (!list.length) return `<div class="card best-card is-empty"><h3>${GAME_NAMES[g]}</h3><p class="muted">Encara no hi has jugat.</p></div>`;
    const best = list[0], pts = Math.round(+best.p) || 0, acc = best.n > 0 ? Math.round(100 * best.ok / best.n) : 0;
    const m = medalHTML(acc, 'span');
    return `<div class="card best-card"><h3>${GAME_NAMES[g]}</h3><p class="best-score">${pts} pts</p>${m}<p class="best-count">${list.length} partides</p></div>`;
  }
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const kc = c => (D.capitols[c] || D.capitols[0]).kc;

  // ================= PARSER DEL MANUAL =================
  const TAGS = { 'CLASSIFICACIÓ CLÀSSICA': ['clas', 'Classificació clàssica'], 'VISIÓ ACTUAL': ['act', 'Visió actual'], 'PRECISIÓ': ['pre', 'Precisió'] };
  function inline(s) {
    s = esc(s);
    s = s.replace(/\*\*\[(CLASSIFICACIÓ CLÀSSICA|VISIÓ ACTUAL|PRECISIÓ)\]\*\*|\[(CLASSIFICACIÓ CLÀSSICA|VISIÓ ACTUAL|PRECISIÓ)\]/g,
      (m, a, b) => { const t = TAGS[a || b]; return `<span class="badge b-${t[0]}">${t[1]}</span>`; });
    s = s.replace(/\[((?:F\d+a?|L\d)(?:,\s*(?:F\d+a?|L\d))*)\]/g, '<span class="ref" title="Font del manual (capítol 8)">[$1]</span>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/(https?:\/\/[^\s<)]+[^\s<).,])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return s;
  }
  const splitRow = r => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  function tableHTML(rows) {
    const head = splitRow(rows[0]);
    const body = rows.slice(2).map(splitRow);
    // data-label: nom de la columna, perquè al mòbil cada fila es pugui mostrar com una targeta
    const label = h => esc(h.replace(/[*`]/g, ''));
    return `<div class="table-wrap"><table class="study-table" role="table"><thead role="rowgroup"><tr role="row">${head.map(h => `<th scope="col" role="columnheader">${inline(h)}</th>`).join('')}</tr></thead><tbody role="rowgroup">${body.map(r => `<tr role="row">${r.map((c, i) => `<td role="cell" data-label="${label(head[i] || '')}">${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function blocks(lines) {
    let html = '', i = 0;
    const special = /^(#{1,4}\s|\||- |\d+\.\s|>\s|<!--)/;
    while (i < lines.length) {
      const l = lines[i], tr = l.trim();
      if (!tr || tr.startsWith('<!--') || /^---\s*$/.test(tr)) { i++; continue; }
      let m;
      if ((m = l.match(/^(#{3,4})\s+(.*)/))) { const n = m[1].length; html += `<h${n}>${inline(m[2])}</h${n}>`; i++; continue; }
      if (l.startsWith('|')) { const rows = []; while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]); html += tableHTML(rows); continue; }
      if (/^- /.test(l)) { html += '<ul>'; while (i < lines.length && /^- /.test(lines[i])) html += `<li>${inline(lines[i++].slice(2))}</li>`; html += '</ul>'; continue; }
      if (/^\d+\.\s/.test(l)) { html += '<ol>'; while (i < lines.length && /^\d+\.\s/.test(lines[i])) html += `<li>${inline(lines[i++].replace(/^\d+\.\s/, ''))}</li>`; html += '</ol>'; continue; }
      if (/^>\s/.test(l)) { const q = []; while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, '')); html += `<blockquote>${inline(q.join(' '))}</blockquote>`; continue; }
      const p = [];
      while (i < lines.length && lines[i].trim() && !special.test(lines[i])) p.push(lines[i++]);
      if (!p.length) { i++; continue; }
      const txt = p.join(' ');
      const cls = [/\[CLASSIFICACIÓ CLÀSSICA\]/.test(txt) && 'has-clas', /\[VISIÓ ACTUAL\]/.test(txt) && 'has-act', /\[PRECISIÓ\]/.test(txt) && 'has-pre'].filter(Boolean)[0];
      html += `<p${cls ? ` class="${cls}"` : ''}>${inline(txt)}</p>`;
    }
    return html;
  }
  function parseManual(md) {
    md = md.replace(/^---\n[\s\S]*?\n---\n/, '');
    const chapters = [];
    let cur = null, sec = null;
    for (const l of md.split('\n')) {
      let m;
      if ((m = l.match(/^# (\d+)\. (.*)/))) { cur = { num: +m[1], title: m[2], intro: [], sections: [] }; chapters.push(cur); sec = null; continue; }
      if (/^# /.test(l)) { cur = null; continue; }
      if (!cur) continue;
      if ((m = l.match(/^## (\d+\.\d+)\. (.*)/))) { sec = { num: m[1], id: 's' + m[1].replace('.', '-'), title: m[2], lines: [] }; cur.sections.push(sec); continue; }
      (sec ? sec.lines : cur.intro).push(l);
    }
    return chapters;
  }

  const ALL = parseManual(window.MANUAL_MD || '');
  const CH = ALL.filter(c => c.num !== 7 && c.num !== 9);
  const chap = n => CH.find(c => c.num === n);
  const secById = {};
  CH.forEach(c => c.sections.forEach(s => { secById[s.num] = { c: c.num, s }; }));
  const totalSecs = CH.filter(c => c.num !== 8).reduce((a, c) => a + c.sections.length, 0);
  set('total', totalSecs);

  // Glossari
  const glossCh = ALL.find(c => c.num === 7);
  const GLOSS = (glossCh ? glossCh.intro : []).map(l => l.match(/^- \*\*(.+?):\*\*\s*(.*)$/)).filter(Boolean)
    .map(m => ({ term: m[1], def: m[2], plain: m[2].replace(/\*/g, '') }));
  const chText = {};
  CH.filter(c => c.num <= 6).forEach(c => { chText[c.num] = norm(c.intro.join(' ') + ' ' + c.sections.map(s => s.title + ' ' + s.lines.join(' ')).join(' ')); });
  GLOSS.forEach(g => {
    let key = norm(g.term.replace(/\s*\(.*?\)/g, '')).trim();
    if (key.length > 6) key = key.slice(0, -1);
    g.where = [];
    for (const n in chText) {
      const cnt = chText[n].split(key).length - 1;
      if (cnt) g.where.push({ c: +n, cnt });
    }
    g.where.sort((a, b) => b.cnt - a.cnt);
    g.main = g.where.length ? g.where[0].c : null;
  });

  // Glossari dins la teoria: patró amb tots els termes (4+ lletres), sense distingir majúscules,
  // acceptant plurals simples (hifa → hifes, cèl·lula → cèl·lules, estoma → estomes, gen → gens)
  const GL_BY = new Map(); // forma en minúscules → entrada del glossari
  const GL_PAT = (() => {
    const forms = [];
    GLOSS.forEach(g => {
      const base = g.term.replace(/\s*\(.*?\)/g, '').trim();
      if (base.replace(/[^\p{L}]/gu, '').length < 4) return;
      const low = base.toLowerCase();
      const variants = [low, low + 's', low + 'es'];
      if (low.endsWith('a')) variants.push(low.slice(0, -1) + 'es');
      variants.forEach(v => { if (!GL_BY.has(v)) { GL_BY.set(v, g); forms.push(v); } });
    });
    forms.sort((a, b) => b.length - a.length);
    const esc = v => v.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');
    return new RegExp('(?<![\\p{L}·])(' + forms.map(esc).join('|') + ')(?![\\p{L}·])', 'giu');
  })();

  const secLink = s => {
    const x = secById[s];
    return x ? `<a href="#teoria/${x.c}/${x.s.id}">Veure a la teoria §${s}</a>` : `§${s}`;
  };

  // ================= NAVEGACIÓ =================
  const VIEWS = ['teoria', 'cellula', 'comparar', 'targetes', 'test', 'classifica', 'glossari', 'progres'];
  const inited = {};
  let pendingQuiz = null; // test d'un capítol demanat des de la teoria
  function route() {
    const parts = (location.hash.slice(1) || 'teoria').split('/');
    const v = VIEWS.includes(parts[0]) ? parts[0] : 'teoria';
    stopSpeak();
    $$('.tab').forEach(t => t.dataset.view === v ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current'));
    // Si la vista activa està al menú «Més», marca també el botó
    const MES = ['comparar', 'classifica', 'glossari', 'progres'];
    const bn = $('.bn-more');
    if (bn) { MES.includes(v) ? bn.setAttribute('aria-current', 'page') : bn.removeAttribute('aria-current'); }
    document.title = (v === 'teoria' ? 'Teoria' : $(`.tab[data-view="${v}"]`).textContent.trim()) + ' · Els cinc regnes';
    VIEWS.forEach(n => { $('#v-' + n).hidden = n !== v; });
    // Tanca el popover del glossari en canviar de vista
    const glpop = $('#gl-pop'); if (glpop) glpop.hidden = true;
    if (v !== 'cellula' && inited.cellula) cellGameExit();
    if (!inited[v]) { inited[v] = true; INIT[v](); } else if (v === 'progres') renderProgres();
    // Si arriba hi ha pendingQuiz, saltem la configuració i comencem el quiz
    if (v === 'test' && pendingQuiz) {
      const opt = { mode: pendingQuiz.mode, ch: pendingQuiz.ch, n: 999 };
      const pool = drawBag('q:' + opt.mode + ':' + opt.ch, SRC[opt.mode]().filter(q => opt.ch === 'tots' || q.c === +opt.ch), opt.n, q => q.q || q.t);
      startQuiz(opt, pool, false);
      pendingQuiz = null;
    }
    // Sense capítol a l'URL: torna exactament on ho vas deixar (capítol + apartat)
    if (v === 'teoria') parts[1] != null ? showChapter(+parts[1], parts[2]) : showChapter(get('lastCh', 0), resumeSec(), true);
    else window.scrollTo(0, 0);
  }
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    const v = t.dataset.view;
    location.hash = v === 'teoria' ? 'teoria' : v;
  }));
  // Delegació: botons «Posa't a prova» dins del capítol
  $('#chapter').addEventListener('click', e => {
    const b = e.target.closest('[data-quiz]'); if (!b) return;
    pendingQuiz = { mode: b.dataset.quiz, ch: +b.dataset.ch };
    location.hash = 'test';
  });
  // Delegació: botons «Practica el test» dels punts febles (pestanya Progrés)
  $('#v-progres').addEventListener('click', e => {
    const b = e.target.closest('[data-quiz]'); if (!b) return;
    pendingQuiz = { mode: b.dataset.quiz, ch: +b.dataset.ch };
    location.hash = 'test';
  });
  window.addEventListener('hashchange', route);

  // ================= BOTTOM NAV «Més» =================
  const bnMore = $('.bn-more');
  const bnMenu = $('#bn-menu');
  if (bnMore && bnMenu) {
    // Obrir/tancar amb el botó
    bnMore.addEventListener('click', () => {
      const open = !bnMenu.hidden;
      open ? bnMenu.hidden = true : bnMenu.hidden = false;
      bnMore.setAttribute('aria-expanded', String(!open));
    });
    // Tancar en prémer Esc
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !bnMenu.hidden) { bnMenu.hidden = true; bnMore.setAttribute('aria-expanded', 'false'); bnMore.focus(); }
    });
    // Tancar en tocar fora
    document.addEventListener('click', (e) => {
      if (!bnMenu.hidden && !bnMenu.contains(e.target) && !bnMore.contains(e.target)) {
        bnMenu.hidden = true;
        bnMore.setAttribute('aria-expanded', 'false');
      }
    });
    // Tancar en triar una opció del menú
    $$('.tab', bnMenu).forEach(t => t.addEventListener('click', () => {
      bnMenu.hidden = true;
      bnMore.setAttribute('aria-expanded', 'false');
    }));
  }

  // ================= TEORIA =================
  let curCh = null;
  function chProgress(c) {
    const done = new Set(get('done', []));
    const n = c.sections.filter(s => done.has(s.id)).length;
    return c.sections.length ? Math.round(n / c.sections.length * 100) : 0;
  }
  function renderToc() {
    const c8 = CH.find(c => c.num === 8);
    const others = CH.filter(c => c.num !== 8);
    $('#toc').innerHTML = others.map(c => `<button class="toc-item" type="button" data-ch="${c.num}" style="--kc:${kc(c.num)}"${c.num === curCh ? ' aria-current="true"' : ''}>
      <span class="n">${c.num}</span><span class="t">${(D.capitols[c.num] || {}).curt || c.title}<br><span class="p">${chProgress(c)}% estudiat</span></span></button>`).join('') +
      (c8 ? `<hr class="toc-sep"><button class="toc-item ref-item" type="button" data-ch="8"${curCh === 8 ? ' aria-current="true"' : ''}>
      <span class="n">${ICON('book')}</span><span class="t">Fonts consultades</span></button>` : '');
    $('#toc-select').innerHTML = CH.map(c => `<option value="${c.num}"${c.num === curCh ? ' selected' : ''}>${c.num === 8 ? 'Fonts consultades' : c.num + '. ' + c.title + ' (' + chProgress(c) + '%)'}</option>`).join('');
  }
  // ================= BUSCADOR TEORIA =================
  const TEORIA_IDX = [];
  (function buildTeoriaIdx() {
    CH.forEach(c => {
      c.sections.forEach(s => {
        const text = s.title + ' ' + s.lines.join(' ');
        const cleaned = text.replace(/[*|#|\[\]]/g, ' ').replace(/\s+/g, ' ');
        TEORIA_IDX.push({ c: c.num, id: s.id, num: s.num, title: s.title.replace(/\*/g, ""), text: cleaned, ntext: norm(cleaned) });
      });
    });
  })();

  function doSearch(q) {
    const nq = norm(q);
    if (nq.length < 2) { $('#t-results').innerHTML = ''; return; }
    const results = [];
    for (const item of TEORIA_IDX) {
      const idx = item.ntext.indexOf(nq);
      if (idx !== -1) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(item.text.length, idx + nq.length + 60);
        let snippet = item.text.slice(start, end);
        if (start > 0) snippet = '…' + snippet;
        if (end < item.text.length) snippet = snippet + '…';
        const marked = esc(snippet).replace(new RegExp(esc(nq.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')), 'gi'), m => '<mark>' + m + '</mark>');
        results.push({ item, snippet: marked });
        if (results.length >= 20) break;
      }
    }
    const box = $('#t-results');
    if (results.length === 0) {
      box.innerHTML = `<p class="t-no-results">Cap resultat per a «${esc(q)}»</p>`;
    } else {
      box.innerHTML = results.map(r => {
        const href = `#teoria/${r.item.c}/${r.item.id}`;
        return `<a class="t-result" href="${href}"><span class="t-title">§${esc(r.item.num)} ${esc(r.item.title)}</span><span class="t-snippet">${r.snippet}</span></a>`;
      }).join('');
      box.querySelector('.t-results') || null;
      box.addEventListener('click', e => {
        const a = e.target.closest('.t-result');
        if (a) { $('#t-search').value = ''; box.innerHTML = ''; }
      });
    }
  }

  function initTeoria() {
    const box = $('#t-results');
    const input = $('#t-search');
    let timer = null;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => doSearch(input.value.trim()), 150); });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') { input.value = ''; box.innerHTML = ''; } });
    $('#toc').addEventListener('click', e => { const b = e.target.closest('.toc-item'); if (b) location.hash = `teoria/${b.dataset.ch}`; });
    $('#chapter').addEventListener('keydown', cellKeys);
    $('#toc-select').addEventListener('change', e => { location.hash = `teoria/${e.target.value}`; });
    $('#chapter').addEventListener('click', e => {
      const b = e.target.closest('.done-toggle');
      if (b) {
        const done = new Set(get('done', []));
        const on = !done.has(b.dataset.id);
        on ? done.add(b.dataset.id) : done.delete(b.dataset.id);
        set('done', [...done]);
        b.setAttribute('aria-pressed', String(on));
        b.innerHTML = on ? ICON('tick') + ' Ho tinc' : 'Ho tinc?';
        b.closest('.sec').classList.toggle('done', on);
        renderToc();
        return;
      }
      const r = e.target.closest('.repas');
      if (r) { const on = !$('#chapter').classList.contains('hide-mode'); setHideMode($('#chapter'), on); r.setAttribute('aria-pressed', String(on)); return; }
      revealCell(e);
    });

    // Popover de definició (un de sol per a tota la pàgina)
    const pop = document.createElement('div');
    pop.id = 'gl-pop'; pop.className = 'gl-pop';
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Definició'); pop.tabIndex = -1;
    pop.hidden = true;
    document.body.appendChild(pop);
    let opener = null;
    function showPop(btn) {
      const g = GL_BY.get(btn.dataset.key); if (!g) return;
      opener = btn;
      pop.innerHTML = '<div class="gl-pop-head"><strong>' + esc(g.term) + '</strong><button type="button" class="gl-pop-close" aria-label="Tanca">' + ICON('x') + '</button></div><div class="gl-pop-body">' + inline(g.def) + '</div>';
      pop.hidden = false;
      // Posició absoluta a la pàgina, sota la paraula i sense sortir de la pantalla
      const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
      const left = Math.min(Math.max(12, r.left), window.innerWidth - w - 12);
      let top = r.bottom + 6;
      if (top + h > window.innerHeight - 12 && r.top - h - 6 > 70) top = r.top - h - 6;
      pop.style.left = (left + window.scrollX) + 'px';
      pop.style.top = (top + window.scrollY) + 'px';
      pop.style.transform = 'none';
      pop.focus({ preventScroll: true });
    }
    function hidePop(back) { if (pop.hidden) return; pop.hidden = true; if (back && opener) opener.focus(); opener = null; }
    pop.addEventListener('click', e => { if (e.target.closest('.gl-pop-close')) hidePop(true); });
    $('#chapter').addEventListener('click', e => {
      const gl = e.target.closest('.gl'); if (!gl) return;
      e.stopPropagation();
      if (opener === gl && !pop.hidden) hidePop(false); else showPop(gl);
    });
    document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.gl')) hidePop(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hidePop(true); });
  }
  // Marca la primera aparició de cada terme del glossari a cada apartat
  function markGlossary(box) {
    $$('.sec', box).forEach(sec => {
      const seen = new Set(), nodes = [];
      const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, { acceptNode: n =>
        n.parentElement.closest('a, button, code, th, td, h2, h3, h4, mark, .badge, .ref, .gl, .sec-head') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      while (walker.nextNode()) nodes.push(walker.currentNode); // primer es recullen, després es modifiquen
      nodes.forEach(node => {
        const txt = node.textContent; let last = 0, frag = null;
        for (const m of txt.matchAll(GL_PAT)) {
          const key = m[1].toLowerCase(), g = GL_BY.get(key);
          if (!g || seen.has(g.term)) continue;
          seen.add(g.term);
          frag = frag || document.createDocumentFragment();
          frag.append(txt.slice(last, m.index));
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'gl'; b.dataset.key = key; b.textContent = m[1];
          b.setAttribute('aria-haspopup', 'dialog');
          frag.append(b);
          last = m.index + m[1].length;
        }
        if (frag) { frag.append(txt.slice(last)); node.replaceWith(frag); }
      });
    });
  }
  function revealCell(e) {
    const td = e.target.closest('.hide-mode .study-table td');
    if (td && td.cellIndex > 0) { td.classList.toggle('shown'); td.setAttribute('aria-label', td.classList.contains('shown') ? td.textContent : 'Resposta amagada. Prem Retorn per veure-la'); }
  }
  // Activa/desactiva el mode repàs: les cel·les amagades es poden obrir també amb teclat
  function setHideMode(box, on) {
    box.classList.toggle('hide-mode', on);
    $$('.study-table td', box).forEach(td => {
      if (td.cellIndex === 0) return;
      td.classList.remove('shown');
      if (on) { td.tabIndex = 0; td.setAttribute('role', 'button'); td.setAttribute('aria-label', 'Resposta amagada. Prem Retorn per veure-la'); }
      else { td.removeAttribute('tabindex'); td.removeAttribute('role'); td.removeAttribute('aria-label'); }
    });
  }
  function cellKeys(e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.hide-mode .study-table td[tabindex]')) { e.preventDefault(); revealCell(e); } }
  // Últim apartat llegit (només si és del darrer capítol obert)
  function resumeSec() { const sec = get('lastSec', null), ch = get('lastCh', 0); return sec && sec.startsWith('s' + ch + '-') ? sec : null; }
  let secObserver = null;
  function trackReading() {
    if (secObserver) secObserver.disconnect();
    if (!('IntersectionObserver' in window)) return;
    // L'apartat que travessa la franja superior de la pantalla és el que s'està llegint
    secObserver = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) set('lastSec', en.target.id); });
    }, { rootMargin: '-140px 0px -65% 0px' });
    $$('#chapter .sec').forEach(sec => secObserver.observe(sec));
  }
  function showChapter(n, secId, resuming) {
    const c = chap(n) || CH[0];
    const isRef = c.num === 8;
    const isQuizCh = c.num >= 0 && c.num <= 6;
    curCh = c.num; if (!isRef) set('lastCh', c.num);
    renderToc();
    const done = new Set(get('done', []));
    const i = CH.indexOf(c), prev = CH[i - 1], next = CH[i + 1];
    const box = $('#chapter');
    box.classList.remove('hide-mode');
    box.style.setProperty('--kc', kc(c.num));
    const mcN = isQuizCh ? D.preguntes.filter(q => q.c === c.num).length : 0;
    const tfN = isQuizCh ? D.mites.filter(q => q.c === c.num).length : 0;
    const quizCard = isQuizCh ? `<div class="card quiz-card">
      <h2>${ICON('check')} Posa't a prova</h2>
      <p>Comprova si has entès aquest capítol: preguntes tipus test i afirmacions de vertader o fals.</p>
      <div class="quiz-btns">
        ${mcN ? `<button class="btn primary" type="button" data-quiz="mc" data-ch="${c.num}">Test del capítol (${mcN})</button>` : ''}
        ${tfN ? `<button class="btn" type="button" data-quiz="tf" data-ch="${c.num}">Mites del capítol (${tfN})</button>` : ''}
      </div>
    </div>` : '';
    box.innerHTML = `
      <header class="chapter-head"><div class="kicker">${isRef ? 'Referències' : 'Capítol ' + c.num}</div><h1>${isRef ? 'Fonts consultades' : inline(c.title)}</h1></header>
      ${!isRef && D.idees[c.num] ? `<div class="card keyideas"><h2>${ICON('bulb')} Idees clau</h2><ul>${D.idees[c.num].map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
      ${!isRef ? `<div class="tools">
        <button class="chip repas" type="button" aria-pressed="false">${ICON('eyeoff')} Mode repàs de taules</button>
        <button class="chip" type="button" id="btn-print">${ICON('printer')} Resum per imprimir</button>
        <details class="legend-box"><summary>Què volen dir els colors?</summary><ul class="legend-list"><li><span class="badge b-clas">Classificació clàssica</span> Com ho expliquen els apunts (model tradicional).</li><li><span class="badge b-act">Visió actual</span> Com ho entén la ciència avui.</li><li><span class="badge b-pre">Precisió</span> Error freqüent o matís important.</li></ul></details>
      </div>` : ''}
      ${!isRef && c.intro.some(l => l.trim() && !l.startsWith('<!--')) ? `<div class="prose">${blocks(c.intro)}</div>` : ''}
      ${isRef ? `<div class="prose"><p>Aquest capítol és un recurs de consulta. Les seccions següents recullen les fonts bibliogràfiques i recursos utilitzats al llarg del tema. No cal marcar-les com a estudiades.</p></div>` : ''}
      ${c.sections.map(s => `<section class="card sec${isRef ? ' ref-sec' : (done.has(s.id) ? ' done' : '')}" id="${s.id}">
        <div class="sec-head"><h2><span class="secnum">${s.num}</span> ${inline(s.title)}</h2>
        ${isRef ? '' : `<div class="sec-actions"><button class="chip listen" type="button" aria-pressed="false">${ICON('play')}<span class="t">Escolta</span></button><button class="done-toggle" type="button" data-id="${s.id}" aria-pressed="${done.has(s.id)}">${done.has(s.id) ? ICON('tick') + ' Ho tinc' : 'Ho tinc?'}</button></div>`}</div>
        <div class="prose">${blocks(s.lines)}</div></section>`).join('')}
      ${quizCard}
      <nav class="chapter-nav">
        ${prev ? `<a class="btn" href="#teoria/${prev.num}">← ${prev.num}. ${(D.capitols[prev.num] || {}).curt}</a>` : '<span></span>'}
        ${next ? `<a class="btn primary" href="#teoria/${next.num}">${next.num}. ${(D.capitols[next.num] || {}).curt} →</a>` : ''}
      </nav>`;
    if (!isRef) markGlossary(box);

    const target = secId && document.getElementById(secId);
    if (target) {
      target.scrollIntoView();
      if (resuming && target !== $('#chapter .sec')) {
        target.classList.add('resume');
        const sn = target.id.slice(1).replace('-', '.');
        target.insertAdjacentHTML('afterbegin', `<p class="resume-note" role="status">${ICON('pin')} Continues on ho vas deixar: apartat ${sn}</p>`);
        setTimeout(() => target.classList.remove('resume'), 2500);
      }
    } else window.scrollTo(0, 0);
    if (!isRef) trackReading();
  }

  // ================= ESCOLTA (lectura en veu alta) =================
  // Només apareix si el dispositiu té una veu en català
  const TTS = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let caVoice = null, speakBtn = null;
  function pickVoice() {
    if (!TTS) return;
    caVoice = TTS.getVoices().find(v => /^ca([-_]|$)/i.test(v.lang)) || null;
    document.body.classList.toggle('tts-ok', !!caVoice);
  }
  if (TTS) { pickVoice(); TTS.addEventListener('voiceschanged', pickVoice); }
  function stopSpeak() {
    if (TTS) TTS.cancel();
    if (speakBtn) { speakBtn.setAttribute('aria-pressed', 'false'); speakBtn.querySelector('.t').textContent = 'Escolta'; }
    speakBtn = null;
  }
  function speak(btn) {
    if (speakBtn === btn) { stopSpeak(); return; }
    stopSpeak();
    if (!caVoice) return;
    const sec = btn.closest('.sec');
    const text = sec.querySelector('.sec-head h2').innerText + '. ' + sec.querySelector('.prose').innerText;
    // Frases curtes: alguns navegadors tallen els textos llargs
    const chunks = (text.replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]*/g) || []).map(c => c.trim()).filter(Boolean);
    if (!chunks.length) return;
    speakBtn = btn; btn.setAttribute('aria-pressed', 'true'); btn.querySelector('.t').textContent = 'Atura';
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c);
      u.voice = caVoice; u.lang = caVoice.lang;
      if (i === chunks.length - 1) u.onend = () => { if (speakBtn === btn) stopSpeak(); };
      TTS.speak(u);
    });
  }
  $('#chapter').addEventListener('click', e => { const b = e.target.closest('.listen'); if (b) speak(b); });

  // ================= CÈL·LULA =================
  const SVG = {
    animal: `<svg viewBox="0 0 420 300" role="group" aria-label="Cèl·lula animal">
      <g class="part" data-p="citoplasma"><path d="M70 60 C140 10 300 20 360 80 C410 130 400 220 340 260 C270 300 130 295 70 250 C20 210 15 110 70 60Z" fill="#fde3d6"/></g>
      <g class="part" data-p="citoesquelet" stroke="#e0a48a" stroke-width="2" fill="none"><path d="M60 150 L130 120 M330 70 L290 120 M350 230 L300 200 M110 250 L150 210 M380 150 L330 160"/></g>
      <g class="part" data-p="rer" fill="none" stroke="#c9799b" stroke-width="5" stroke-linecap="round"><path d="M262 100 q10 15 0 30 q-10 15 0 30 q10 15 0 30"/><path d="M280 95 q10 18 0 36 q-10 18 0 36 q10 18 0 36"/><g fill="#7a3b56" stroke="none"><circle cx="270" cy="108" r="3"/><circle cx="270" cy="140" r="3"/><circle cx="270" cy="172" r="3"/><circle cx="288" cy="115" r="3"/><circle cx="288" cy="150" r="3"/><circle cx="288" cy="190" r="3"/></g></g>
      <g class="part" data-p="rel" fill="none" stroke="#d7a64f" stroke-width="7" stroke-linecap="round"><path d="M100 200 q20 -12 40 0 t40 0"/><path d="M105 222 q20 -12 40 0 t40 0"/></g>
      <g class="part" data-p="nucli"><circle cx="200" cy="140" r="55" fill="#b9a3e3" stroke="#6d55a8" stroke-width="4"/></g>
      <g class="part" data-p="nucleol"><circle cx="212" cy="132" r="17" fill="#5e3f9e"/></g>
      <g class="part" data-p="golgi" fill="none" stroke="#e08a2c" stroke-width="6" stroke-linecap="round"><path d="M300 225 q25 -20 50 0"/><path d="M296 238 q29 -22 58 0"/><path d="M300 251 q25 -20 50 0"/><circle cx="360" cy="220" r="4" fill="#e08a2c" stroke="none"/></g>
      <g class="part" data-p="mitocondri"><ellipse cx="120" cy="100" rx="34" ry="17" fill="#f08a6c" stroke="#b5482c" stroke-width="3"/><path d="M95 100 l8 -9 l8 18 l8 -18 l8 18 l8 -18 l8 18 l8 -9" fill="none" stroke="#b5482c" stroke-width="2"/><ellipse cx="250" cy="250" rx="28" ry="14" transform="rotate(-15 250 250)" fill="#f08a6c" stroke="#b5482c" stroke-width="3"/><path d="M230 255 l7 -8 l7 15 l7 -15 l7 15 l7 -15 l5 7" transform="rotate(-15 250 250)" fill="none" stroke="#b5482c" stroke-width="2"/></g>
      <g class="part" data-p="lisosoma"><circle cx="330" cy="130" r="11" fill="#8fcf7a" stroke="#3f7f2c" stroke-width="2"/><circle cx="160" cy="255" r="9" fill="#8fcf7a" stroke="#3f7f2c" stroke-width="2"/></g>
      <g class="part" data-p="vacuol"><circle cx="90" cy="160" r="14" fill="#bfe3f5" stroke="#4a92b8" stroke-width="2"/><circle cx="345" cy="175" r="10" fill="#bfe3f5" stroke="#4a92b8" stroke-width="2"/></g>
      <g class="part" data-p="ribosomes" fill="#5a3d2e"><circle cx="160" cy="70" r="3"/><circle cx="175" cy="60" r="3"/><circle cx="310" cy="95" r="3"/><circle cx="85" cy="125" r="3"/><circle cx="215" cy="215" r="3"/><circle cx="230" cy="225" r="3"/><circle cx="370" cy="110" r="3"/><circle cx="140" cy="160" r="3"/></g>
      <g class="part" data-p="membrana"><path d="M70 60 C140 10 300 20 360 80 C410 130 400 220 340 260 C270 300 130 295 70 250 C20 210 15 110 70 60Z" fill="none" stroke="#d0674a" stroke-width="7"/></g>
    </svg>`,
    vegetal: `<svg viewBox="0 0 420 300" role="group" aria-label="Cèl·lula vegetal">
      <g class="part" data-p="paretv"><rect x="12" y="12" width="396" height="276" rx="20" fill="none" stroke="#7d9b3f" stroke-width="16"/></g>
      <g class="part" data-p="plasmodesmes" stroke="#fffdf6" stroke-width="5"><path d="M4 110 h18 M4 190 h18 M398 90 h18 M398 210 h18 M150 4 v18 M290 278 v18"/></g>
      <g class="part" data-p="citoplasma"><rect x="26" y="26" width="368" height="248" rx="12" fill="#e7f3cf"/></g>
      <g class="part" data-p="vacuolc"><path d="M70 70 C140 50 230 55 250 90 C270 130 260 210 220 230 C170 255 90 250 65 210 C45 170 45 90 70 70Z" fill="#c6e4f5" stroke="#4a92b8" stroke-width="3"/></g>
      <g class="part" data-p="nucli"><circle cx="320" cy="90" r="38" fill="#b9a3e3" stroke="#6d55a8" stroke-width="4"/></g>
      <g class="part" data-p="nucleol"><circle cx="330" cy="84" r="12" fill="#5e3f9e"/></g>
      <g class="part" data-p="cloroplast"><g transform="rotate(20 300 200)"><ellipse cx="300" cy="200" rx="32" ry="16" fill="#58a845" stroke="#2c6b22" stroke-width="3"/><path d="M280 194 v12 M290 192 v16 M300 191 v18 M310 192 v16 M320 194 v12" stroke="#1f4d18" stroke-width="3"/></g><g transform="rotate(-25 110 255)"><ellipse cx="110" cy="255" rx="28" ry="13" fill="#58a845" stroke="#2c6b22" stroke-width="3"/><path d="M95 250 v10 M104 248 v14 M113 248 v14 M122 250 v10" stroke="#1f4d18" stroke-width="3"/></g><g transform="rotate(10 365 245)"><ellipse cx="362" cy="245" rx="22" ry="11" fill="#58a845" stroke="#2c6b22" stroke-width="3"/></g><ellipse cx="60" cy="45" rx="22" ry="10" fill="#58a845" stroke="#2c6b22" stroke-width="3"/></g>
      <g class="part" data-p="mitocondri"><ellipse cx="200" cy="255" rx="24" ry="11" fill="#f08a6c" stroke="#b5482c" stroke-width="3"/><path d="M182 255 l6 -7 l6 14 l6 -14 l6 14 l6 -14 l6 7" fill="none" stroke="#b5482c" stroke-width="2"/><ellipse cx="370" cy="160" rx="11" ry="22" fill="#f08a6c" stroke="#b5482c" stroke-width="3"/></g>
      <g class="part" data-p="golgi" fill="none" stroke="#e08a2c" stroke-width="6" stroke-linecap="round"><path d="M285 140 q22 -16 44 0"/><path d="M281 152 q26 -18 52 0"/><path d="M285 164 q22 -16 44 0"/></g>
      <g class="part" data-p="rer" fill="none" stroke="#c9799b" stroke-width="5" stroke-linecap="round"><path d="M268 60 q-14 25 0 50"/><path d="M255 68 q-12 20 0 40"/><g fill="#7a3b56" stroke="none"><circle cx="262" cy="70" r="3"/><circle cx="262" cy="100" r="3"/><circle cx="249" cy="88" r="3"/></g></g>
      <g class="part" data-p="membrana"><rect x="26" y="26" width="368" height="248" rx="12" fill="none" stroke="#3f7f2c" stroke-width="4"/></g>
    </svg>`,
    procariota: `<svg viewBox="0 0 420 300" role="group" aria-label="Cèl·lula procariota (bacteri)">
      <g class="part" data-p="flagel"><path d="M352 150 q15 -25 30 0 t30 0" fill="none" stroke="#8a6d4a" stroke-width="5" stroke-linecap="round"/><path d="M352 150 q15 -25 30 0 t30 0" fill="none" stroke="transparent" stroke-width="18"/></g>
      <g class="part" data-p="pili" stroke="#8a6d4a" stroke-width="3" stroke-linecap="round"><path d="M110 78 l-8 -20 M160 68 l-3 -20 M220 66 l2 -20 M280 70 l6 -20 M120 222 l-8 20 M190 234 l0 20 M260 232 l6 20"/><path d="M110 78 l-8 -20 M160 68 l-3 -20 M220 66 l2 -20 M280 70 l6 -20 M120 222 l-8 20 M190 234 l0 20 M260 232 l6 20" stroke="transparent" stroke-width="14"/></g>
      <g class="part" data-p="capsula"><rect x="40" y="66" width="320" height="168" rx="84" fill="#f3e6b8" fill-opacity=".75" stroke="#c9a94a" stroke-width="3" stroke-dasharray="6 5"/></g>
      <g class="part" data-p="paretb"><rect x="56" y="80" width="288" height="140" rx="70" fill="#d9b8e8" stroke="#8d5aa8" stroke-width="3"/></g>
      <g class="part" data-p="citoplasma"><rect x="68" y="92" width="264" height="116" rx="58" fill="#f6eefb"/></g>
      <g class="part" data-p="membrana"><rect x="68" y="92" width="264" height="116" rx="58" fill="none" stroke="#c0674a" stroke-width="5"/></g>
      <g class="part" data-p="nucleoide"><path d="M150 150 c10 -40 60 -30 50 0 s-50 30 -20 25 s60 -50 80 -15 s-40 35 -60 10 s-40 -30 -50 -20z" fill="none" stroke="#5e3f9e" stroke-width="4"/><path d="M150 150 c10 -40 60 -30 50 0 s-50 30 -20 25 s60 -50 80 -15 s-40 35 -60 10 s-40 -30 -50 -20z" fill="none" stroke="transparent" stroke-width="16"/></g>
      <g class="part" data-p="plasmidi" fill="none" stroke="#2f8a7a" stroke-width="4"><circle cx="110" cy="130" r="10"/><circle cx="290" cy="180" r="8"/></g>
      <g class="part" data-p="ribosomes" fill="#5a3d2e"><circle cx="105" cy="170" r="4"/><circle cx="125" cy="185" r="4"/><circle cx="270" cy="115" r="4"/><circle cx="300" cy="135" r="4"/><circle cx="240" cy="190" r="4"/><circle cx="140" cy="112" r="4"/></g>
    </svg>`
  };
  const CELL_PARTS = {
    animal: ['membrana', 'citoplasma', 'nucli', 'nucleol', 'mitocondri', 'rer', 'rel', 'golgi', 'lisosoma', 'vacuol', 'citoesquelet', 'ribosomes'],
    vegetal: ['paretv', 'membrana', 'citoplasma', 'vacuolc', 'cloroplast', 'nucli', 'nucleol', 'mitocondri', 'golgi', 'rer', 'plasmodesmes'],
    procariota: ['capsula', 'paretb', 'membrana', 'citoplasma', 'nucleoide', 'plasmidi', 'ribosomes', 'flagel', 'pili']
  };
  const CELL_NAMES = { animal: 'Animal', vegetal: 'Vegetal', procariota: 'Procariota (bacteri)' };
  const CELL_LABELS = {
    animal: { membrana:'Membrana', citoplasma:'Citoplasma', nucli:'Nucli', nucleol:'Nuclèol', mitocondri:'Mitocondri', rer:'RE rugós', rel:'RE llis', golgi:'Golgi', lisosoma:'Lisosoma', vacuol:'Vacúol', citoesquelet:'Citoesquelet', ribosomes:'Ribosomes' },
    vegetal: { paretv:'Paret', plasmodesmes:'Plasmodesmes', membrana:'Membrana', citoplasma:'Citoplasma', vacuolc:'Vacúol central', nucli:'Nucli', nucleol:'Nuclèol', cloroplast:'Cloroplast', mitocondri:'Mitocondri', golgi:'Golgi', rer:'RE rugós' },
    procariota: { capsula:'Càpsula', paretb:'Paret', membrana:'Membrana', citoplasma:'Citoplasma', nucleoide:'Nucleoide', plasmidi:'Plàsmid', ribosomes:'Ribosomes', flagel:'Flagel', pili:'Pili' }
  };
  const CELL_POS = {
    animal: { membrana:[345,55], citoplasma:[110,232], nucli:[200,182], nucleol:[212,112], mitocondri:[120,78], rer:[280,88], rel:[140,192], golgi:[325,270], lisosoma:[330,112], vacuol:[90,140], citoesquelet:[362,145], ribosomes:[168,50] },
    vegetal: { paretv:[230,295], plasmodesmes:[95,112], membrana:[60,272], citoplasma:[230,42], vacuolc:[155,150], nucli:[320,46], nucleol:[330,114], cloroplast:[300,234], mitocondri:[200,238], golgi:[307,181], rer:[242,64] },
    procariota: { capsula:[190,60], paretb:[200,88], membrana:[200,106], citoplasma:[205,198], nucleoide:[195,152], plasmidi:[110,152], ribosomes:[285,128], flagel:[385,132], pili:[130,44] }
  };
  let cellType = 'animal', partColor = {}, GAME = null;
  function initCellula() {
    $('#cell-types').innerHTML = Object.keys(SVG).map(k => `<button type="button" data-cell="${k}">${CELL_NAMES[k]}</button>`).join('');
    $('#cell-types').addEventListener('click', e => { const b = e.target.closest('[data-cell]'); if (b) drawCell(b.dataset.cell); });
    // Interruptor «Mostra els noms»
    const sw = $('#labels-sw');
    sw.checked = get('labels', false);
    sw.addEventListener('change', () => { set('labels', sw.checked); const svg = $('#cell-svg svg'); if (svg) svg.classList.toggle('show-labels', sw.checked); });
    const stage = $('#cell-svg');
    // Tocar una part la selecciona; tocar fora de la cèl·lula treu la selecció
    stage.addEventListener('click', e => {
      const g = partAt(e);
      if (GAME && GAME.type === 'find' && g && (e.pointerType === 'touch' || e.pointerType === 'pen')) { setCandidate(g.dataset.p); return; }
      if (GAME) { if (g && GAME.type === 'find') gameAnswer(g.dataset.p); return; }
      g ? pickPart(g.dataset.p) : clearSel();
    });
    stage.addEventListener('keydown', e => {
      const g = e.target.closest('.part');
      if (!g || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      if (GAME) { if (GAME.type === 'find') gameAnswer(g.dataset.p); } else pickPart(g.dataset.p);
    });
    $('#cell-info').addEventListener('click', e => {
      if (e.target.closest('[data-clear]')) { clearSel(); return; }
      const b = e.target.closest('[data-pp]'); if (b) pickPart(b.dataset.pp);
    });
    $('#sel-bar').addEventListener('click', e => {
      if (e.target.closest('[data-clear]')) { clearSel(); return; }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#v-cellula').hidden && !GAME) clearSel(); });
    setupGames();
    // Tooltip de nom (només rató)
    const tip = document.createElement('div');
    tip.className = 'part-tip';
    tip.id = 'part-tip';
    tip.hidden = true;
    document.querySelector('.cell-stage').appendChild(tip);
    stage.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      if (GAME) { tip.hidden = true; return; } // durant el joc no es pot ensenyar el nom (seria la resposta)
      const g = e.target.closest('.part');
      if (g) {
        const rect = document.querySelector('.cell-stage').getBoundingClientRect();
        tip.textContent = D.parts[g.dataset.p].nom;
        tip.hidden = false;
        tip.style.left = (e.clientX - rect.left + 14) + 'px';
        tip.style.top = (e.clientY - rect.top + 14) + 'px';
      } else {
        tip.hidden = true;
      }
    });
    stage.addEventListener('pointerleave', () => { tip.hidden = true; });
    const t63 = chap(6) && chap(6).sections.find(s => s.num === '6.3');
    $('#cell-extra').innerHTML = `<h2 class="section-title">I la cèl·lula dels fongs?</h2>
      <p>La cèl·lula fúngica té nucli, membrana, mitocondris, ribosomes, reticle endoplasmàtic, aparell de Golgi i vacúols. La seva <b>paret</b> és habitualment de <b>quitina i glucans</b>, les membranes contenen <b>ergosterol</b> i <b>no té cloroplasts</b>: no fa fotosíntesi. ${secLink('3.2')}</p>
      ${t63 ? `<h2 class="section-title">Comparació: vegetal, animal i fúngica</h2><div class="prose">${blocks(t63.lines)}</div>` : ''}`;
    drawCell('animal');
  }
  function drawCell(type) {
    cellType = type; selUI(null);
    $$('#cell-types [data-cell]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cell === type)));
    $('#cell-svg').innerHTML = SVG[type];
    // Detecta colors de cada part per a la llegenda
    partColor = {};
    $$('#cell-svg .part').forEach(g => {
      const k = g.dataset.p;
      const child = [...g.children].find(c => c.tagName !== 'title' && (c.getAttribute('fill') || '').length > 0 && ['none','transparent'].indexOf((c.getAttribute('fill')||'').toLowerCase()) === -1);
      if (child) { partColor[k] = child.getAttribute('fill'); }
      else {
        const stroke = g.getAttribute('stroke');
        if (stroke) { partColor[k] = stroke; }
        else {
          const firstChild = [...g.children].find(c => c.tagName !== 'title');
          if (firstChild) { const fl = (firstChild.getAttribute('fill') || '').toLowerCase(); partColor[k] = (fl && fl !== 'none' && fl !== 'transparent') ? fl : (firstChild.getAttribute('stroke') || ''); }
        }
      }
    });
    const svg = $('#cell-svg svg');
    // Afegeix el grup d'etiquetes al final del SVG
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'cell-labels');
    g.setAttribute('aria-hidden', 'true');
    const labels = CELL_LABELS[type] || {};
    const pos = CELL_POS[type] || {};
    Object.keys(labels).forEach(k => {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('class', 'lbl');
      t.setAttribute('data-l', k);
      t.setAttribute('x', pos[k] ? pos[k][0] : 0);
      t.setAttribute('y', pos[k] ? pos[k][1] : 0);
      t.setAttribute('text-anchor', type === 'vegetal' && k === 'rer' ? 'end' : 'middle');
      t.textContent = labels[k];
      g.appendChild(t);
    });
    svg.appendChild(g);
    // Classe show-labels segons preferència guardada
    svg.classList.toggle('show-labels', get('labels', false));
    $$('#cell-svg .part').forEach(g => {
      g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
      g.setAttribute('aria-label', D.parts[g.dataset.p].nom);
    });
    showInfo(null);
  }
  function showInfo(p) {
    const list = `<details class="parts-box"${window.matchMedia('(min-width: 901px)').matches ? ' open' : ''}><summary>Totes les parts (${CELL_PARTS[cellType].length})</summary><div class="part-list">${CELL_PARTS[cellType].map(k => `<button class="chip" type="button" data-pp="${k}" aria-pressed="${k === p}"><span class="dot" style="background:${partColor[k]}" aria-hidden="true"></span>${D.parts[k].nom}</button>`).join('')}</div></details>`;
    if (!p) { $('#cell-info').innerHTML = `<h2>Cèl·lula ${CELL_NAMES[cellType].toLowerCase()}</h2><p class="muted">Toca una part del dibuix o tria-la de la llista.</p>${list}`; return; }
    const d = D.parts[p];
    $('#cell-info').innerHTML = `<div class="info-head"><h2>${d.nom}</h2></div><div class="where">${ICON('pin')} ${d.on}</div><p>${d.txt}</p><p>${secLink(d.s)}</p>${list}`;
  }
  // Pinta la barra de selecció
  function selUI(p) {
    const bar = $('#sel-bar');
    if (!p) { bar.innerHTML = '<span class="sel-hint" id="sel-hint">Toca una part del dibuix per veure què és</span>'; return; }
    bar.innerHTML = `<span class="sel-label">Seleccionat:</span> <button type="button" class="sel-chip" data-clear>${D.parts[p].nom} ${ICON('x')}<span class="sr-only">. Treu la selecció</span></button>`;
  }
  // Treu la selecció i torna a mostrar la cèl·lula sencera
  function clearSel() {
    $$('#cell-svg .part').forEach(g => g.classList.remove('sel'));
    const svg = $('#cell-svg svg'); if (svg) svg.classList.remove('has-sel');
    $$('#cell-svg .lbl.on').forEach(t => t.classList.remove('on'));
    selUI(null);
    showInfo(null);
  }
  function pickPart(p) {
    // Si ja està seleccionada i no hi ha cerca activa, deselecciona
    if (p && document.querySelector(`#cell-svg .part.sel[data-p="${p}"]`)) { clearSel(); return; }
    $$('#cell-svg .part').forEach(g => g.classList.toggle('sel', g.dataset.p === p));
    const svg = $('#cell-svg svg'); if (svg) svg.classList.toggle('has-sel', !!p);
    // Etiqueta: la part seleccionada porta classe «on», les altres s'atenuen
    $$('#cell-svg .lbl').forEach(t => t.classList.toggle('on', t.dataset.l === p));
    selUI(p);
    showInfo(p);
  }

  // ---------- Jocs de la cèl·lula ----------
  // GAME = { type: 'find'|'name'|'which', list: [claus], i, ok, tries, wrong: [], locked }
  const GAME_N = 10;
  function setupGames() {
    $('#game-launch').addEventListener('click', e => { const b = e.target.closest('[data-game]'); if (b) startGame(b.dataset.game); });
    $('.cell-stage').addEventListener('click', e => {
      if (!GAME) return;
      const t = e.target;
      if (t.closest('[data-game-exit]')) return exitGame();
      if (t.closest('[data-game-next]')) return nextQ();
      const cf = t.closest('[data-confirm]'); if (cf) return gameAnswer(cf.dataset.confirm);
      if (t.closest('[data-game-again]')) return startGame(GAME.type);
      if (t.closest('[data-game-retry]')) return startGame(GAME.type, shuffle(GAME.wrong));
      const o = t.closest('[data-opt]'); if (o) return answerName(o);
      const c = t.closest('[data-cellopt]'); if (c && !GAME.locked) { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); return; }
      if (t.closest('[data-check]')) return answerWhich();
    });
  }
  // Tria la part més petita dins d'un radi al voltant del dit (per encertar les parts petites al mòbil)
  function partAt(e) {
    const R = (e.pointerType === 'touch' || e.pointerType === 'pen') ? 18 : 4;
    const pts = [[0, 0], [R, 0], [-R, 0], [0, R], [0, -R], [R * .7, R * .7], [-R * .7, R * .7], [R * .7, -R * .7], [-R * .7, -R * .7]];
    let best = null, area = Infinity;
    pts.forEach(([dx, dy]) => {
      const el = document.elementFromPoint(e.clientX + dx, e.clientY + dy);
      const g = el && el.closest && el.closest('#cell-svg .part'); if (!g) return;
      const r = el.getBoundingClientRect(), a = r.width * r.height;
      if (a < area) { area = a; best = g; }
    });
    return best;
  }
  // Mòbil: primer es marca la part triada i després es confirma
  function setCandidate(p) {
    if (!GAME || GAME.locked) return;
    $$('#cell-svg .part').forEach(g => g.classList.toggle('cand', g.dataset.p === p));
    $('#game-foot').innerHTML = `<button class="btn primary game-confirm" type="button" data-confirm="${p}">${ICON('tick')} Comprova aquesta part</button>`;
  }

  function gameList(type) {
    if (type === 'which') return drawBag('cell:which', Object.keys(D.partCells), GAME_N, x => x);
    return drawBag('cell:' + type + ':' + cellType, CELL_PARTS[cellType], GAME_N, x => x);
  }
  function startGame(type, list) {
    if (GAME) cleanGameMarks();
    clearSel();
    GAME = { type, list: list && list.length ? list : gameList(type), i: 0, ok: 0, tries: 0, wrong: [], locked: false, run: newRun() };
    const v = $('#v-cellula');
    v.classList.add('playing');
    v.classList.toggle('which', type === 'which');
    $('#labels-sw').disabled = true;
    $$('#cell-types button').forEach(b => { b.disabled = true; b.title = 'No es pot canviar durant el joc'; });
    $('#game-bar').hidden = false; $('#game-foot').hidden = false;
    renderGame();
    const stage = $('.cell-stage'), bar = $('.topbar');
    window.scrollTo({ top: stage.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 0) - 10, behavior: 'smooth' });
  }
  function gameHead() {
    const n = GAME.list.length;
    return `<div class="game-top"><span class="game-prog">Pregunta ${GAME.i + 1} de ${n}</span><span class="game-score">${ICON('tick')} ${GAME.ok}</span>` +
      `<button class="btn small" type="button" data-game-exit>${ICON('x')} Surt del joc</button></div>` +
      `<div class="qbar"><span style="width:${GAME.i / n * 100}%"></span></div>`;
  }
  function renderGame() {
    const k = GAME.list[GAME.i];
    GAME.run.t0 = Date.now();
    cleanGameMarks();
    if (GAME.type === 'find') {
      $('#game-bar').innerHTML = gameHead() + `<p class="game-q">On és: <b>${D.parts[k].nom}</b>?</p>`;
      $('#game-foot').innerHTML = '';
    } else if (GAME.type === 'name') {
      const part = $(`#cell-svg .part[data-p="${k}"]`); if (part) part.classList.add('sel');
      $('#cell-svg svg').classList.add('has-sel');
      const opts = shuffle([k, ...shuffle(CELL_PARTS[cellType].filter(x => x !== k)).slice(0, 3)]);
      $('#game-bar').innerHTML = gameHead() + `<p class="game-q">Com es diu la part que brilla?</p>`;
      $('#game-foot').innerHTML = opts.map(x => `<button class="btn game-opt" type="button" data-opt="${x}">${D.parts[x].nom}</button>`).join('');
    } else {
      $('#game-bar').innerHTML = gameHead() + `<p class="game-q">En quines cèl·lules hi ha: <b>${D.parts[k].nom}</b>?</p><p class="game-sub">Marca totes les que corresponguin.</p>`;
      $('#game-foot').innerHTML = ['animal', 'vegetal', 'procariota'].map(c => `<button class="btn game-opt" type="button" data-cellopt="${c}" aria-pressed="false">${CELL_NAMES[c]}</button>`).join('') +
        `<button class="btn primary" type="button" data-check>Comprova</button>`;
    }
  }
  function showNext() {
    const b = document.createElement('button');
    b.className = 'btn primary'; b.type = 'button'; b.dataset.gameNext = '';
    b.textContent = GAME.i + 1 >= GAME.list.length ? 'Veure resultat' : 'Següent →';
    $('#game-foot').appendChild(b); b.focus();
  }
  function gameAnswer(p) {
    if (!GAME || GAME.locked) return;
    const k = GAME.list[GAME.i];
    const part = $(`#cell-svg .part[data-p="${p}"]`);
    $$('#cell-svg .part').forEach(g => g.classList.remove('cand'));
    $('#game-foot').innerHTML = '';
    if (p === k) {
      GAME.ok++; GAME.locked = true; runHit(GAME.run);
      if (part) part.classList.add('flash-ok');
      $('#game-bar .game-q').innerHTML = `<span class="game-fb ok">${ICON('tick')} Correcte! <b>${D.parts[k].nom}</b></span>`;
      setTimeout(nextQ, 900);
      return;
    }
    if (navigator.vibrate) navigator.vibrate(120);
    if (part) { part.classList.add('flash-bad', 'was-wrong'); setTimeout(() => part.classList.remove('flash-bad'), 600); }
    GAME.tries++; runMiss(GAME.run);
    if (GAME.tries >= 2) {
      GAME.locked = true; GAME.wrong.push(k);
      const right = $(`#cell-svg .part[data-p="${k}"]`); if (right) right.classList.add('reveal');
      $('#game-bar .game-q').innerHTML = `<span class="game-fb bad">${ICON('x')} Has tocat <b>${D.parts[p].nom}</b>. Era aquí: <b>${D.parts[k].nom}</b></span>`;
      showNext();
    } else {
      $('#game-bar .game-q').innerHTML = `<span class="game-fb bad">${ICON('x')} Això és <b>${D.parts[p].nom}</b>. Et queda 1 intent.</span><br>On és: <b>${D.parts[k].nom}</b>?`;
    }
  }
  function answerName(btn) {
    if (GAME.locked) return;
    GAME.locked = true;
    const k = GAME.list[GAME.i];
    $$('#game-foot [data-opt]').forEach(b => { b.disabled = true; if (b.dataset.opt === k) b.classList.add('right'); });
    if (btn.dataset.opt === k) { GAME.ok++; runHit(GAME.run); } else { btn.classList.add('wrong'); GAME.wrong.push(k); runMiss(GAME.run); }
    showNext();
  }
  function answerWhich() {
    if (GAME.locked) return;
    GAME.locked = true;
    const k = GAME.list[GAME.i], should = new Set(D.partCells[k]);
    let good = true;
    $$('#game-foot [data-cellopt]').forEach(b => {
      const on = b.getAttribute('aria-pressed') === 'true', must = should.has(b.dataset.cellopt);
      if (on !== must) good = false;
      if (must) b.classList.add('right'); else if (on) b.classList.add('wrong');
      b.disabled = true;
    });
    const chk = $('#game-foot [data-check]'); if (chk) chk.remove();
    if (good) { GAME.ok++; runHit(GAME.run); } else { GAME.wrong.push(k); runMiss(GAME.run); }
    const p = document.createElement('p');
    p.className = 'game-explain';
    p.innerHTML = `<b class="${good ? 'ok' : 'bad'}">${good ? '✓ Correcte!' : '✗ No del tot.'}</b> ${D.parts[k].nom}: ${D.parts[k].on}. ${secLink(D.parts[k].s)}`;
    $('#game-foot').appendChild(p);
    showNext();
  }
  function nextQ() {
    if (!GAME) return;
    GAME.i++; GAME.tries = 0; GAME.locked = false;
    if (GAME.i >= GAME.list.length) endGame(); else renderGame();
  }
  function endGame() {
    cleanGameMarks();
    const n = GAME.list.length, pct = Math.round(GAME.ok / n * 100);
    const best = get('cellBest', {}), key = GAME.type + ':' + (GAME.type === 'which' ? 'totes' : cellType);
    const rec = best[key] == null || pct > best[key];
    if (rec) { best[key] = pct; set('cellBest', best); }
    $('#game-bar').innerHTML = `<div class="game-top"><span class="game-prog">Resultat</span>` +
      `<button class="btn small" type="button" data-game-exit>${ICON('x')} Surt del joc</button></div>` +
      `<p class="game-q">Has encertat <b>${GAME.ok} de ${n}</b>${rec ? ' · Nou rècord!' : ''}</p>` + rankBlock('cell-' + GAME.type, GAME.run, GAME.ok, n);
    $('#game-foot').innerHTML = `<button class="btn primary" type="button" data-game-again>Torna a jugar</button>` +
      (GAME.wrong.length ? `<button class="btn" type="button" data-game-retry>Repassa les que has fallat (${GAME.wrong.length})</button>` : '') +
      `<button class="btn" type="button" data-game-exit>Surt del joc</button>`;
    $('#game-foot .btn').focus();
  }
  function cleanGameMarks() {
    $$('#cell-svg .part').forEach(g => g.classList.remove('flash-ok', 'flash-bad', 'reveal', 'sel', 'was-wrong', 'cand'));
    const svg = $('#cell-svg svg'); if (svg) svg.classList.remove('has-sel');
  }
  function exitGame() {
    if (!GAME) return;
    GAME = null;
    cleanGameMarks();
    const v = $('#v-cellula');
    v.classList.remove('playing', 'which');
    $('#game-bar').hidden = true; $('#game-bar').innerHTML = '';
    $('#game-foot').hidden = true; $('#game-foot').innerHTML = '';
    $('#labels-sw').disabled = false;
    $$('#cell-types button').forEach(b => { b.disabled = false; b.removeAttribute('title'); });
    const svg = $('#cell-svg svg'); if (svg) svg.classList.toggle('show-labels', get('labels', false));
    clearSel();
    $('#game-launch [data-game]').focus();
  }
  function cellGameExit() { if (GAME) exitGame(); }

  // ================= COMPARAR =================
  const KNAMES = ['Moneres', 'Protoctists', 'Fongs', 'Plantes', 'Animals'];
  let duelSel = [1, 5], KROWS = null, KHEAD = null;
  function initComparar() {
    const s61 = chap(6) && chap(6).sections.find(s => s.num === '6.1');
    const rows = s61 ? s61.lines.filter(l => l.startsWith('|')) : [];
    if (rows.length > 2) { KHEAD = splitRow(rows[0]); KROWS = rows.slice(2).map(splitRow); }
    // Read & validate saved selection, then sync selects
    let saved = get('cmp', [1, 5]);
    if (!Array.isArray(saved) || saved.length !== 2 || !saved.every(v => Number.isInteger(v) && v >= 1 && v <= 5)) saved = [1, 5];
    duelSel = saved;
    $('#cmp-a').value = duelSel[0];
    $('#cmp-b').value = duelSel[1];
    $('#cmp-a').addEventListener('change', () => {
      const oldA = duelSel[0], nv = +$('#cmp-a').value;
      if (nv === duelSel[1]) { duelSel[1] = oldA; $('#cmp-b').value = oldA; }
      duelSel[0] = nv; set('cmp', duelSel); renderDuel();
    });
    $('#cmp-b').addEventListener('change', () => {
      const oldB = duelSel[1], nv = +$('#cmp-b').value;
      if (nv === duelSel[0]) { duelSel[0] = oldB; $('#cmp-a').value = oldB; }
      duelSel[1] = nv; set('cmp', duelSel); renderDuel();
    });
    $('#cmp-swap').addEventListener('click', () => { const t = duelSel[0]; duelSel[0] = duelSel[1]; duelSel[1] = t; $('#cmp-a').value = duelSel[0]; $('#cmp-b').value = duelSel[1]; set('cmp', duelSel); renderDuel(); });
    const c6 = chap(6);
    $('#comp-tables').innerHTML = c6 ? `<div class="tools" style="margin-top:28px"><button class="chip repas2" type="button" aria-pressed="false">${ICON('eyeoff')} Mode repàs de taules</button><span class="muted">Amaga les respostes i toca cada cel·la per comprovar-te.</span></div>` +
      `<div class="prose">${blocks(c6.intro)}</div>` +
      c6.sections.filter(s => s.num !== '6.1').map(s => `<h2 class="section-title">${s.num} ${inline(s.title)}</h2><div class="prose">${blocks(s.lines)}</div>`).join('') : '';
    $('#comp-tables').addEventListener('keydown', cellKeys);
    $('#comp-tables').addEventListener('click', e => {
      const r = e.target.closest('.repas2');
      if (r) { const on = !$('#comp-tables').classList.contains('hide-mode'); setHideMode($('#comp-tables'), on); r.setAttribute('aria-pressed', String(on)); return; }
      revealCell(e);
    });
    renderDuel();
  }
  // Taula comparativa única: propietat | regne A | regne B, amb les diferències destacades
  let onlyDiff = false;
  function renderDuel() {
    if (!KROWS || duelSel.length < 2) {
      $('#duel').innerHTML = '';
      $('#cmp-a').style.borderLeftColor = '';
      $('#cmp-b').style.borderLeftColor = '';
      return;
    }
    const a = duelSel[0], b = duelSel[1];
    const ra = KROWS[a - 1], rb = KROWS[b - 1];
    // Actualitza el color de la vora esquerra de cada select segons el regne triat
    $('#cmp-a').style.borderLeftColor = `var(--k${a})`;
    $('#cmp-b').style.borderLeftColor = `var(--k${b})`;
    let nDiff = 0;
    const rows = KHEAD.slice(1).map((h, j) => {
      const va = ra[j + 1], vb = rb[j + 1], diff = va !== vb;
      if (diff) nDiff++;
      return `<tr class="${diff ? 'diff' : 'same'}"><td class="cell-label"><span class="char-name">${inline(h)}${diff ? ' <span class="diff-tag">Diferent</span>' : ''}</span></td>
        <td class="cell-val" data-k="${esc(KNAMES[a - 1])}" style="--kc:var(--k${a});border-left:3px solid var(--kc)">${inline(va)}</td><td class="cell-val" data-k="${esc(KNAMES[b - 1])}" style="--kc:var(--k${b});border-left:3px solid var(--kc)">${inline(vb)}</td></tr>`;
    }).join('');
    $('#duel').innerHTML = `<div class="duel-bar"><p class="muted">${nDiff} de ${KHEAD.length - 1} característiques són diferents.</p>
        <button id="only-diff" class="chip" type="button" aria-pressed="${onlyDiff}">Mostra només les diferències</button></div>
      <div class="table-wrap duel-wrap${onlyDiff ? ' only-diff' : ''}"><table class="duel-tab">
        <thead><tr><th scope="col"><span class="sr-only">Característica</span></th>
          <th scope="col" style="--kc:var(--k${a})">${inline(ra[0])}</th><th scope="col" style="--kc:var(--k${b})">${inline(rb[0])}</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    $('#only-diff').addEventListener('click', () => { onlyDiff = !onlyDiff; renderDuel(); });
  }

  // ================= TARGETES =================
  let deck = [], fcI = 0, fcRev = false, fcOnlyPending = false, fcCh = 'tots';
  function initTargetes() {
    const chs = [...new Set(GLOSS.map(g => g.main).filter(x => x != null))].sort((a, b) => a - b);
    $('#fc-controls').innerHTML = `
      <div class="card setup">
        <div class="setup-field">
          <label class="setup-label" for="fc-ch">Capítol</label>
          <div class="setup-inline">
            <select class="select" id="fc-ch"><option value="tots">Tots els capítols (${GLOSS.length})</option>${chs.map(c => `<option value="${c}">${c}. ${D.capitols[c].curt} (${GLOSS.filter(g => g.main === c).length})</option>`).join('')}</select>
            <button class="btn" id="fc-shuf" type="button" aria-label="Barreja les targetes">${ICON('shuffle')}<span class="btn-txt">Barreja</span></button>
          </div>
        </div>
        <div class="setup-row">
          <label class="switch"><input type="checkbox" id="fc-pend"><span class="switch-track"></span><span class="switch-text">Només pendents</span></label>
          <label class="switch"><input type="checkbox" id="fc-rev"><span class="switch-track"></span><span class="switch-text">Definició primer</span></label>
        </div>
      </div>`;
    $('#fc-ch').addEventListener('change', e => { fcCh = e.target.value; buildDeck(); });
    $('#fc-pend').addEventListener('change', e => { fcOnlyPending = e.target.checked; buildDeck(); });
    $('#fc-rev').addEventListener('change', e => { fcRev = e.target.checked; showCard(); });
    $('#fc-shuf').addEventListener('click', () => { deck = shuffle(deck); fcI = 0; showCard(); });
    $('#fc-reset').addEventListener('click', () => { if (confirm('Vols esborrar les targetes marcades com a sabudes?')) { set('known', []); set('lvl', {}); buildDeck(); } });
    $('#flashcard').addEventListener('click', () => flip(!$('#flashcard').classList.contains('flipped')));
    $('#fc-yes').addEventListener('click', () => mark(true));
    $('#fc-no').addEventListener('click', () => mark(false));
    document.addEventListener('keydown', e => {
      if ($('#v-targetes').hidden || e.target.matches('input, select, textarea')) return;
      if (e.key === 'ArrowRight') mark(true); else if (e.key === 'ArrowLeft') mark(false);
    });
    buildDeck();
  }
  function flip(on) {
    $('#flashcard').classList.toggle('flipped', on);
    $('#fc-face-front').setAttribute('aria-hidden', String(on));
    $('#fc-face-back').setAttribute('aria-hidden', String(!on));
  }
  function getLvl() { return get('lvl', {}); }
  function buildDeck() {
    const known = new Set(get('known', []));
    const lvl = getLvl();
    const filtered = GLOSS.filter(g => (fcCh === 'tots' || g.main === +fcCh) && (!fcOnlyPending || !known.has(g.term)));
    filtered.sort((a, b) => (lvl[a.term] ?? 0) - (lvl[b.term] ?? 0));
    let i = 0;
    while (i < filtered.length) {
      const lev = lvl[filtered[i].term] ?? 0;
      let j = i;
      while (j < filtered.length && (lvl[filtered[j].term] ?? 0) === lev) j++;
      const chunk = filtered.slice(i, j);
      for (let p = chunk.length - 1; p > 0; p--) { const q = Math.floor(Math.random() * (p + 1)); [chunk[p], chunk[q]] = [chunk[q], chunk[p]]; }
      filtered.splice(i, j - i, ...chunk);
      i = j;
    }
    deck = filtered;
    fcI = 0; showCard();
  }
  function showCard() {
    flip(false);
    const known = new Set(get('known', []));
    const scope = GLOSS.filter(g => fcCh === 'tots' || g.main === +fcCh);
    const nk = scope.filter(g => known.has(g.term)).length;
    if (!deck.length) {
      $('#fc-front').innerHTML = '<span class="term">Fet!</span><span class="def">No queden targetes pendents en aquest grup.</span>';
      $('#fc-back').innerHTML = '';
      $('#fc-stats').textContent = `${nk} de ${scope.length} apreses`;
      return;
    }
    const g = deck[fcI % deck.length];
    const lvl = getLvl();
    const lv = lvl[g.term] ?? 0;
    const dots = Array.from({ length: 5 }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
    const t = `<span class="term">${esc(g.term)}</span><span class="lvl-wrap"><span class="lvl" aria-hidden="true">${dots}</span><span class="lvl-txt">Nivell ${lv} de 5</span></span>`, d = `<span class="def">${inline(g.def)}</span>`;
    $('#fc-front').innerHTML = fcRev ? d : t;
    $('#fc-back').innerHTML = fcRev ? t : d;
    $('#fc-stats').textContent = `Targeta ${fcI % deck.length + 1} / ${deck.length} · ${nk} de ${scope.length} apreses${known.has(g.term) ? ' · ✓ ja la saps' : ''}`;
  }
  function mark(ok) {
    if (!deck.length) return;
    const g = deck[fcI % deck.length];
    const lvl = getLvl();
    const known = new Set(get('known', []));
    if (ok) {
      known.add(g.term);
      lvl[g.term] = Math.min((lvl[g.term] ?? 0) + 1, 5);
      fcI++;
    } else {
      known.delete(g.term);
      lvl[g.term] = 0;
      const idx = fcI % deck.length;
      const nextG = deck[(idx + 1) % deck.length];
      const pos = deck.length < 4 ? deck.length : Math.min(idx + 3, deck.length);
      deck.splice(pos, 0, g);
      const newIdx = deck.indexOf(nextG);
      fcI = newIdx >= 0 ? newIdx : deck.length - 1;
      if (fcOnlyPending) { deck.splice(fcI % deck.length, 1); if (deck.length) fcI = fcI % deck.length; }
    }
    set('known', [...known]);
    set('lvl', lvl);
    showCard();
  }

  // ================= TEST =================
  // Les preguntes fallades es guarden ('errs') fins que s'encerten: així es poden repassar a part.
  let Q = null;
  const qKey = q => q.q || q.t;
  const SRC = { mc: () => D.preguntes, tf: () => D.mites };
  const MODE_NAME = { mc: 'tipus test', tf: 'vertader o fals' };
  function getErrs() { const e = get('errs', {}); return { mc: e.mc || [], tf: e.tf || [] }; }
  function errPool(mode) { const keys = new Set(getErrs()[mode]); return SRC[mode]().filter(q => keys.has(qKey(q))); }
  function noteAnswer(mode, q, right) {
    const e = getErrs(), s = new Set(e[mode]);
    right ? s.delete(qKey(q)) : s.add(qKey(q));
    e[mode] = [...s]; set('errs', e);
  }
  function startQuiz(opt, pool, review) { Q = { opt, pool, i: 0, ok: 0, wrong: [], review, run: newRun() }; askQ(); }
  function reviewBox() {
    const n = { mc: errPool('mc').length, tf: errPool('tf').length };
    if (!n.mc && !n.tf) return '';
    return `<div class="card errbox"><div><h2>${ICON('reset')} Repassa els teus errors</h2>
      <p>Tens <b>${n.mc + n.tf}</b> ${n.mc + n.tf === 1 ? 'pregunta fallada' : 'preguntes fallades'}. Quan l'encertis, desapareix de la llista.</p></div>
      <div class="errbtns">${['mc', 'tf'].filter(m => n[m]).map(m => `<button class="btn primary" type="button" data-review="${m}">Repassa ${MODE_NAME[m]} (${n[m]})</button>`).join('')}</div></div>`;
  }
  function initTest() {
    // Delegació: els botons de repàs apareixen tant a la configuració com al resultat
    $('#quiz').addEventListener('click', e => {
      const b = e.target.closest('[data-review]'); if (!b) return;
      const m = b.dataset.review;
      startQuiz({ mode: m, ch: 'errs', n: 999 }, shuffle(errPool(m)), true);
    });
    quizSetup();
  }
  function quizSetup() {
    const chs = [0, 1, 2, 3, 4, 5, 6];
    const best = get('best', {});
    const opt = { mode: 'mc', ch: 'tots', n: 10 };
    $('#quiz').innerHTML = `<div class="view-head"><h1>Posa't a prova</h1><p>Cada resposta s'explica amb el manual i et porta a la secció de teoria.</p></div>
      ${reviewBox()}
      <div class="card setup quiz-setup">
        <div class="setup-field">
          <span class="setup-label" id="lbl-mode">Què vols practicar?</span>
          <div class="opt-cards" data-f="mode" role="group" aria-labelledby="lbl-mode">
            <button class="opt-card" type="button" data-v="mc" aria-pressed="true"><b>Preguntes tipus test</b><span>${D.preguntes.length} preguntes amb quatre opcions</span></button>
            <button class="opt-card" type="button" data-v="tf" aria-pressed="false"><b>Vertader o fals</b><span>${D.mites.length} mites per desmuntar</span></button>
          </div>
        </div>
        <div class="setup-row">
          <div class="setup-field grow">
            <label class="setup-label" for="q-ch">Capítol</label>
            <select class="select" id="q-ch"><option value="tots">Tots els capítols</option>${chs.map(c => `<option value="${c}">${c}. ${D.capitols[c].curt}</option>`).join('')}</select>
          </div>
          <div class="setup-field">
            <span class="setup-label" id="lbl-n">Preguntes</span>
            <div class="seg" data-f="n" role="group" aria-labelledby="lbl-n">
              <button type="button" data-v="10" aria-pressed="true">10</button><button type="button" data-v="20" aria-pressed="false">20</button><button type="button" data-v="999" aria-pressed="false">Totes</button>
            </div>
          </div>
        </div>
        <p class="muted setup-hint" id="q-best"></p>
        <div class="setup-actions"><button class="btn primary" id="q-go" type="button">Comença →</button></div>
      </div>`;
    // Actualitza el rècord i el text del botó (quantes preguntes sortiran de veritat)
    const refresh = () => {
      const b = best[opt.mode + ':' + opt.ch];
      $('#q-best').textContent = b != null ? `La teva millor puntuació aquí: ${b}%` : '';
      const avail = SRC[opt.mode]().filter(q => opt.ch === 'tots' || q.c === +opt.ch).length;
      const k = Math.min(opt.n, avail);
      $('#q-go').textContent = `Comença · ${k} ${k === 1 ? 'pregunta' : 'preguntes'} →`;
    };
    $$('#quiz [data-f]').forEach(box => box.addEventListener('click', e => {
      const b = e.target.closest('button[data-v]'); if (!b) return;
      $$('button[data-v]', box).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      opt[box.dataset.f] = box.dataset.f === 'n' ? +b.dataset.v : b.dataset.v;
      refresh();
    }));
    $('#q-ch').addEventListener('change', e => { opt.ch = e.target.value; refresh(); });
    refresh();
    $('#q-go').addEventListener('click', () => {
      const pool = drawBag('q:' + opt.mode + ':' + opt.ch, SRC[opt.mode]().filter(q => opt.ch === 'tots' || q.c === +opt.ch), opt.n, q => q.q || q.t);
      if (!pool.length) { alert('No hi ha preguntes d\'aquest tipus per a aquest capítol.'); return; }
      startQuiz(opt, pool, false);
    });
  }
  function askQ() {
    const q = Q.pool[Q.i], mc = Q.opt.mode === 'mc';
    Q.run.t0 = Date.now();
    const opts = mc ? shuffle(q.o.map((t, j) => ({ t, ok: j === 0 }))) : [{ t: 'Vertader', ok: q.v }, { t: 'Fals', ok: !q.v }];
    $('#quiz').innerHTML = `<div class="qbar"><span style="width:${Q.i / Q.pool.length * 100}%"></span></div>
      <div class="card q-card">
        <div class="q-meta"><span>${Q.review ? 'Repàs d\'errors · ' : ''}Pregunta ${Q.i + 1} de ${Q.pool.length}</span><span>Encerts: ${Q.ok}</span></div>
        <div class="q-text">${mc ? esc(q.q) : '«' + esc(q.t) + '»'}</div>
        <div class="${mc ? 'opts' : 'tf'}">${opts.map((o, j) => `<button class="opt" type="button" data-j="${j}">${mc ? `<span class="l">${'ABCD'[j]}</span>` : ''}<span>${esc(o.t)}</span></button>`).join('')}</div>
        <div id="q-exp" aria-live="polite"></div>
      </div>
      <p style="text-align:center;margin-top:14px"><button class="btn small" id="q-quit" type="button">Surt del test</button></p>`;
    $('#q-quit').addEventListener('click', quizSetup);
    $$('#quiz .opt').forEach(b => b.addEventListener('click', () => {
      const j = +b.dataset.j, right = opts[j].ok;
      $$('#quiz .opt').forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add('right'); });
      if (!right) { b.classList.add('wrong'); Q.wrong.push(q); runMiss(Q.run); } else { Q.ok++; runHit(Q.run); }
      noteAnswer(Q.opt.mode, q, right);
      const last = Q.i === Q.pool.length - 1;
      const extra = Q.review && right ? ' <span class="muted">Surt de la llista d\'errors.</span>' : !right ? ' <span class="muted">S\'afegeix a la llista d\'errors per repassar-la.</span>' : '';
      $('#q-exp').innerHTML = `<div class="explain"><b class="${right ? 'ok' : 'bad'}">${right ? '✓ Correcte!' : '✗ No és correcte.'}</b> ${esc(q.e)}<br>${secLink(q.s)}${extra}</div>
        <p style="text-align:right;margin:14px 0 0"><button class="btn primary" id="q-next" type="button">${last ? 'Veure resultat' : 'Següent →'}</button></p>`;
      $('#q-next').focus();
      $('#q-next').addEventListener('click', () => { Q.i++; Q.i < Q.pool.length ? askQ() : endQ(); });
    }));
  }
  function endQ() {
    const pct = Math.round(Q.ok / Q.pool.length * 100);
    let rec = false;
    if (!Q.review) {
      const best = get('best', {}), key = Q.opt.mode + ':' + Q.opt.ch;
      rec = best[key] == null || pct > best[key];
      if (rec) { best[key] = pct; set('best', best); }
    }
    const left = errPool(Q.opt.mode).length;
    const msg = Q.review ? (left ? `Encara et queden ${left} per repassar.` : 'Has buidat la llista d\'errors!')
      : pct >= 90 ? 'Excel·lent!' : pct >= 70 ? 'Molt bé!' : pct >= 50 ? 'Aprovat, però repassa els errors.' : 'Toca repassar la teoria.';
    $('#quiz').innerHTML = `<div class="card score"><div class="big">${pct}%</div><p><b>${Q.ok} de ${Q.pool.length}</b> encerts · ${msg}${rec ? ' · Nou rècord!' : ''}</p>
      ${Q.wrong.length ? `<div class="review"><h3>Repassa aquestes:</h3><ul>${Q.wrong.map(q => `<li><b>${esc(qKey(q))}</b><br>${esc(q.e)} ${secLink(q.s)}</li>`).join('')}</ul></div>` : ''}
      ${Q.review ? '' : rankBlock('test-' + Q.opt.mode, Q.run, Q.ok, Q.pool.length)}
      <div class="score-actions">
        ${left ? `<button class="btn primary" type="button" data-review="${Q.opt.mode}">Repassa els errors (${left})</button>` : ''}
        <button class="btn${left ? '' : ' primary'}" id="q-again" type="button">Un altre test</button>
      </div></div>`;
    $('#q-again').addEventListener('click', quizSetup);
  }

  // ================= CLASSIFICA =================
  const GK = [{ k: 1, n: 'Moneres' }, { k: 2, n: 'Protoctists' }, { k: 3, n: 'Fongs' }, { k: 4, n: 'Plantes' }, { k: 5, n: 'Animals' }, { k: 0, n: 'Cap regne (no cel·lular)' }];
  let G = null;
  function initClassifica() {
    G = { list: drawBag('org', D.organismes, 12, o => o.n), i: 0, ok: 0, done: 0, streak: 0, best: get('streak', 0), run: newRun() };
    $('#g-choices').innerHTML = GK.map(x => `<button class="kchoice" type="button" data-k="${x.k}" style="--kc:${x.k ? `var(--k${x.k})` : 'var(--k8)'}">${x.n}</button>`).join('');
    $('#g-choices').addEventListener('click', e => { const b = e.target.closest('.kchoice'); if (b && !b.disabled) answerG(+b.dataset.k); });
    showOrg();
  }
  function gStats() { $('#g-stats').innerHTML = `<span>${ICON('tick')} ${G.ok} / ${G.done}</span><span>${ICON('flame')} Ratxa: ${G.streak}</span><span>${ICON('trophy')} Millor ratxa: ${G.best}</span><span>${G.i + 1 > G.list.length ? G.list.length : G.i + 1} de ${G.list.length}</span>`; }
  function showOrg() {
    if (G.i >= G.list.length) {
      $('#g-card').innerHTML = `<div class="name">Partida acabada!</div><p>Has encertat <b>${G.ok} de ${G.list.length}</b>.</p>${rankBlock('classifica', G.run, G.ok, G.list.length)}<button class="btn primary" id="g-again" type="button">Torna a jugar</button>`;
      $('#g-choices').hidden = true; $('#g-fb').innerHTML = '';
      $('#g-again').addEventListener('click', () => { G = { list: drawBag('org', D.organismes, 12, o => o.n), i: 0, ok: 0, done: 0, streak: 0, best: get('streak', 0), run: newRun() }; $('#g-choices').hidden = false; showOrg(); });
      gStats(); return;
    }
    const o = G.list[G.i];
    G.run.t0 = Date.now();
    $('#g-card').innerHTML = `<div class="muted">Organisme</div><div class="name">${esc(o.n)}</div>${o.sci && o.sci !== '—' ? `<div class="sci">${esc(o.sci)}</div>` : ''}<div class="clue">${ICON('bulb')} ${esc(o.p)}</div>`;
    $$('.kchoice').forEach(b => { b.disabled = false; b.classList.remove('right', 'wrong'); });
    $('#g-fb').innerHTML = '';
    gStats();
  }
  function answerG(k) {
    const o = G.list[G.i], ok = k === o.k;
    G.done++;
    if (ok) { G.ok++; G.streak++; runHit(G.run); if (G.streak > G.best) { G.best = G.streak; set('streak', G.best); } } else { G.streak = 0; runMiss(G.run); }
    $$('.kchoice').forEach(b => { b.disabled = true; if (+b.dataset.k === o.k) b.classList.add('right'); else if (+b.dataset.k === k) b.classList.add('wrong'); });
    $('#g-fb').innerHTML = `<div class="explain" style="margin-top:14px"><b class="${ok ? 'ok' : 'bad'}">${ok ? '✓ Correcte!' : '✗ No.'}</b> ${esc(o.e)} ${secLink(o.s)}
      <p style="text-align:right;margin:10px 0 0"><button class="btn primary" id="g-next" type="button">Següent →</button></p></div>`;
    $('#g-next').focus();
    $('#g-next').addEventListener('click', () => { G.i++; showOrg(); });
    gStats();
  }

  // ================= GLOSSARI =================
  function initGlossari() {
    const render = q => {
      const nq = norm(q.trim());
      const hl = s => { if (!nq) return s; const ns = norm(s); let out = '', i = 0, p; while ((p = ns.indexOf(nq, i)) !== -1) { out += s.slice(i, p) + '<mark>' + s.slice(p, p + nq.length) + '</mark>'; i = p + nq.length; } return out + s.slice(i); };
      const items = GLOSS.filter(g => !nq || norm(g.term + ' ' + g.def).includes(nq));
      $('#gloss').innerHTML = items.length ? items.map(g => {
        if (!g.where.length) return `<article class="card gterm"><h3>${hl(esc(g.term))}</h3><p>${hl(esc(g.plain))}</p></article>`;
        const w = g.where, n = w.length;
        let chips = `<button type="button" data-ch="${w[0].c}" style="--kc:${kc(w[0].c)}">${w[0].c}. ${D.capitols[w[0].c].curt}</button>`;
        if (n > 1) {
          chips += `<button type="button" class="more" aria-expanded="false" aria-label="Mostra ${n - 1} capítols més">+${n - 1}</button>`;
          for (let i = 1; i < n; i++) chips += `<button type="button" data-ch="${w[i].c}" style="--kc:${kc(w[i].c)}" hidden>${w[i].c}. ${D.capitols[w[i].c].curt}</button>`;
        }
        return `<article class="card gterm"><h3>${hl(esc(g.term))}</h3><p>${hl(esc(g.plain))}</p>
          <div class="where">Sobretot a: ${chips}</div></article>`;
      }).join('')
        : '<p class="empty">Cap terme coincideix amb la cerca.</p>';
    };
    $('#g-search').addEventListener('input', e => render(e.target.value));
    $('#gloss').addEventListener('click', e => {
      const more = e.target.closest('.more');
      if (more) { more.setAttribute('aria-expanded', 'true'); more.parentElement.querySelectorAll('button[hidden]').forEach(b => b.removeAttribute('hidden')); more.remove(); return; }
      const b = e.target.closest('[data-ch]'); if (b) location.hash = `teoria/${b.dataset.ch}`;
    });
    render('');
  }

  // ================= PROGRÉS =================
  // Pestanya «Progrés»: tot el progrés del tema en un sol lloc (es repinta cada vegada que s'obre)
  function renderProgres() {
    const done = new Set(get('done', []));
    const known = new Set(get('known', []));
    const best = get('best', {});
    const errs = get('errs', {});
    const nErrs = (errs.mc || []).length + (errs.tf || []).length;
    const study = CH.filter(c => c.num !== 8);
    const total = study.reduce((n, c) => n + c.sections.length, 0);
    const nDone = study.reduce((n, c) => n + c.sections.filter(x => done.has(x.id)).length, 0);
    const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
    const sc = v => Number.isFinite(+v) && v !== null && v !== '' ? Math.round(+v) + '%' : '<span class="muted">—</span>';
    const rows = study.map(c => {
      const d = c.sections.filter(x => done.has(x.id)).length, p = pct(d, c.sections.length);
      return '<tr><td><a href="#teoria/' + c.num + '">' + c.num + '. ' + esc(D.capitols[c.num].curt) + '</a></td>' +
        '<td data-label="Teoria"><div class="prog-cell"><div class="progress" role="progressbar" aria-label="Teoria del capítol ' + c.num + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><span style="width:' + p + '%"></span></div><span>' + p + '%</span></div></td>' +
        '<td data-label="Millor test">' + sc(best['mc:' + c.num]) + '</td><td data-label="Millor mites">' + sc(best['tf:' + c.num]) + '</td></tr>';
    }).join('');
    // Punts febles: capítols on més convé insistir (teoria, millor test, errors i targetes pendents)
    const errAll = [...errPool('mc'), ...errPool('tf')];
    const weak = study.filter(c => c.num <= 6).map(c => {
      const tp = pct(c.sections.filter(x => done.has(x.id)).length, c.sections.length);
      const b = best['mc:' + c.num], nErr = errAll.filter(q => q.c === c.num).length;
      const nPend = GLOSS.filter(g => g.main === c.num && !known.has(g.term)).length;
      const why = [];
      if (tp < 50) why.push('Teoria al ' + tp + '%');
      if (b == null) why.push('Test sense fer'); else if (b < 70) why.push('Millor test: ' + Math.round(b) + '%');
      if (nErr) why.push(nErr + (nErr === 1 ? ' error' : ' errors') + ' per repassar');
      if (nPend) why.push(nPend + (nPend === 1 ? ' targeta pendent' : ' targetes pendents'));
      return { c, why, w: (100 - tp) / 2 + (b == null ? 40 : 100 - b) + nErr * 10 + nPend * 2 };
    }).filter(x => x.why.length).sort((a, z) => z.w - a.w).slice(0, 3);
    const started = nDone > 0 || Object.keys(best).length > 0;
    const weakHTML = '<h2 class="section-title">Els teus punts febles</h2>' + (!started
      ? '<p class="card empty">Quan hagis estudiat una mica i fet algun test, aquí veuràs quins capítols et convé reforçar.</p>'
      : weak.length ? '<div class="weak-list">' + weak.map(x => '<div class="card weak" style="--kc:' + kc(x.c.num) + '"><h3>' + x.c.num + '. ' + esc(D.capitols[x.c.num].curt) + '</h3><ul class="weak-why">' + x.why.map(t => '<li>' + t + '</li>').join('') + '</ul><div class="weak-btns"><button class="btn primary small" type="button" data-quiz="mc" data-ch="' + x.c.num + '">Practica el test</button><a class="btn small" href="#teoria/' + x.c.num + '">Repassa la teoria</a></div></div>').join('') + '</div>'
      : '<p class="card empty">Cap punt feble ara mateix. Molt bé!</p>');
    $('#v-progres').innerHTML =
      '<div class="view-head"><h1>El meu progrés</h1><p>Un resum de tot el que has fet en aquest tema.</p></div>' +
      '<div class="stats">' +
        '<div class="card stat"><b>' + pct(nDone, total) + '%</b><span>Teoria estudiada<br>' + nDone + ' de ' + total + ' apartats</span></div>' +
        '<div class="card stat"><b>' + known.size + '</b><span>Targetes que saps<br>de ' + GLOSS.length + ' termes</span></div>' +
        '<div class="card stat"><b>' + nErrs + '</b><span>Errors per repassar' + (nErrs ? '<br><a href="#test">Repassa\'ls →</a>' : '') + '</span></div>' +
        '<div class="card stat"><b>' + (Math.round(+get('streak', 0)) || 0) + '</b><span>Millor ratxa<br>al joc Classifica</span></div>' +
      '</div>' +
      weakHTML + '<h2 class="section-title">Per capítols</h2>' +
      '<div class="table-wrap"><table class="study-table prog-table"><thead><tr><th scope="col">Capítol</th><th scope="col">Teoria</th><th scope="col">Millor test</th><th scope="col">Millor mites</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="muted">Millor test general: ' + sc(best['mc:tots']) + ' · Millor mites general: ' + sc(best['tf:tots']) + '</p>';
    $('#v-progres').insertAdjacentHTML('beforeend', rankingSection());
  }

  // ================= RESUM PER IMPRIMIR =================
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-print')) {
      e.preventDefault();
      const area = $('#print-area');
      const today = new Date().toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' });
      let html = `<h1>Resum — Els cinc regnes dels éssers vius · ${today}</h1>`;
      for (let n = 0; n <= 6; n++) {
        const curt = (D.capitols[n] || {}).curt || `Capítol ${n}`;
        html += `<h2>Capítol ${n}. ${esc(curt)}</h2>`;
        if (D.idees[n]) {
          html += `<ul>${D.idees[n].map(x => `<li>${x}</li>`).join('')}</ul>`;
        }
      }
      const c6 = chap(6);
      if (c6 && c6.sections.length) {
        html += `<h2>Taules comparatives</h2>`;
        c6.sections.forEach(s => {
          html += `<h3>${esc(s.num)} ${esc(s.title)}</h3><div class="prose">${blocks(s.lines)}</div>`;
        });
      }
      if (GLOSS && GLOSS.length) {
        html += `<h2>Glossari</h2><dl>${GLOSS.map(g => `<dt><b>${esc(g.term)}</b></dt><dd>${inline(g.def)}</dd>`).join('')}</dl>`;
      }
      area.innerHTML = html;
      area.setAttribute('aria-hidden', 'false');
      window.print();
    }
  });
  // Després d'imprimir, buida el resum perquè no quedi amagat dins la pàgina
  window.addEventListener('afterprint', () => { const area = $('#print-area'); if (area) { area.innerHTML = ''; area.setAttribute('aria-hidden', 'true'); } });

  const INIT = { teoria: initTeoria, cellula: initCellula, comparar: initComparar, targetes: initTargetes, test: initTest, classifica: initClassifica, glossari: initGlossari, progres: renderProgres };
  route();
})();
