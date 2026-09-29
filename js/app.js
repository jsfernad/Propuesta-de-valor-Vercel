/* Propuesta de valor – Empresas SURA
 * Aplicación guiada (sin dependencias) basada en la metodología
 * "Propuesta de valor y Modelo de negocio" y el lienzo de Alex Osterwalder.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'pv-sura-v1';
  const MAX_SEGMENTOS = 5;
  const MAX_COMPETIDORES = 4;

  const STEPS = [
    { lbl: 'Inicio' },
    { lbl: 'Segmentos' },
    { lbl: 'Análisis del cliente' },
    { lbl: 'Motivadores' },
    { lbl: 'Competencia' },
    { lbl: 'Perfil del cliente' },
    { lbl: 'Propuesta de valor' },
    { lbl: 'Resumen' },
  ];

  // Aspectos del cliente (diapositiva 7), en el orden en que aparecen alrededor del cliente.
  const ASPECTOS = [
    {
      key: 'motivadores', lbl: 'Motivadores / Necesidades', color: 'teal',
      q: '¿Qué necesidades, expectativas o emociones tiene un cliente para adquirir lo que ofrezco?',
      ph: 'Escribe un elemento por línea. Ej:\nCuidar su familia.\nSentirse tranquila.',
    },
    {
      key: 'habitos', lbl: 'Hábitos de compra', color: 'navy',
      q: 'Frecuencia de uso o compra, qué compra, para qué lo usa o compra, formas de pago y cómo realiza la compra.',
      ph: 'Ej:\nCompran a través de internet, referidos o donde les genere confianza.\nComienzan con un producto para luego pensar en otras posibilidades.',
    },
    {
      key: 'digital', lbl: 'Comportamiento digital', lens: 'Comporta-miento digital', color: 'sky',
      q: '¿Utiliza los canales digitales para buscar lo que ofreces? ¿Qué medios digitales frecuenta? ¿Qué palabras clave usa? ¿Hay horarios, días o fechas puntuales en que busca información?',
      ph: 'Ej:\nSe informa a través de búsquedas en Google y redes sociales.\nLa principal red social que usa es Instagram.',
    },
    {
      key: 'costumbres', lbl: 'Costumbres, estilo de vida, personalidad', color: 'teal',
      q: 'Personas: gustos, hobbies, preferencias, actividades en su día a día. Empresa: cultura empresarial, valores, principios o lineamientos como organización.',
      ph: 'Ej:\nSon deportistas.\nSe autogestionan.\nLes gusta cuidarse.',
    },
    {
      key: 'inhibidores', lbl: 'Inhibidores', color: 'sky',
      q: '¿Cuáles son las barreras o limitaciones que impiden que se realice la compra?',
      ph: 'Ej:\nNo tener acceso a la salud.\nPerder su estilo de vida saludable.',
    },
    {
      key: 'socio', lbl: 'Sociodemográfico', lens: 'Socio-demográfico', color: 'navy',
      q: 'Persona: edad, nivel socioeconómico, género, estado civil, escolaridad… Empresa: cantidad de empleados, activos, ingresos, sector, subsector, especialidad, ciudad…',
      ph: 'Ej:\nMujeres.\nEntre 26 y 40 años.\nNSE medio alto.',
    },
  ];
  const ASPECTO_LBL = Object.fromEntries(ASPECTOS.map((a) => [a.key, a.lbl]));

  const ATRIBUTOS_COMUNES = [
    'Precio', 'Calidad', 'Cumplimiento en tiempos de entrega', 'Confianza en la marca',
    'Trayectoria de la empresa', 'Servicio y atención', 'Asesoría personalizada',
    'Disponibilidad / cobertura', 'Facilidad de pago', 'Variedad de portafolio',
    'Innovación', 'Canales digitales',
  ];

  // ---------- Estado ----------
  const uid = () => Math.random().toString(36).slice(2, 10);

  function fresh() {
    return {
      v: 1,
      step: 0,
      seg: 0,
      perfil: { nombre: '', correo: '', empresa: '', nit: '' },
      segmentos: Array.from({ length: MAX_SEGMENTOS }, () => ({ id: uid(), nombre: '', desc: '' })),
      data: {},
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.v === 1 ? s : null;
    } catch (e) {
      return null;
    }
  }

  let S = load() || fresh();
  let errors = {};
  let saveTimer = null;

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) { /* almacenamiento no disponible */ }
    }, 250);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) { /* almacenamiento no disponible */ }
  }
  window.addEventListener('pagehide', saveNow);

  function segData(id) {
    if (!S.data[id]) {
      S.data[id] = {
        aspectos: Object.fromEntries(ASPECTOS.map((a) => [a.key, ''])),
        motivadores: [],
        descartados: [],
        competidores: Array(MAX_COMPETIDORES).fill(''),
        evalN: 5,
        scores: {},
        perfil: { trabajos: [], frustraciones: [], beneficios: [], generado: false },
        mapa: { productos: [], aliviadores: [], creadores: [] },
      };
    }
    return S.data[id];
  }

  const activeSegs = () => S.segmentos.filter((s) => s.nombre.trim());
  function curSeg() {
    const a = activeSegs();
    if (S.seg >= a.length) S.seg = 0;
    return a[S.seg];
  }

  function resolve(path) {
    const parts = path.split('.');
    let o = S;
    if (parts[0] === '$') {
      o = segData(curSeg().id);
      parts.shift();
    }
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    return [o, parts[parts.length - 1]];
  }
  const getPath = (p) => { const [o, k] = resolve(p); return o[k]; };

  // ---------- Utilidades ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const lines = (t) => String(t || '').split('\n').map((l) => l.replace(/^\s*([-•▪*·]|\d+[.)])\s*/, '').trim()).filter(Boolean);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.\s]+$/g, '').trim();
  const filled = (items) => items.filter((i) => i.text.trim());

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---------- Validaciones ----------
  function nitDV(num) {
    const w = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    const d = num.split('').reverse();
    const s = d.reduce((acc, c, i) => acc + Number(c) * w[i], 0);
    const r = s % 11;
    return r > 1 ? 11 - r : r;
  }
  function nitError(v) {
    const m = String(v).replace(/[\s.]/g, '').match(/^(\d{5,15})(?:-(\d))?$/);
    if (!m) return 'Ingresa un NIT válido: solo números, opcionalmente con dígito de verificación (ej. 900123456-7).';
    if (m[2] !== undefined && nitDV(m[1]) !== Number(m[2])) return `El dígito de verificación no coincide (para ${m[1]} debería ser ${nitDV(m[1])}).`;
    return '';
  }
  function validateStep0() {
    const p = S.perfil;
    const e = {};
    if (!p.nombre.trim()) e.nombre = 'Escribe tu nombre.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.correo.trim())) e.correo = 'Escribe un correo electrónico válido.';
    if (!p.empresa.trim()) e.empresa = 'Escribe el nombre de tu empresa.';
    const n = nitError(p.nit);
    if (n) e.nit = n;
    return e;
  }
  const step0ok = () => Object.keys(validateStep0()).length === 0;
  const step1ok = () => activeSegs().length > 0;
  const canGo = (step) => step === 0 || (step === 1 ? step0ok() : step0ok() && step1ok());

  // Completitud por segmento y por paso (para indicadores).
  function segDone(step, id) {
    const d = segData(id);
    switch (step) {
      case 2: return ASPECTOS.some((a) => lines(d.aspectos[a.key]).length);
      case 3: return filled(d.motivadores).length > 0;
      case 4: return d.competidores.some((c) => c.trim()) && Object.keys(d.scores).length > 0;
      case 5: return d.perfil.generado;
      case 6: return filled(d.mapa.productos).length > 0;
      default: return false;
    }
  }
  function stepDone(step) {
    if (step === 0) return step0ok();
    if (step === 1) return step1ok();
    if (step === 7) return false;
    const segs = activeSegs();
    return segs.length > 0 && segs.every((s) => segDone(step, s.id));
  }

  // ---------- Lógica de motivadores (paso 3) ----------
  function syncMotivadores(id) {
    const d = segData(id);
    const fromAnalisis = lines(d.aspectos.motivadores);
    const keys = new Set(fromAnalisis.map(norm));
    const descartados = new Set(d.descartados);
    // Quitar automáticos que ya no existen en el análisis
    d.motivadores = d.motivadores.filter((m) => !m.auto || keys.has(norm(m.text)));
    const present = new Set(d.motivadores.map((m) => norm(m.text)));
    fromAnalisis.forEach((t) => {
      const k = norm(t);
      if (!present.has(k) && !descartados.has(k)) {
        d.motivadores.push({ id: uid(), text: t, src: 'Motivadores', auto: true });
        present.add(k);
      }
    });
  }

  // ---------- Evaluación (paso 4) ----------
  function evalRows(id) {
    const d = segData(id);
    const rows = d.competidores
      .map((c, i) => ({ key: 'c' + i, name: c.trim(), empresa: false }))
      .filter((r) => r.name);
    rows.push({ key: 'emp', name: S.perfil.empresa.trim() || 'Mi empresa', empresa: true });
    return rows;
  }
  function evalCols(id) {
    const d = segData(id);
    const all = filled(d.motivadores);
    return d.evalN === 'all' ? all : all.slice(0, d.evalN);
  }
  const score = (d, rowKey, colId) => d.scores[rowKey + '|' + colId] || 0;

  function analisisAtributos(id) {
    const d = segData(id);
    const rows = evalRows(id);
    const comps = rows.filter((r) => !r.empresa);
    return evalCols(id).map((c, idx) => {
      const emp = score(d, 'emp', c.id);
      const compScores = comps.map((r) => ({ name: r.name, v: score(d, r.key, c.id) })).filter((x) => x.v);
      const best = compScores.reduce((b, x) => (x.v > (b ? b.v : 0) ? x : b), null);
      return { col: c, prioridad: idx + 1, emp, best, compScores };
    });
  }

  // ---------- Extracción del perfil del cliente (paso 5) ----------
  function generarPerfil(id) {
    const d = segData(id);
    const A = (k) => lines(d.aspectos[k]);
    const keepManual = (arr) => arr.filter((x) => !x.auto);
    const mk = (text, src) => ({ id: uid(), text, src, auto: true });
    const dedupe = (arr) => {
      const seen = new Set();
      return arr.filter((x) => { const k = norm(x.text); if (seen.has(k)) return false; seen.add(k); return true; });
    };

    // Trabajos del cliente: lo que busca resolver (funcional, social o emocional).
    const trabajos = [
      ...A('motivadores').map((t) => mk(t, 'Motivadores / Necesidades')),
      ...A('costumbres').map((t) => mk(t, 'Estilo de vida')),
    ];

    // Frustraciones: barreras + brechas detectadas frente a la competencia.
    const frustraciones = A('inhibidores').map((t) => mk(t, 'Inhibidores'));
    analisisAtributos(id).forEach((a) => {
      const t = a.col.text;
      if (a.emp && a.best && a.emp < a.best.v) {
        frustraciones.push(mk(`No recibir el nivel esperado en «${t}» (empresa ${a.emp}/5 vs. ${a.best.name} ${a.best.v}/5)`, `Competencia · prioridad #${a.prioridad}`));
      } else if (a.emp && a.emp <= 2) {
        frustraciones.push(mk(`Bajo cumplimiento en «${t}» (empresa ${a.emp}/5)`, `Competencia · prioridad #${a.prioridad}`));
      }
      const all = [a.emp, ...a.compScores.map((x) => x.v)].filter(Boolean);
      if (all.length > 1 && Math.max(...all) <= 3) {
        frustraciones.push(mk(`Nadie en el mercado cumple bien «${t}» (máx. ${Math.max(...all)}/5)`, `Oportunidad · prioridad #${a.prioridad}`));
      }
    });

    // Beneficios: lo que el cliente espera obtener, según la priorización.
    const beneficios = [
      ...filled(d.motivadores).slice(0, 5).map((m, i) => mk(m.text, `Prioridad #${i + 1}`)),
      ...A('habitos').map((t) => mk(t, 'Hábitos de compra')),
      ...A('digital').map((t) => mk(t, 'Comportamiento digital')),
    ];

    d.perfil.trabajos = dedupe([...keepManual(d.perfil.trabajos), ...trabajos]);
    d.perfil.frustraciones = dedupe([...keepManual(d.perfil.frustraciones), ...frustraciones]);
    d.perfil.beneficios = dedupe([...keepManual(d.perfil.beneficios), ...beneficios]);
    d.perfil.generado = true;
    save();
  }

  // ---------- Componentes ----------
  function listEditor(path, items, o = {}) {
    const rows = items.length
      ? items.map((it, i) => `
        <div class="list-item ${o.ranked && i < 5 ? 'top' : ''}" ${o.ranked ? 'data-draggable' : ''} data-path="${path}" data-idx="${i}">
          ${o.ranked ? '<span class="drag" title="Arrastra para reordenar" aria-hidden="true">⋮⋮</span>' : ''}
          ${o.ranked ? `<span class="rank" title="Prioridad">${i + 1}</span>` : ''}
          <input type="text" data-bind="${path}.${i}.text" data-list-input="${path}" data-idx="${i}"
            value="${esc(it.text)}" placeholder="${esc(o.placeholder || 'Escribe aquí…')}" aria-label="${esc((o.label || 'Elemento') + ' ' + (i + 1))}" />
          ${it.src ? `<span class="src" title="Fuente">${esc(it.src)}</span>` : ''}
          ${o.refs ? `<select data-bind="${path}.${i}.ref" data-rerender aria-label="${esc(o.refLabel)}">
              <option value="">${esc(o.refLabel)}…</option>
              ${o.refs.map((r) => `<option value="${r.id}" ${r.id === it.ref ? 'selected' : ''}>${esc(trunc(r.text, 60))}</option>`).join('')}
            </select>` : ''}
          ${o.ranked ? `
            <button class="icon-btn" data-action="move" data-path="${path}" data-idx="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir prioridad">↑</button>
            <button class="icon-btn" data-action="move" data-path="${path}" data-idx="${i}" data-dir="1" ${i === items.length - 1 ? 'disabled' : ''} aria-label="Bajar prioridad">↓</button>` : ''}
          <button class="icon-btn del" data-action="del-item" data-path="${path}" data-idx="${i}" aria-label="Eliminar">✕</button>
        </div>`).join('')
      : `<div class="empty">${esc(o.empty || 'Aún no hay elementos.')}</div>`;
    return `<div class="list">${rows}</div>
      <button class="btn ghost small" data-action="add-item" data-path="${path}">+ Agregar</button>`;
  }

  function segTabs(step) {
    const segs = activeSegs();
    if (segs.length < 2) return `<p class="muted">Segmento: <b>${esc(segs[0].nombre)}</b></p>`;
    return `<div class="seg-tabs" role="tablist" aria-label="Segmentos de cliente">
      ${segs.map((s, i) => `<button role="tab" aria-selected="${i === S.seg}" class="${i === S.seg ? 'active' : ''}" data-action="seg" data-idx="${i}">
        <span class="dot ${segDone(step, s.id) ? 'ok' : ''}"></span>${esc(s.nombre)}</button>`).join('')}
    </div>`;
  }

  function navActions(opts = {}) {
    const segs = activeSegs();
    const perSeg = opts.perSeg && segs.length > 1;
    const lastSeg = S.seg >= segs.length - 1;
    const nextLbl = perSeg && !lastSeg ? `Siguiente segmento: ${esc(trunc(segs[S.seg + 1].nombre, 28))} →` : (opts.nextLbl || 'Continuar →');
    return `<div class="nav-actions">
      ${S.step > 0 ? `<button class="btn secondary" data-action="prev">← Anterior</button>` : '<span></span>'}
      ${S.step < STEPS.length - 1 ? `<button class="btn" data-action="${perSeg && !lastSeg ? 'next-seg' : 'next'}">${nextLbl}</button>` : ''}
    </div>`;
  }

  function field(path, label, type = 'text', ph = '') {
    const key = path.split('.').pop();
    const err = errors[key];
    return `<label class="field"><span>${label}</span>
      <input type="${type}" data-bind="${path}" value="${esc(getPath(path))}" placeholder="${esc(ph)}"
        class="${err ? 'invalid' : ''}" aria-invalid="${!!err}" ${type === 'email' ? 'autocomplete="email"' : ''} />
      <div class="err" data-err="${key}">${err ? esc(err) : ''}</div></label>`;
  }

  // ---------- Pasos ----------
  function viewInicio() {
    return `
      <section class="hero big">
        <div>
          <span class="eyebrow">Mercado – Empresas SURA</span>
          <h1>Propuesta de valor<br/>y Modelo de negocio</h1>
          <p class="lead">Una guía paso a paso para conocer a tus clientes, compararte con tu competencia y diseñar tu propuesta de valor con el lienzo de Alex Osterwalder.</p>
          <p class="muted">Empresas SURA propone una serie de herramientas relevantes para que las empresas trasciendan a una observación estructurada del entorno.</p>
        </div>
        <img src="img/portada.png" alt="Ilustración de personas con formas geométricas" />
      </section>
      <div class="card">
        <h2>Cuéntanos sobre ti</h2>
        <div class="grid-2">
          ${field('perfil.nombre', 'Nombre completo', 'text', 'Ej: María Pérez')}
          ${field('perfil.correo', 'Correo electrónico', 'email', 'nombre@empresa.com')}
          ${field('perfil.empresa', 'Nombre de la empresa', 'text', 'Ej: Soluciones ABC S.A.S.')}
          ${field('perfil.nit', 'NIT', 'text', 'Ej: 900123456-7')}
        </div>
      </div>
      <div class="card info">
        <h3>¿Cómo funciona?</h3>
        <div class="grid-3">
          <div><b>Análisis del cliente</b><p class="muted">Segmentos, aspectos del cliente, motivadores y evaluación frente a la competencia.</p></div>
          <div><b>Observar</b><p class="muted">Extraemos los trabajos, frustraciones y beneficios de cada segmento.</p></div>
          <div><b>Diseñar</b><p class="muted">Construyes productos y servicios, aliviadores de frustraciones y creadores de alegrías.</p></div>
        </div>
      </div>
      ${navActions({ nextLbl: 'Comenzar →' })}`;
  }

  function viewSegmentos() {
    return `
      <section class="hero">
        <div>
          <span class="eyebrow">Paso 1 · Análisis del cliente</span>
          <h2>¿Qué segmentos de clientes tienes?</h2>
          <p class="lead">Segmentar es agrupar y clasificar tu mercado o cartera en grupos más pequeños de clientes que comparten características o comportamientos comunes, para aplicarles estrategias o propuestas diferenciadas.</p>
          <p class="muted">Tipos de variables: duras o descriptivas, psicográficas y de comportamiento.</p>
        </div>
        <img src="img/ciclista.png" alt="Ilustración de un ciclista" />
      </section>
      <div class="card">
        <h3>Escribe hasta ${MAX_SEGMENTOS} segmentos</h3>
        <p class="hint">Solo el nombre es obligatorio. Los segmentos vacíos se ignoran.</p>
        ${S.segmentos.map((s, i) => `
          <div class="seg-row">
            <div class="seg-num">${i + 1}</div>
            <label class="field"><span class="sr-only">Nombre del segmento ${i + 1}</span>
              <input type="text" data-bind="segmentos.${i}.nombre" value="${esc(s.nombre)}" placeholder="Nombre del segmento ${i + 1}" /></label>
            <label class="field seg-desc"><span class="sr-only">Descripción del segmento ${i + 1}</span>
              <input type="text" data-bind="segmentos.${i}.desc" value="${esc(s.desc)}" placeholder="Descripción breve (opcional)" /></label>
          </div>`).join('')}
        <div class="err">${errors.segmentos ? esc(errors.segmentos) : ''}</div>
      </div>
      <div class="grid-2">
        <div class="card info">
          <h3>Preguntas básicas para segmentar</h3>
          <ul>
            <li>¿Hoy todos nuestros clientes nos compran bajo la misma motivación? (inversión, necesidad primaria, placer, impulso…)</li>
            <li>¿La atención a nuestros clientes es diferencial por volúmenes de compra, frecuencia o antigüedad?</li>
            <li>¿Mis clientes, según su naturaleza, son abordados de forma diferente? (persona natural, tamaño o tipo de empresa)</li>
          </ul>
        </div>
        <div class="card outline">
          <h3>Ejemplos</h3>
          <p>Las empresas de bicicletas suelen segmentar a sus clientes según la actividad: deportes extremos, ciclismo o movilidad en la ciudad.</p>
          <p class="muted">Cinecolombia segmenta por frecuencia de compra y uso del servicio para crear estrategias de fidelización específicas.</p>
        </div>
      </div>
      ${navActions()}`;
  }

  function viewAnalisis() {
    const seg = curSeg();
    const d = segData(seg.id);
    return `
      <section class="hero">
        <div>
          <span class="eyebrow">Paso 2 · Cliente</span>
          <h2>Analiza cada segmento de cliente</h2>
          <p class="lead">Con base en los segmentos definidos, describe los aspectos de cada uno. Escribe un elemento por línea.</p>
          ${segTabs(2)}
          ${seg.desc ? `<p class="muted">${esc(seg.desc)}</p>` : ''}
        </div>
        <img src="img/persona.png" alt="Ilustración de una persona pensando" />
      </section>
      <div class="aspects">
        ${ASPECTOS.map((a) => `
          <div class="aspect">
            <div class="aspect-head">
              <div class="lens ${a.color}" aria-hidden="true"><span>${esc(a.lens || a.lbl)}</span></div>
              <p class="aspect-q">${esc(a.q)}</p>
            </div>
            <label class="sr-only" for="asp-${a.key}">${esc(a.lbl)}</label>
            <textarea id="asp-${a.key}" data-bind="$.aspectos.${a.key}" placeholder="${esc(a.ph)}">${esc(d.aspectos[a.key])}</textarea>
          </div>`).join('')}
      </div>
      <div class="card info sources" style="margin-top:18px">
        <b>*Fuentes de información:</b> conocimiento propio · sistemas de facturación · encuestas o conversaciones con clientes · análisis de redes sociales · bases de datos estructuradas · repositorio de PQRS.
      </div>
      ${navActions({ perSeg: true })}`;
  }

  function viewMotivadores() {
    const seg = curSeg();
    syncMotivadores(seg.id);
    const d = segData(seg.id);
    const present = new Set(d.motivadores.map((m) => norm(m.text)));
    const chipGroups = ASPECTOS.filter((a) => a.key !== 'motivadores')
      .map((a) => ({ a, items: lines(d.aspectos[a.key]).filter((t) => !present.has(norm(t))) }))
      .filter((g) => g.items.length);
    const comunes = ATRIBUTOS_COMUNES.filter((t) => !present.has(norm(t)));
    const descartados = d.descartados.filter((k) => lines(d.aspectos.motivadores).some((t) => norm(t) === k));
    const n = filled(d.motivadores).length;
    return `
      <section class="hero">
        <div>
          <span class="eyebrow">Paso 3 · Atributos relevantes</span>
          <h2>Separa y prioriza los motivadores</h2>
          <p class="lead">Lista los motivadores o atributos más importantes para tus clientes a la hora de comprar y ordénalos del más importante (1) al menos importante.</p>
          ${segTabs(3)}
        </div>
        <img src="img/cliente.png" alt="Ilustración de un cliente con audífonos" />
      </section>
      <div class="grid-2">
        <div class="card">
          <h3>Motivadores priorizados · ${esc(seg.nombre)}</h3>
          <p class="hint">Arrastra o usa las flechas para ordenar. Los 5 primeros se evalúan frente a la competencia en el paso siguiente. Se recomienda listar mínimo 10.</p>
          <div class="meter" aria-hidden="true"><div style="width:${Math.min(100, n * 10)}%"></div></div>
          <p class="hint" style="margin-bottom:12px">${n} de 10 atributos recomendados</p>
          ${listEditor('$.motivadores', d.motivadores, { ranked: true, label: 'Motivador', placeholder: 'Motivador o atributo', empty: 'Agrega motivadores desde el análisis o escríbelos aquí.' })}
          ${descartados.length ? `<p class="hint" style="margin-top:10px">${descartados.length} motivador(es) del análisis fueron retirados. <button class="btn ghost small" data-action="restore-desc">Restaurar</button></p>` : ''}
        </div>
        <div class="card info">
          <h3>Encontrados en tu análisis</h3>
          <p class="hint">Haz clic para añadir como motivador. Los <b>Motivadores / Necesidades</b> del paso 2 ya se incluyen automáticamente.</p>
          ${chipGroups.length ? chipGroups.map((g) => `
            <div class="chip-group"><h4>${esc(g.a.lbl)}</h4><div class="chips">
              ${g.items.map((t) => `<button class="chip" data-action="add-chip" data-text="${esc(t)}" data-src="${esc(g.a.lbl)}">+ ${esc(t)}</button>`).join('')}
            </div></div>`).join('') : '<p class="empty">No hay más elementos del análisis por agregar.</p>'}
          <div class="chip-group"><h4>Atributos comunes de la industria</h4><div class="chips">
            ${comunes.map((t) => `<button class="chip" data-action="add-chip" data-text="${esc(t)}" data-src="Industria">+ ${esc(t)}</button>`).join('')}
          </div></div>
          <p class="hint">Herramientas para obtener la información: encuesta digital, estudio de mercado, análisis de encuestas de satisfacción, criterios de evaluación de los clientes (B2B), observación y conocimiento propio.</p>
        </div>
      </div>
      ${navActions({ perSeg: true })}`;
  }

  function evalTable(id, readonly) {
    const d = segData(id);
    const rows = evalRows(id);
    const cols = evalCols(id);
    if (!cols.length) return '<p class="empty">Primero agrega motivadores en el paso 3.</p>';
    const cell = (r, c) => {
      const v = score(d, r.key, c.id);
      if (readonly) return `<td class="score ${v ? 's' + v : ''}"><b>${v || '–'}</b></td>`;
      return `<td class="score ${v ? 's' + v : ''}"><select data-bind="$.scores.${r.key}|${c.id}" data-num data-rerender aria-label="${esc(r.name)} – ${esc(c.text)}">
        <option value="">–</option>${[1, 2, 3, 4, 5].map((n) => `<option ${n === v ? 'selected' : ''}>${n}</option>`).join('')}</select></td>`;
    };
    const avg = (r) => {
      const vs = cols.map((c) => score(d, r.key, c.id)).filter(Boolean);
      return vs.length ? (vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(1) : '–';
    };
    const an = analisisAtributos(id);
    return `<div class="table-wrap"><table class="eval">
      <thead>
        <tr><th class="h-comp" rowspan="2">COMPETIDOR</th><th class="h-band" colspan="${cols.length + 1}">CALIFICACIÓN ATRIBUTOS COMPETENCIA Y COMPAÑÍA</th></tr>
        <tr>${cols.map((c, i) => `<th class="h-attr">${esc(c.text)}<small>Prioridad ${i + 1}</small></th>`).join('')}<th class="h-attr">Promedio</th></tr>
      </thead>
      <tbody>
        ${rows.map((r) => `<tr class="${r.empresa ? 'empresa' : ''}"><th class="row-h" scope="row">${esc(r.name)}${r.empresa ? ' <small>(tu empresa)</small>' : ''}</th>
          ${cols.map((c) => cell(r, c)).join('')}<td class="avg">${avg(r)}</td></tr>`).join('')}
        <tr class="gap"><th class="row-h" scope="row" style="background:transparent;font-size:12.5px">Brecha vs. mejor competidor</th>
          ${an.map((a) => {
            if (!a.emp || !a.best) return '<td class="muted">–</td>';
            const g = a.emp - a.best.v;
            return `<td class="${g >= 0 ? 'pos' : 'neg'}">${g > 0 ? '+' : ''}${g}</td>`;
          }).join('')}<td></td></tr>
      </tbody></table></div>`;
  }

  function viewCompetencia() {
    const seg = curSeg();
    const d = segData(seg.id);
    const total = filled(d.motivadores).length;
    return `
      <section class="hero">
        <div>
          <span class="eyebrow">Paso 4 · Análisis de atributos</span>
          <h2>Evaluación de atributos con los competidores</h2>
          <p class="lead">Identifica hasta ${MAX_COMPETIDORES} competidores en este segmento y evalúa, de 1 a 5 (5 es la mejor calificación), cómo cumplen cada motivador en orden de prioridad, frente a tu empresa.</p>
          ${segTabs(4)}
        </div>
        <img src="img/paracaidas.png" alt="Ilustración de una maleta con paracaídas" />
      </section>
      <div class="card">
        <h3>Competidores en «${esc(seg.nombre)}»</h3>
        <div class="comp-inputs">
          ${d.competidores.map((c, i) => `<label class="field"><span>Competidor ${i + 1}</span>
            <input type="text" data-bind="$.competidores.${i}" data-refresh value="${esc(c)}" placeholder="Nombre" /></label>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="inline-controls">
          <h3 style="margin:0">Calificación</h3>
          ${total > 5 ? `<div class="seg-toggle" role="group" aria-label="Motivadores a evaluar">
            <button class="${d.evalN === 5 ? 'on' : ''}" data-action="evalN" data-n="5">Top 5</button>
            <button class="${d.evalN === 'all' ? 'on' : ''}" data-action="evalN" data-n="all">Todos (${total})</button>
          </div>` : ''}
        </div>
        <div id="eval-table">${evalTable(seg.id)}</div>
        <p class="hint" style="margin-top:10px">Colores: <span class="src s1">1</span> <span class="src s2">2</span> <span class="src s3">3</span> <span class="src s4">4</span> <span class="src s5">5</span></p>
      </div>
      ${navActions({ perSeg: true })}`;
  }

  function viewPerfil() {
    const seg = curSeg();
    const d = segData(seg.id);
    if (!d.perfil.generado) generarPerfil(seg.id);
    return `
      <section class="hero">
        <div>
          <span class="eyebrow">Paso 5 · Observar</span>
          <h2>Perfil del cliente</h2>
          <p class="lead">Con base en el lienzo de propuesta de valor de Alex Osterwalder, extrajimos de los pasos 1 a 4 los trabajos, frustraciones y beneficios de este segmento. Revísalos, ajústalos y complétalos.</p>
          ${segTabs(5)}
        </div>
        <img src="img/lienzo-observar.png" alt="Perfil del cliente: beneficios, trabajos del cliente y frustraciones" />
      </section>
      <div class="inline-controls no-print">
        <button class="btn secondary small" data-action="regen">↻ Volver a extraer del análisis</button>
        <span class="hint">Conserva lo que agregaste manualmente y actualiza lo extraído.</span>
      </div>
      <div class="canvas-cols">
        <div class="canvas-box jobs">
          <h3><span class="ic">🏃</span>Trabajos del cliente</h3>
          <p class="q">Problemas, motivaciones y necesidades que hacen que el cliente recurra a la compra. ¿Qué busca resolver? (funcional, social o emocional)</p>
          ${listEditor('$.perfil.trabajos', d.perfil.trabajos, { label: 'Trabajo', placeholder: 'Trabajo del cliente' })}
        </div>
        <div class="canvas-box pains">
          <h3><span class="ic">⚠️</span>Frustraciones</h3>
          <p class="q">Problemas, aspectos no deseados, obstáculos o riesgos que sufre antes, durante y después de la compra.</p>
          ${listEditor('$.perfil.frustraciones', d.perfil.frustraciones, { label: 'Frustración', placeholder: 'Frustración' })}
        </div>
        <div class="canvas-box gains">
          <h3><span class="ic">🏆</span>Beneficios</h3>
          <p class="q">Beneficios y resultados positivos que obtiene el cliente (mínimos, esperados, deseados o inesperados).</p>
          ${listEditor('$.perfil.beneficios', d.perfil.beneficios, { label: 'Beneficio', placeholder: 'Beneficio' })}
        </div>
      </div>
      ${navActions({ perSeg: true })}`;
  }

  function coverage(id) {
    const d = segData(id);
    const mk = (items, refs) => filled(items).map((it) => ({ it, by: filled(refs).filter((r) => r.ref === it.id) }));
    return {
      trabajos: mk(d.perfil.trabajos, d.mapa.productos),
      frustraciones: mk(d.perfil.frustraciones, d.mapa.aliviadores),
      beneficios: mk(d.perfil.beneficios, d.mapa.creadores),
    };
  }

  function miniList(title, items, max = 5) {
    const f = filled(items);
    return `<div class="mini"><h5>${title}</h5><ul>
      ${f.slice(0, max).map((i) => `<li>${esc(trunc(i.text, 60))}</li>`).join('') || '<li class="more">—</li>'}
      ${f.length > max ? `<li class="more">+${f.length - max} más</li>` : ''}</ul></div>`;
  }

  function fitView(id) {
    const d = segData(id);
    const cov = coverage(id);
    const covList = (title, arr, verb) => `
      <div><h4 style="margin:0 0 6px;color:var(--navy)">${title} <span class="hint">(${arr.filter((x) => x.by.length).length}/${arr.length} atendidos)</span></h4>
      <ul class="cov-list">${arr.map((x) => `<li><span class="b ${x.by.length ? 'yes' : 'no'}">${x.by.length ? '✓' : 'Pendiente'}</span>
        <span>${esc(x.it.text)}${x.by.length ? `<span class="by">${verb}: ${x.by.map((b) => esc(b.text)).join(' · ')}</span>` : ''}</span></li>`).join('') || '<li class="empty">Sin elementos</li>'}</ul></div>`;
    return `
      <div class="fit">
        <div class="value-map" aria-label="Mapa de valor">
          <div class="vm-prod">${miniList('🎁 Productos y servicios', d.mapa.productos)}</div>
          <div class="vm-create">${miniList('Creadores de alegría', d.mapa.creadores, 4)}</div>
          <div class="vm-relief">${miniList('Aliviadores de frustraciones', d.mapa.aliviadores, 4)}</div>
        </div>
        <div class="arrow" aria-hidden="true">⇄</div>
        <div class="profile" aria-label="Perfil del cliente">
          <div class="pf-gains">${miniList('Beneficios', d.perfil.beneficios, 3)}</div>
          <div class="pf-pains">${miniList('Frustraciones', d.perfil.frustraciones, 3)}</div>
          <div class="pf-jobs">${miniList('Trabajos del cliente', d.perfil.trabajos, 5)}</div>
        </div>
      </div>
      <div class="coverage" style="margin-top:18px">
        ${covList('Frustraciones', cov.frustraciones, 'Aliviada por')}
        ${covList('Beneficios', cov.beneficios, 'Creada por')}
      </div>
      <div style="margin-top:16px">${covList('Trabajos del cliente', cov.trabajos, 'Resuelto por')}</div>`;
  }

  function viewPropuesta() {
    const seg = curSeg();
    const d = segData(seg.id);
    if (!d.perfil.generado) generarPerfil(seg.id);
    const an = analisisAtributos(seg.id).filter((a) => a.emp && a.best);
    const fort = an.filter((a) => a.emp >= a.best.v);
    const brech = an.filter((a) => a.emp < a.best.v);
    return `
      <section class="hero">
        <div>
          <span class="eyebrow">Paso 6 · Diseñar</span>
          <h2>Genera tu propuesta de valor</h2>
          <p class="lead">Con base en lo que aprecias del cliente, diseña tu mapa de valor. Los aliviadores y creadores de alegría deben responder directamente a las frustraciones y beneficios identificados.</p>
          ${segTabs(6)}
        </div>
        <img src="img/lienzo-disenar.png" alt="Mapa de valor: productos y servicios, aliviadores de frustraciones y creadores de alegría" />
      </section>
      ${an.length ? `<div class="card info">
        <h3>Lo que te dice la competencia</h3>
        <div class="grid-2">
          <div><b class="pos">Fortalezas</b> <span class="hint">(igualas o superas al mejor competidor)</span>
            <p>${fort.map((a) => esc(a.col.text)).join(' · ') || '<span class="muted">—</span>'}</p></div>
          <div><b class="neg">Brechas</b> <span class="hint">(el mejor competidor te supera)</span>
            <p>${brech.map((a) => `${esc(a.col.text)} (${a.emp} vs ${a.best.v})`).join(' · ') || '<span class="muted">—</span>'}</p></div>
        </div></div>` : ''}
      <div class="canvas-cols">
        <div class="canvas-box prod">
          <h3><span class="ic">🎁</span>Productos y servicios</h3>
          <p class="q">¿Qué ofreces? Nombra los productos o servicios que solucionan las necesidades que buscan los clientes.</p>
          ${listEditor('$.mapa.productos', d.mapa.productos, { label: 'Producto o servicio', placeholder: 'Producto o servicio', refs: filled(d.perfil.trabajos), refLabel: 'Trabajo que resuelve' })}
        </div>
        <div class="canvas-box relief">
          <h3><span class="ic">💊</span>Aliviadores de frustraciones</h3>
          <p class="q">¿Cómo alivian tus productos o servicios las frustraciones del cliente? Enfócate en las molestias para las que diseñas tu propuesta.</p>
          ${listEditor('$.mapa.aliviadores', d.mapa.aliviadores, { label: 'Aliviador', placeholder: 'Aliviador de frustración', refs: filled(d.perfil.frustraciones), refLabel: 'Frustración que alivia' })}
        </div>
        <div class="canvas-box create">
          <h3><span class="ic">✨</span>Creadores de alegría</h3>
          <p class="q">¿Qué creadores de alegrías brindas a tus clientes con tus productos o servicios?</p>
          ${listEditor('$.mapa.creadores', d.mapa.creadores, { label: 'Creador de alegría', placeholder: 'Creador de alegría', refs: filled(d.perfil.beneficios), refLabel: 'Beneficio que genera' })}
        </div>
      </div>
      <div class="card" style="margin-top:18px">
        <h3>Revisión o encaje</h3>
        <p class="hint">Conecta cada aliviador y creador de alegría con la frustración o beneficio que atiende para ver el encaje entre tu mapa de valor y el perfil del cliente.</p>
        <div id="fit-view">${fitView(seg.id)}</div>
      </div>
      ${navActions({ perSeg: true, nextLbl: 'Ver resumen →' })}`;
  }

  function viewResumen() {
    const p = S.perfil;
    const segs = activeSegs();
    const ul = (items) => {
      const f = Array.isArray(items) ? items : [];
      return f.length ? `<ul>${f.map((t) => `<li>${esc(typeof t === 'string' ? t : t.text)}</li>`).join('')}</ul>` : '<p class="muted">—</p>';
    };
    return `
      <section class="hero">
        <div>
          <span class="eyebrow">Resumen</span>
          <h2>Tu propuesta de valor</h2>
          <p class="lead">${esc(p.empresa)} · NIT ${esc(p.nit)}</p>
          <div class="kv"><b>Elaborado por</b><span>${esc(p.nombre)}</span><b>Correo</b><span>${esc(p.correo)}</span><b>Fecha</b><span>${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</span></div>
        </div>
        <img src="img/propuesta.png" alt="Ilustración de personas celebrando" />
      </section>
      <div class="inline-controls no-print">
        <button class="btn" data-action="print">🖨️ Imprimir / Guardar PDF</button>
        <button class="btn secondary" data-action="export">⬇ Descargar respaldo (JSON)</button>
        <label class="btn secondary" style="cursor:pointer">⬆ Cargar respaldo<input type="file" accept="application/json,.json" data-action-change="import" hidden /></label>
        <button class="btn ghost" data-action="reset">Empezar de nuevo</button>
      </div>
      ${segs.map((s) => {
        const d = segData(s.id);
        const cov = coverage(s.id);
        const pct = (arr) => (arr.length ? Math.round((arr.filter((x) => x.by.length).length / arr.length) * 100) : 0);
        return `<div class="card summary-seg">
          <h3>Segmento: ${esc(s.nombre)}</h3>
          ${s.desc ? `<p class="muted">${esc(s.desc)}</p>` : ''}
          <h4>Análisis del cliente</h4>
          <div class="summary-grid">${ASPECTOS.map((a) => `<div><h4>${esc(a.lbl)}</h4>${ul(lines(d.aspectos[a.key]))}</div>`).join('')}</div>
          <h4 style="margin-top:16px">Motivadores priorizados</h4>
          ${filled(d.motivadores).length ? `<ol>${filled(d.motivadores).map((m) => `<li>${esc(m.text)}</li>`).join('')}</ol>` : '<p class="muted">—</p>'}
          <h4>Evaluación frente a la competencia</h4>
          ${evalTable(s.id, true)}
          <h4 style="margin-top:16px">Lienzo de propuesta de valor</h4>
          <div class="summary-grid">
            <div><h4>Trabajos del cliente</h4>${ul(filled(d.perfil.trabajos))}</div>
            <div><h4>Frustraciones</h4>${ul(filled(d.perfil.frustraciones))}</div>
            <div><h4>Beneficios</h4>${ul(filled(d.perfil.beneficios))}</div>
            <div><h4>Productos y servicios</h4>${ul(filled(d.mapa.productos))}</div>
            <div><h4>Aliviadores de frustraciones</h4>${ul(filled(d.mapa.aliviadores))}</div>
            <div><h4>Creadores de alegría</h4>${ul(filled(d.mapa.creadores))}</div>
          </div>
          <p class="hint" style="margin-top:12px">Encaje: ${pct(cov.frustraciones)}% de frustraciones aliviadas · ${pct(cov.beneficios)}% de beneficios creados · ${pct(cov.trabajos)}% de trabajos resueltos.</p>
        </div>`;
      }).join('')}
      <div class="card info no-print">
        <h3>Siguiente paso: Modelo de negocio</h3>
        <p>Usa estos insumos en el lienzo de modelo de negocio de Osterwalder: segmentos de clientes, propuesta de valor, canales, relación con clientes, fuentes de ingreso, recursos y actividades clave, aliados y estructura de costos.</p>
      </div>
      ${navActions()}`;
  }

  const VIEWS = [viewInicio, viewSegmentos, viewAnalisis, viewMotivadores, viewCompetencia, viewPerfil, viewPropuesta, viewResumen];

  // ---------- Render ----------
  function renderStepper() {
    document.getElementById('stepper').innerHTML = STEPS.map((s, i) => `
      <button class="${i === S.step ? 'active' : ''} ${stepDone(i) ? 'done' : ''}" data-action="go" data-step="${i}"
        ${canGo(i) ? '' : 'disabled'} aria-current="${i === S.step ? 'step' : 'false'}">
        <span class="n">${stepDone(i) && i !== S.step ? '✓' : i === 7 ? '★' : i}</span><span class="lbl">${s.lbl}</span>
      </button>`).join('');
  }

  function render(opts = {}) {
    if (!canGo(S.step)) S.step = 0;
    document.body.dataset.step = S.step;
    const app = document.getElementById('app');
    app.innerHTML = VIEWS[S.step]();
    renderStepper();
    save();
    if (opts.scroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      app.focus({ preventScroll: true });
    }
  }

  function refreshPartials() {
    const seg = S.step >= 2 ? curSeg() : null;
    const et = document.getElementById('eval-table');
    if (et && seg) et.innerHTML = evalTable(seg.id);
    const fv = document.getElementById('fit-view');
    if (fv && seg) fv.innerHTML = fitView(seg.id);
  }

  // ---------- Navegación ----------
  function tryLeave(from) {
    if (from === 0) {
      errors = validateStep0();
      if (Object.keys(errors).length) {
        render();
        const first = document.querySelector('.invalid');
        if (first) first.focus();
        toast('Revisa los campos marcados.');
        return false;
      }
    }
    if (from === 1 && !step1ok()) {
      errors = { segmentos: 'Escribe al menos un segmento de clientes.' };
      render();
      return false;
    }
    errors = {};
    return true;
  }

  function go(step) {
    if (step === S.step) return;
    if (step > S.step) {
      for (let s = S.step; s < Math.min(step, 2); s++) if (!tryLeave(s)) return;
    }
    if (!canGo(step)) return;
    S.step = step;
    S.seg = 0;
    render({ scroll: true });
  }

  // ---------- Eventos ----------
  const app = document.getElementById('app');

  function setBound(el) {
    const path = el.dataset.bind;
    const [o, k] = resolve(path);
    let v = el.value;
    if (el.dataset.num !== undefined) {
      if (v === '') { delete o[k]; save(); return; }
      v = Number(v);
    }
    o[k] = v;
    // Un motivador automático editado pasa a ser propio del usuario
    const m = path.match(/^(\$\.(?:motivadores|perfil\.\w+))\.(\d+)\.text$/);
    if (m) {
      const item = getPath(m[1])[+m[2]];
      if (item && item.auto) { item.auto = false; }
    }
    save();
  }

  app.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.dataset.bind || el.tagName === 'SELECT') return;
    setBound(el);
    if (S.step === 0 && errors[el.dataset.bind.split('.').pop()]) {
      const key = el.dataset.bind.split('.').pop();
      const e2 = validateStep0();
      if (!e2[key]) {
        delete errors[key];
        el.classList.remove('invalid');
        const er = app.querySelector(`[data-err="${key}"]`);
        if (er) er.textContent = '';
      }
    }
    refreshPartials();
    renderStepper();
  });

  app.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.actionChange === 'import') return importJSON(el);
    if (!el.dataset.bind) return;
    setBound(el);
    if (el.tagName === 'SELECT' && el.dataset.rerender !== undefined) {
      if (el.closest('#eval-table')) {
        // Mantener el foco en la misma celda tras recalcular la tabla
        const bind = el.dataset.bind;
        refreshPartials();
        const again = app.querySelector(`[data-bind="${CSS.escape(bind)}"]`);
        if (again) again.focus();
      } else {
        refreshPartials();
      }
      renderStepper();
    }
  });

  app.addEventListener('keydown', (e) => {
    const el = e.target;
    if (e.key === 'Enter' && el.dataset.listInput) {
      e.preventDefault();
      addItem(el.dataset.listInput, +el.dataset.idx + 1);
    }
  });

  function addItem(path, at, extra = {}) {
    const arr = getPath(path);
    const idx = at === undefined ? arr.length : at;
    arr.splice(idx, 0, { id: uid(), text: '', ...extra });
    render();
    const inp = app.querySelector(`[data-bind="${CSS.escape(path + '.' + idx + '.text')}"]`);
    if (inp) inp.focus();
  }

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.disabled) return;
    const a = btn.dataset.action;
    const seg = S.step >= 2 ? curSeg() : null;
    switch (a) {
      case 'next':
        go(S.step + 1);
        break;
      case 'prev':
        if (S.step >= 2 && S.seg > 0) { S.seg--; render({ scroll: true }); } else go(S.step - 1);
        break;
      case 'next-seg':
        S.seg++;
        render({ scroll: true });
        break;
      case 'seg':
        S.seg = +btn.dataset.idx;
        render();
        break;
      case 'add-item':
        addItem(btn.dataset.path);
        break;
      case 'del-item': {
        const arr = getPath(btn.dataset.path);
        const [item] = arr.splice(+btn.dataset.idx, 1);
        if (btn.dataset.path === '$.motivadores' && item && item.auto) {
          segData(seg.id).descartados.push(norm(item.text));
        }
        render();
        break;
      }
      case 'move': {
        const arr = getPath(btn.dataset.path);
        const i = +btn.dataset.idx;
        const j = i + +btn.dataset.dir;
        if (j < 0 || j >= arr.length) break;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        render();
        const b = app.querySelector(`[data-action="move"][data-idx="${j}"][data-dir="${btn.dataset.dir}"]`);
        if (b && !b.disabled) b.focus();
        break;
      }
      case 'add-chip':
        segData(seg.id).motivadores.push({ id: uid(), text: btn.dataset.text, src: btn.dataset.src });
        render();
        toast('Motivador agregado.');
        break;
      case 'restore-desc':
        segData(seg.id).descartados = [];
        render();
        break;
      case 'evalN':
        segData(seg.id).evalN = btn.dataset.n === 'all' ? 'all' : 5;
        render();
        break;
      case 'regen':
        generarPerfil(seg.id);
        render();
        toast('Perfil actualizado con la información de los pasos 1 a 4.');
        break;
      case 'print':
        window.print();
        break;
      case 'export':
        exportJSON();
        break;
      case 'reset':
        if (confirm('¿Seguro que quieres borrar toda la información y empezar de nuevo?')) {
          S = fresh();
          errors = {};
          try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* sin almacenamiento */ }
          render({ scroll: true });
        }
        break;
    }
  });

  document.getElementById('stepper').addEventListener('click', (e) => {
    const b = e.target.closest('[data-action="go"]');
    if (b && !b.disabled) go(+b.dataset.step);
  });

  // Arrastrar y soltar para priorizar motivadores
  let dragFrom = null;
  // Solo se arrastra desde la manija, para no interferir con la edición del texto
  app.addEventListener('pointerdown', (e) => {
    const h = e.target.closest && e.target.closest('.drag');
    if (h) h.parentElement.setAttribute('draggable', 'true');
  });
  app.addEventListener('dragstart', (e) => {
    const it = e.target.closest && e.target.closest('.list-item[data-draggable]');
    if (!it) return;
    dragFrom = +it.dataset.idx;
    it.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragFrom));
  });
  app.addEventListener('dragover', (e) => {
    const it = e.target.closest('.list-item[data-draggable]');
    if (!it || dragFrom === null) return;
    e.preventDefault();
    app.querySelectorAll('.drop-target').forEach((x) => x.classList.remove('drop-target'));
    it.classList.add('drop-target');
  });
  app.addEventListener('drop', (e) => {
    const it = e.target.closest('.list-item[data-draggable]');
    if (!it || dragFrom === null) return;
    e.preventDefault();
    const arr = getPath(it.dataset.path);
    const to = +it.dataset.idx;
    const [m] = arr.splice(dragFrom, 1);
    arr.splice(to, 0, m);
    dragFrom = null;
    render();
  });
  app.addEventListener('dragend', () => {
    dragFrom = null;
    app.querySelectorAll('.dragging,.drop-target').forEach((x) => x.classList.remove('dragging', 'drop-target'));
    app.querySelectorAll('[draggable]').forEach((x) => x.removeAttribute('draggable'));
  });

  // ---------- Respaldo ----------
  function exportJSON() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const name = (S.perfil.empresa || 'empresa').replace(/[^\w\-]+/g, '_');
    a.href = URL.createObjectURL(blob);
    a.download = `propuesta-de-valor_${name}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importJSON(input) {
    const f = input.files && input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const s = JSON.parse(r.result);
        if (!s || s.v !== 1 || !s.perfil || !Array.isArray(s.segmentos)) throw new Error('formato');
        S = s;
        S.step = 7;
        S.seg = 0;
        render({ scroll: true });
        toast('Respaldo cargado.');
      } catch (err) {
        toast('El archivo no es un respaldo válido.');
      }
    };
    r.readAsText(f);
  }

  render();
})();
