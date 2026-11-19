// Prototip «L'arbre de la vida»: els mateixos organismes ordenats segons els cinc regnes clàssics o segons la visió actual
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const ROW = 44, TOP = 26, LABEL = 178;
  const leaf = id => ({ id });
  const PROT = ['verdes', 'vermelles', 'brunes', 'diatomees', 'ciliats', 'apicomplexos', 'amebes', 'mixomicets', 'euglenes'];
  const TREES = {
    classic: { id: 'vida', c: [
      { id: 'moneres', c: [leaf('bacteris'), leaf('arqueus')] },
      { id: 'protoctists', c: PROT.map(leaf) },
      { id: 'regne-fongs', c: [leaf('fongs')] },
      { id: 'regne-plantes', c: [leaf('plantes')] },
      { id: 'regne-animals', c: [leaf('animals')] }] },
    actual: { id: 'vida', c: [
      { id: 'bacteria', c: [leaf('bacteris')] },
      { id: 'ae', c: [
        { id: 'archaea', c: [leaf('arqueus')] },
        { id: 'eukarya', c: [
          { id: 'archaeplastida', c: ['verdes', 'vermelles', 'plantes'].map(leaf) },
          { id: 'sar', c: ['brunes', 'diatomees', 'ciliats', 'apicomplexos'].map(leaf) },
          { id: 'amoebozoa', c: ['amebes', 'mixomicets'].map(leaf) },
          { id: 'opisthokonta', c: ['fongs', 'animals'].map(leaf) },
          { id: 'discoba', c: [leaf('euglenes')] }] }] }] }
  };
  const KN = { 1: 'Moneres', 2: 'Protoctists', 3: 'Fongs', 4: 'Plantes', 5: 'Animals' };
  // id: [nom, explicació, apartat de teoria, exemples, regne clàssic]
  const INFO = {
    vida: ['Éssers vius', 'Tots comparteixen cèl·lules, ADN, ribosomes i metabolisme. L\'arbre mostra hipòtesis de parentiu, no una escala de «progrés».', '0.6'],
    moneres: ['Moneres', 'Regne clàssic dels procariotes: bacteris i arqueus junts. Avui sabem que són dos llinatges molt diferents, per això no és un grup natural.', '1.1', '', 1],
    protoctists: ['Protoctists', 'El «calaix de sastre» dels eucariotes que no són plantes, fongs ni animals. A la visió actual, aquest color queda repartit per quatre branques diferents.', '2.1', '', 2],
    'regne-fongs': ['Fongs', 'Regne dels eucariotes heteròtrofs que s\'alimenten per absorció.', '3.1', '', 3],
    'regne-plantes': ['Plantes', 'Regne de les plantes terrestres fotosintètiques.', '4.1', '', 4],
    'regne-animals': ['Animals', 'Regne dels eucariotes pluricel·lulars heteròtrofs amb desenvolupament embrionari.', '5.1', '', 5],
    bacteria: ['Bacteria', 'Procariotes; la majoria tenen paret de peptidoglicà. Inclou els cianobacteris, que fan la fotosíntesi oxigènica.', '1.3'],
    ae: ['Arqueus + eucariotes', 'Moltes dades suggereixen que els eucariotes van sorgir d\'un llinatge relacionat amb els arqueus. La relació exacta encara s\'estudia.', '0.6'],
    archaea: ['Archaea', 'Procariotes amb membranes de lípids diferents dels bacteris; molts viuen en medis extrems, però no tots.', '1.4'],
    eukarya: ['Eukarya', 'Cèl·lules amb nucli i orgànuls. Els mitocondris provenen d\'un bacteri incorporat per endosimbiosi.', '0.6'],
    archaeplastida: ['Archaeplastida', 'Algues vermelles, algues verdes i plantes: tenen plastidis primaris, d\'origen cianobacterià.', '0.6'],
    sar: ['SAR', 'Supergrup molt divers: hi conviuen algues brunes i diatomees amb ciliats i apicomplexos.', '0.6'],
    amoebozoa: ['Amoebozoa', 'Moltes amebes i els mixomicets, que es mouen amb pseudopodis.', '2.7'],
    opisthokonta: ['Opisthokonta', 'Fongs i animals són més parents entre ells que no pas amb les plantes: els fongs no són «plantes sense clorofil·la».', '3.1'],
    discoba: ['Discoba', 'Flagel·lats com les euglenes i els tripanosomes. Un altre exemple que «protozous» i «algues» estan repartits per l\'arbre.', '2.5'],
    bacteris: ['Bacteris', 'Procariotes sense nucli, amb una gran diversitat metabòlica.', '1.3', 'Escherichia coli, Nostoc (cianobacteri)', 1],
    arqueus: ['Arqueus', 'Procariotes amb una bioquímica pròpia; tradicionalment, dins de les moneres.', '1.4', 'Halobacterium, arqueus metanògens', 1],
    verdes: ['Algues verdes', 'Fotosintètiques, amb clorofil·les a i b com les plantes.', '2.6', 'Chlamydomonas, Ulva (enciam de mar)', 2],
    vermelles: ['Algues vermelles', 'Fotosintètiques amb pigments vermells (ficobiliproteïnes).', '2.6', 'Porphyra (nori), Corallina', 2],
    brunes: ['Algues brunes', 'Grans algues marines pluricel·lulars amb fucoxantina.', '2.6', 'Fucus, Laminaria', 2],
    diatomees: ['Diatomees', 'Algues unicel·lulars amb una closca de sílice.', '2.6', 'Navicula', 2],
    ciliats: ['Ciliats', 'Es mouen amb cilis i tenen dos tipus de nucli.', '2.5', 'Paramecium', 2],
    apicomplexos: ['Apicomplexos', 'Paràsits amb un complex apical per entrar a les cèl·lules.', '2.5', 'Plasmodium (malària)', 2],
    amebes: ['Amebes', 'Es mouen i s\'alimenten amb pseudopodis.', '2.5', 'Amoeba proteus', 2],
    mixomicets: ['Mixomicets', 'Semblen fongs però no ho són: formen un plasmodi que es desplaça.', '2.7', 'Physarum', 2],
    euglenes: ['Euglenes i tripanosomes', 'Flagel·lats: n\'hi ha de fotosintètics i de paràsits.', '2.5', 'Euglena, Trypanosoma', 2],
    fongs: ['Fongs', 'Heteròtrofs per absorció, amb paret de quitina.', '3.1', 'Saccharomyces, Penicillium, Amanita', 3],
    plantes: ['Plantes terrestres', 'Pluricel·lulars fotosintètiques adaptades a viure fora de l\'aigua.', '4.1', 'molses, falgueres, pins, roselles', 4],
    animals: ['Animals', 'Pluricel·lulars heteròtrofs per ingestió.', '5.1', 'esponges, meduses, insectes, humans', 5]
  };
  const NOTA = {
    classic: 'Model de Whittaker (1969), el dels apunts: cinc regnes. Cada color és un regne.',
    actual: 'Visió actual: tres dominis i, dins dels eucariotes, grans supergrups. Els colors continuen sent els regnes clàssics: fixa\'t com el dels protoctists queda repartit per quatre branques.'
  };
  const LEAVES = new Set(['bacteris', 'arqueus', ...PROT, 'fongs', 'plantes', 'animals']);
  const svg = document.getElementById('arbre'), fitxa = document.getElementById('fitxa'), nota = document.getElementById('nota');
  const el = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const gLinks = el('g'), gNodes = el('g'), gLeaves = el('g');
  svg.append(gLinks, gNodes, gLeaves);
  const leafEls = {};
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'classic', sel = null, byId = {}, W = 0;

  // Posicions: les fulles en files; cada grup a mitja alçada dels seus fills
  function layout(tree) {
    const depth = n => n.c ? 1 + Math.max(...n.c.map(depth)) : 0;
    const lx = Math.max(150, W - LABEL), col = lx / depth(tree), all = [];
    let row = 0;
    (function walk(n, d, parent) {
      n.parent = parent; all.push(n);
      if (n.c) { n.c.forEach(ch => walk(ch, d + 1, n)); n.x = d * col + 10; n.y = (n.c[0].y + n.c[n.c.length - 1].y) / 2; }
      else { n.x = lx; n.y = TOP + row++ * ROW; }
    })(tree, 0, null);
    return { all, h: TOP * 2 + (row - 1) * ROW };
  }

  function render(animate) {
    W = svg.parentElement.clientWidth - 8;
    const { all, h } = layout(TREES[mode]);
    byId = Object.fromEntries(all.map(n => [n.id, n]));
    svg.setAttribute('viewBox', `0 0 ${W} ${h}`);
    svg.setAttribute('height', h);
    gLinks.replaceChildren(); gNodes.replaceChildren();
    for (const n of all) {
      if (n.parent) gLinks.append(el('path', { class: 'lk', 'data-id': n.id, d: `M${n.parent.x} ${n.parent.y}V${n.y}H${n.x}` }));
      if (n.c) {
        const g = el('g', { class: 'node', 'data-id': n.id, role: 'button', tabindex: 0, 'aria-label': INFO[n.id][0], transform: `translate(${n.x} ${n.y})` });
        const c = el('circle', { r: 6 });
        if (mode === 'classic' && INFO[n.id][4]) c.style.stroke = `var(--k${INFO[n.id][4]})`;
        g.append(c);
        if (n.id !== 'ae') {
          const t = el('text', n.parent ? { class: 'nlabel', x: -9, y: -8, 'text-anchor': 'end' } : { class: 'nlabel', x: 10, y: -10 });
          t.textContent = INFO[n.id][0];
          g.append(t);
        }
        gNodes.append(g);
        // Si l'etiqueta no hi cap a l'esquerra del node, la posem a la dreta
        const t = g.querySelector('text');
        if (t && n.parent && n.x - 9 - t.getComputedTextLength() < 2) { t.setAttribute('text-anchor', 'start'); t.setAttribute('x', 9); }
      } else {
        let g = leafEls[n.id];
        if (!g) {
          const [name, , , , k] = INFO[n.id];
          g = el('g', { class: 'leaf', 'data-id': n.id, role: 'button', tabindex: 0, 'aria-label': `${name} (regne clàssic: ${KN[k]})` });
          const t = el('text', { x: 14 }); t.textContent = name;
          g.append(el('rect', { class: 'hit', x: -12, y: -ROW / 2 + 2, width: LABEL, height: ROW - 4 }), el('circle', { r: 7, style: `fill:var(--k${k})` }), t);
          gLeaves.append(g); leafEls[n.id] = g;
        }
        g.style.transition = animate ? '' : 'none';
        g.style.transform = `translate(${n.x}px, ${n.y}px)`;
      }
    }
    if (!animate) { svg.getBoundingClientRect(); Object.values(leafEls).forEach(g => { g.style.transition = ''; }); }
    gLinks.classList.remove('fade'); gNodes.classList.remove('fade');
    if (animate) { svg.getBoundingClientRect(); gLinks.classList.add('fade'); gNodes.classList.add('fade'); }
    highlight();
  }

  // Ressalta el camí des de l'arrel fins al grup triat
  function highlight() {
    const chain = new Set();
    for (let n = byId[sel]; n; n = n.parent) chain.add(n.id);
    gLinks.querySelectorAll('.lk').forEach(p => p.classList.toggle('hl', chain.has(p.dataset.id)));
    svg.querySelectorAll('.node, .leaf').forEach(g => g.classList.toggle('sel', g.dataset.id === sel));
  }

  const chainIn = (n, id, acc = []) => {
    if (n.id === id) return acc;
    for (const ch of n.c || []) { const r = chainIn(ch, id, [...acc, n.id]); if (r) return r; }
    return null;
  };

  function show(id) {
    sel = id; highlight();
    const [name, txt, s, ex, k] = INFO[id];
    let tags = '';
    if (LEAVES.has(id)) {
      const actual = chainIn(TREES.actual, id).filter(x => x !== 'vida' && x !== 'ae').map(x => INFO[x][0]).join(' › ');
      tags = `<p class="tags"><span class="tag"><i style="background:var(--k${k})"></i>Clàssic: ${KN[k]}</span><span class="tag">Actual: ${actual}</span></p>`;
    }
    const [ch, sec] = s.split('.');
    fitxa.innerHTML = `<h2>${name}</h2>${tags}<p>${txt}</p>${ex ? `<p><b>Exemples:</b> ${ex}</p>` : ''}<p><a href="../tema-08/#teoria/${ch}/s${ch}-${sec}">Veure a la teoria §${s} →</a></p>`;
  }

  svg.addEventListener('click', e => { const g = e.target.closest('.node, .leaf'); if (g) show(g.dataset.id); });
  svg.addEventListener('keydown', e => {
    const g = e.target.closest('.node, .leaf');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(g.dataset.id); }
  });
  document.getElementById('modes').addEventListener('click', e => {
    const b = e.target.closest('[data-mode]');
    if (!b || b.dataset.mode === mode) return;
    mode = b.dataset.mode;
    document.querySelectorAll('#modes [data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    nota.textContent = NOTA[mode];
    render(!still.matches);
  });
  nota.textContent = NOTA[mode];
  render(false);
  new ResizeObserver(() => { if (svg.parentElement.clientWidth - 8 !== W) render(false); }).observe(svg.parentElement);
})();
