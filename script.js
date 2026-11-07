const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => /^https?:\/\//i.test(u || '') ? u : '';
const safeDoc = (u) => /^(https?:\/\/|media\/)/i.test(u || '') ? u : '';
const plural = (n, f) => {
  const a = Math.abs(n) % 100, b = a % 10;
  return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2];
};

const SHOW_EXAMPLES = typeof SITE !== 'undefined' && SITE.showExamples === true;
const realOnly = (list) => SHOW_EXAMPLES ? list : list.filter(x => !x.example);
const items = realOnly(typeof ITEMS !== 'undefined' ? ITEMS : []);
const groups = typeof GROUPS !== 'undefined' ? GROUPS : [];
const team = typeof TEAM !== 'undefined' ? TEAM : [];
const achievements = realOnly(typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : []);
/* У записи может быть group: "mir-1" или groups: ["mir-1", "mir-2"] (смешанная команда) */
const normGroups = (x) => { x.groups = Array.isArray(x.groups) && x.groups.length ? x.groups : (x.group ? [x.group] : []); x.group = x.groups[0] || ''; };
items.forEach(normGroups); achievements.forEach(normGroups);
const gpills = (ids, cls = 'pill t-group') => ids.map(id => gname(id) ? `<a class="${cls}" href="#${esc(id)}">${esc(gname(id))}</a>` : '').join('');
const site = typeof SITE !== 'undefined' ? SITE : { telegram: '#' };
const tgA = (t) => `<a href="${esc(site.telegram)}" target="_blank" rel="noopener noreferrer">${t}</a>`;
const gname = (id) => (groups.find(g => g.id === id) || {}).name || '';
const BASE_TITLE = document.title;

/* ---------- меню ---------- */
const burger = $('.burger');
const menu = $('nav ul');
if (burger) {
  burger.addEventListener('click', () => burger.setAttribute('aria-expanded', menu.classList.toggle('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));
}

/* ---------- появление при прокрутке ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
const watch = (root = document) => $$('.reveal', root).forEach(el => io.observe(el));

/* ---------- счётчики на главной ---------- */
const isProject = (i) => i.type === 'project' || i.type === 'site';
const isDemo = (i) => i.type === 'demo' || !!safeUrl(i.demo);
const setTarget = (id, n) => { const el = $('#' + id); if (el) el.dataset.target = n; };
setTarget('st-ideas', items.filter(i => i.type === 'idea').length);
setTarget('st-projects', items.filter(isProject).length);
setTarget('st-demos', items.filter(isDemo).length);
const TOTAL = site.total || team.length;
setTarget('st-team', TOTAL);
const teamCount = $('#team-count'); if (teamCount) teamCount.textContent = TOTAL;

function animateCount(el) {
  const target = +el.dataset.target;
  const start = performance.now();
  const duration = 1400;
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCount(e.target); counterIO.unobserve(e.target); }
  });
}, { threshold: 0.5 });
$$('[data-target]').forEach(el => counterIO.observe(el));

/* ---------- проекты (портфолио) ---------- */
const TYPE = { idea: 'Идея', project: 'Проект', demo: 'Демо', site: 'Сайт' };
const STATUS = { idea: 'На обсуждении', work: 'В работе', demo: 'Демо готово', best: 'Лучший проект' };
const state = { q: '', type: 'all', group: 'all', status: 'all' };

function matches(it) {
  const hay = [it.title, it.desc, it.author, (it.tags || []).join(' ')].join(' ').toLowerCase();
  return (!state.q || hay.includes(state.q))
    && (state.type === 'all' || it.type === state.type)
    && (state.group === 'all' || it.groups.includes(state.group))
    && (state.status === 'all' || it.status === state.status);
}

function cardHTML(it, isBest = false, showGroup = true) {
  const demo = safeUrl(it.demo), repo = safeUrl(it.repo), slides = safeDoc(it.slides);
  const links = (demo || repo || slides) ? `<div class="links">
      ${slides ? `<a href="${esc(slides)}" target="_blank" rel="noopener noreferrer">Презентация ↗</a>` : ''}
      ${demo ? `<a href="${esc(demo)}" target="_blank" rel="noopener noreferrer">Демо ↗</a>` : ''}
      ${repo ? `<a href="${esc(repo)}" target="_blank" rel="noopener noreferrer">Код ↗</a>` : ''}
    </div>` : '';
  const tags = (it.tags || []).map(t => `<span class="tagchip">${esc(t)}</span>`).join('');
  const cover = (it.photos || [])[0];
  const page = it.id && it.story ? `#p-${esc(it.id)}` : '';
  return `<article class="card bank-card ${isBest ? 'best-card' : ''} ${cover ? 'has-cover' : ''}">
    ${cover ? `<${page ? `a href="${page}"` : 'div'} class="cover"><img src="${esc(cover.replace(/^img\//, 'img/t/'))}" onerror="this.onerror=null;this.src='${esc(cover)}'" alt="${esc(it.title)}" loading="lazy" decoding="async"></${page ? 'a' : 'div'}>` : ''}
    <div class="bank-top">
      <span class="pill t-${esc(it.type)}">${esc(TYPE[it.type] || it.type)}</span>
      ${showGroup ? gpills(it.groups) : ''}${it.groups.length > 1 ? '<span class="pill t-mix">Смешанная команда</span>' : ''}
      ${it.example ? '<span class="pill t-ex">Пример</span>' : ''}
    </div>
    <h3>${page ? `<a href="${page}">${esc(it.title)}</a>` : esc(it.title)}</h3>
    <p>${esc(it.desc)}</p>
    <div class="tags">${tags}</div>
    <div class="bank-foot">
      <span class="st st-${esc(it.status)}">${esc(STATUS[it.status] || '')}</span>
      <span class="author">${esc(it.author)}</span>
    </div>
    ${links}
    ${page ? `<a class="more" href="${page}">Подробнее о проекте →</a>` : ''}
  </article>`;
}

const PAGE_N = 6;
/* Список по частям: сначала PAGE_N карточек, дальше по кнопке «Показать ещё» */
function paged(grid, list, cardFn, emptyHTML, onPaint) {
  let wrap = grid.nextElementSibling;
  if (!wrap || !wrap.classList.contains('more-wrap')) { wrap = document.createElement('div'); wrap.className = 'more-wrap'; grid.after(wrap); }
  let shown = PAGE_N;
  const paint = () => {
    grid.innerHTML = list.length ? list.slice(0, shown).map(cardFn).join('') : emptyHTML;
    const rest = list.length - shown;
    wrap.innerHTML = rest > 0 ? `<button class="btn btn-ghost more-btn" type="button">Показать ещё · ${rest}</button>` : '';
    const b = wrap.firstElementChild;
    if (b) b.onclick = () => { shown += PAGE_N; paint(); };
    if (onPaint) onPaint(Math.min(shown, list.length));
  };
  paint();
}

function renderBank() {
  const grid = $('#bank-grid');
  if (!grid) return;
  const list = items.filter(matches);
  const c = $('#bank-count');
  paged(grid, list, it => cardHTML(it), `<div class="empty">Ничего не найдено. Измени поиск или фильтры, либо ${tgA('предложи свою идею в Telegram')}.</div>`,
    (n) => { if (c) c.textContent = `Показано ${n} из ${items.length}`; });
}

function renderBest() {
  const box = $('#best-box');
  if (!box) return;
  const best = items.filter(i => i.status === 'best');
  box.innerHTML = best.length
    ? `<div class="grid ${best.length > 1 ? 'grid-2' : ''}">${best.map(it => cardHTML(it, true)).join('')}</div>`
    : `<div class="card best-empty reveal"><div class="trophy">★</div>
         <h3>Лучший проект пока не выбран</h3>
         <p>Когда команда определится, проект появится здесь на главном месте.</p></div>`;
  watch(box);
}

$$('.chips').forEach(group => {
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    $$('button', group).forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    state[group.dataset.group] = btn.dataset.value;
    renderBank();
  });
});
const search = $('#search');
if (search) search.addEventListener('input', () => { state.q = search.value.trim().toLowerCase(); renderBank(); });

renderBank();
renderBest();

/* ---------- ссылки на Telegram ---------- */
const hasTg = /^https?:\/\//i.test(site.telegram || '') && !/your_group/.test(site.telegram);
$$('[data-tg]').forEach(a => {
  if (!hasTg) { (a.closest('li') || a).hidden = true; return; }
  a.href = site.telegram; a.target = '_blank'; a.rel = 'noopener noreferrer';
});
if (!hasTg) { const tgSec = $('#telegram'); if (tgSec) tgSec.hidden = true; }

/* ---------- Telegram-бот для идей ---------- */
(() => {
  const bot = String(site.bot || '').replace(/^@/, '').trim();
  const sec = $('#ideas');
  if (!sec) return;
  if (!bot) { sec.hidden = true; $$('a[href="#ideas"]').forEach(a => { (a.closest('li') || a).hidden = true; }); return; }
  const link = 'https://t.me/' + bot;
  const a = $('#bot-link'); if (a) a.href = link;
  const n = $('#bot-name'); if (n) n.textContent = '@' + bot;
})();

/* ---------- контакты и суммы в блоке «Поддержать команду» ---------- */
(() => {
  const c = site.curator || {};
  const parts = [];
  if (c.name) parts.push(`Куратор группы: <b>${esc(c.name)}</b>${/\.$/.test(c.name) ? '' : '.'}`);
  if (c.email) parts.push(`Почта: <b>${esc(c.email)}</b>.`);
  if (c.phone) parts.push(`Телефон: <b>${esc(c.phone)}</b>.`);
  const box = $('#cta'), txt = $('#cta-contacts'), mail = $('#cta-mail');
  if (box) {
    if (!parts.length && !hasTg) box.hidden = true;
    if (txt) txt.innerHTML = parts.join(' ') || 'Напишите нам в Telegram.';
    if (mail) { if (c.email) mail.href = 'mailto:' + c.email; else mail.hidden = true; }
  }
  $$('[data-sum]').forEach(el => {
    const v = (site.sums || [])[+el.dataset.sum];
    if (v) el.textContent = 'Нужно: ' + v; else el.remove();
  });
})();

/* ---------- достижения на главной ---------- */
const achItemHTML = (a, withGroup = true) => `<div class="tl-item">
    <time>${esc(a.date)}${withGroup && a.groups.length ? ` · ${esc(a.groups.map(gname).join(', '))}` : ''}${a.example ? ' · <span class="ex-note">пример</span>' : ''}</time>
    <h3>${esc(a.title)}</h3>
    <p>${esc(a.text)}</p>
  </div>`;
const achBox = $('#ach-list');
if (achBox) achBox.innerHTML = achievements.map(a => achItemHTML(a)).join('');

/* ---------- состав группы ---------- */
const memberHTML = (x) => {
  const initials = x.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const av = x.photo ? `<img src="${esc(x.photo)}" alt="${esc(x.name)}">` : esc(initials);
  const href = safeUrl(x.link);
  const nameHTML = href ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a>` : esc(x.name);
  return `<li>
    <span class="mini-av">${av}</span>
    <span class="m-info"><span class="m-name">${nameHTML}</span><span class="m-role">${esc(ROLE_RU[x.role] || '')}</span></span>
    ${x.lead ? '<span class="lead-badge">Тимлид</span>' : ''}
  </li>`;
};
const rosterHTML = (squads, flat) => squads.map(sq => `<div class="squad${flat ? ' flat' : ''}">
    ${flat ? '' : `<div class="squad-head">
      <h3>${esc(sq.name)}</h3>
      ${sq.director ? `<span class="count">Руководитель отряда: <b>${esc(sq.director)}</b></span>` : ''}
    </div>`}
    <div class="grid grid-3">
      ${sq.teams.map(t => `<div class="card team-card">
        <div class="team-top"><h4>${esc(t.name)}</h4><span class="count">${t.members.length} ${plural(t.members.length, ['человек', 'человека', 'человек'])}</span></div>
        <ul>${t.members.map(memberHTML).join('')}</ul>
      </div>`).join('')}
    </div>
  </div>`).join('');

/* ---------- сводка по группе ---------- */
function groupStats(g) {
  const list = items.filter(i => i.groups.includes(g.id));
  return {
    list,
    people: g.squads.reduce((n, s) => n + s.teams.reduce((k, t) => k + t.members.length, 0), 0),
    size: g.size || 0,
    teams: g.squads.reduce((n, s) => n + s.teams.length, 0),
    projects: list.filter(isProject).length,
    ideas: list.filter(i => i.type === 'idea').length,
    demos: list.filter(isDemo).length,
    ach: achievements.filter(a => a.groups.includes(g.id))
  };
}

/* ---------- блок «Наши группы» на главной ---------- */
const groupsBox = $('#groups-grid');
if (groupsBox) {
  const sub = $('#groups-sub');
  if (sub) sub.textContent = `${groups.length} ${plural(groups.length, ['группа', 'группы', 'групп'])}. Открой любую, чтобы увидеть её состав, проекты, идеи и достижения.`;
  groupsBox.innerHTML = groups.map(g => {
    const s = groupStats(g);
    return `<a class="card group-card reveal" href="#${esc(g.id)}">
      <span class="g-num grad">${esc(g.name)}</span>
      ${g.full ? `<span class="g-full">${esc(g.full)}</span>` : ''}
      <p>${esc(g.about)}</p>
      <div class="g-stats">
        <span><b>${s.size || s.people}</b> ${plural(s.size || s.people, ['участник', 'участника', 'участников'])}</span>
        <span><b>${s.projects}</b> ${plural(s.projects, ['проект', 'проекта', 'проектов'])}</span>
        <span><b>${s.ach.length}</b> ${plural(s.ach.length, ['достижение', 'достижения', 'достижений'])}</span>
      </div>
      <span class="g-go">Смотреть дела →</span>
    </a>`;
  }).join('');
}

/* ---------- страница группы ---------- */
const home = $('#home');
const view = $('#group-view');

function renderGroup(g) {
  const s = groupStats(g);
  const empty = (text, link = '') => `<div class="empty">${text} ${link}</div>`;
  const addLink = tgA('Предложить идею в Telegram');
  view.innerHTML = `
    <div class="page-head">
      <div class="container">
        <a class="back-link" href="#groups">← Все группы</a>
        <span class="tag">Группа${g.full ? ' · ' + esc(g.full) : ''}</span>
        <h1 class="g-title grad">${esc(g.name)}</h1>
        <p class="sub">${esc(g.about)}</p>
      </div>
    </div>

    <section class="stats gstats">
      <div class="container stats-grid">
        <div class="stat"><b>${s.size || s.people}</b><span>${plural(s.size || s.people, ['участник', 'участника', 'участников'])}</span></div>
        <div class="stat"><b>${s.projects}</b><span>${plural(s.projects, ['проект', 'проекта', 'проектов'])}</span></div>
        <div class="stat"><b>${s.ach.length}</b><span>${plural(s.ach.length, ['достижение', 'достижения', 'достижений'])}</span></div>
        <div class="stat"><b>${s.demos}</b><span>демо</span></div>
      </div>
    </section>

    <section>
      <div class="container">
        <h2 class="title">Дела <span class="grad">группы</span></h2>
        <p class="sub">Проекты, демо и сайты ${esc(g.name)}.</p>
        <div class="chip-row"><span class="lbl">Тип</span>
          <div class="chips" id="g-chips">
            <button class="on" data-value="all">Все</button>
            <button data-value="project">Проекты</button>
            <button data-value="demo">Демо</button>
            <button data-value="site">Сайты</button>
          </div>
        </div>
        <div class="grid grid-3" id="g-grid"></div>
      </div>
    </section>

    <section style="background:var(--bg2)">
      <div class="container">
        <h2 class="title">Достижения <span class="grad">группы</span></h2>
        <p class="sub">Победы, награды и события ${esc(g.name)}.</p>
        ${s.ach.length
          ? `<div class="timeline">${s.ach.map(a => achItemHTML(a, false)).join('')}</div>`
          : empty('Достижения группы появятся здесь.')}
      </div>
    </section>

    <section>
      <div class="container">
        <h2 class="title">Состав <span class="grad">группы</span></h2>
        <p class="sub">${s.people
          ? (g.flat ? `${s.size || s.people} ${plural(s.size || s.people, ['человек', 'человека', 'человек'])} в группе ${esc(g.full || g.name)}.` : `${s.size || s.people} ${plural(s.size || s.people, ['человек', 'человека', 'человек'])}, ${g.squads.length} ${plural(g.squads.length, ['отряд', 'отряда', 'отрядов'])}, ${s.teams} ${plural(s.teams, ['команда', 'команды', 'команд'])}. Функции: инженер, тестировщик, документация и учёт, PR и работа с людьми.`)
          : `Состав ${esc(g.name)} пока не добавлен.`}</p>
        ${s.people ? rosterHTML(g.squads, g.flat) : empty('Участники группы появятся здесь.')}
      </div>
    </section>

    <section style="background:var(--bg2)">
      <div class="container other">
        <h2 class="title">Другие <span class="grad">группы</span></h2>
        <div class="btns">
          ${groups.filter(x => x.id !== g.id).map(x => `<a class="btn btn-ghost" href="#${esc(x.id)}">${esc(x.name)}</a>`).join('')}
          <a class="btn btn-primary" href="#groups">Все группы</a>
        </div>
      </div>
    </section>`;

  const grid = $('#g-grid', view);
  const draw = (t) => {
    const l = t === 'all' ? s.list : s.list.filter(i => i.type === t);
    paged(grid, l, i => cardHTML(i, false, false), empty(s.list.length ? 'В этой категории пока ничего нет.' : `У ${esc(g.name)} пока нет записей.`, addLink));
  };
  draw('all');
  $('#g-chips', view).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', e.currentTarget).forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    draw(b.dataset.value);
  });
}

/* ---------- страница проекта ---------- */
function renderProject(it) {
  const st = it.story;
  const photos = it.photos || [];
  const pairs = (list, cls) => `<div class="grid ${cls}">${list.map(([h, p], i) =>
    `<div class="card"><span class="p-num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>`;
  const demo = safeUrl(it.demo), repo = safeUrl(it.repo), slides = safeDoc(it.slides);
  const sameGroup = items.filter(x => x !== it && x.groups.some(g => it.groups.includes(g))).slice(0, 3);
  view.innerHTML = `
    <div class="page-head">
      <div class="container">
        <a class="back-link" href="#projects">← Проекты</a>
        <div class="bank-top">
          <span class="pill t-${esc(it.type)}">${esc(TYPE[it.type] || it.type)}</span>
          ${gpills(it.groups)}${it.groups.length > 1 ? '<span class="pill t-mix">Смешанная команда</span>' : ''}
          <span class="st st-${esc(it.status)}">${esc(STATUS[it.status] || '')}</span>
        </div>
        <h1 class="p-title">${esc(it.title)}</h1>
        <p class="sub">${esc(it.desc)}</p>
        <div class="tags">${(it.tags || []).map(t => `<span class="tagchip">${esc(t)}</span>`).join('')}</div>
        ${(demo || repo || slides) ? `<div class="btns" style="margin-top:22px">
          ${slides ? `<a class="btn btn-primary" href="${esc(slides)}" target="_blank" rel="noopener noreferrer">Презентация проекта ↗</a>` : ''}
          ${demo ?`<a class="btn btn-primary" href="${esc(demo)}" target="_blank" rel="noopener noreferrer">Смотреть демо ↗</a>` : ''}
          ${repo ? `<a class="btn btn-ghost" href="${esc(repo)}" target="_blank" rel="noopener noreferrer">Код на GitHub ↗</a>` : ''}
        </div>` : ''}
      </div>
    </div>

    ${photos.length ? `<section class="p-photos-wrap"><div class="container"><div class="p-photos">
      ${photos.map(p => `<a href="${esc(p)}" target="_blank" rel="noopener"><img src="${esc(p)}" alt="${esc(it.title)}" loading="lazy"></a>`).join('')}
    </div></div></section>` : ''}

    ${[st.problem, st.solution, st.result].some(v => v && String(v).trim()) ? `<section>
      <div class="container">
        ${(() => {
          const blocks = [['Проблема', st.problem, ''], ['Решение', st.solution, ''], ['Результат', st.result, ' p-result']]
            .filter(b => b[1] && String(b[1]).trim());
          return blocks.length ? `<div class="grid grid-${Math.min(blocks.length, 3)} psr">${blocks.map(b =>
            `<div class="card${b[2]}"><span class="p-lbl">${b[0]}</span><p>${esc(b[1])}</p></div>`).join('')}</div>` : '';
        })()}
      </div>
    </section>` : ''}

    ${(st.steps && st.steps.length) ? `<section style="background:var(--bg2)"><div class="container">
      <h2 class="title">Как это <span class="grad">работает</span></h2>
      ${pairs(st.steps, 'steps')}
    </div></section>` : ''}

    ${(st.parts && st.parts.length) ? `<section><div class="container">
      <h2 class="title">Из чего <span class="grad">собрано</span></h2>
      ${pairs(st.parts, 'grid-2')}
    </div></section>` : ''}

    ${(st.code && st.code.trim()) ? `<section style="background:var(--bg2)"><div class="container">
      <h2 class="title">Фрагмент <span class="grad">кода</span></h2>
            <pre class="p-code"><code>${esc(st.code)}</code></pre>
    </div></section>` : ''}

    ${(st.team && st.team.length) ? `<section><div class="container">
      <h2 class="title">Команда <span class="grad">проекта</span></h2>
      ${pairs(st.team, 'grid-2')}
    </div></section>` : ''}

    ${(st.next && st.next.length) ? `<section style="background:var(--bg2)"><div class="container">
      <h2 class="title">Что <span class="grad">дальше</span></h2>
      <p class="sub">Как мы планируем развивать проект.</p>
      ${pairs(st.next, 'grid-3')}
    </div></section>` : ''}

    <section><div class="container other">
      ${sameGroup.length ? `<h2 class="title">Ещё от <span class="grad">${esc(it.groups.map(gname).filter(Boolean).join(' и '))}</span></h2>
        <div class="grid grid-3">${sameGroup.map(x => cardHTML(x, false, false)).join('')}</div>` : ''}
      <div class="btns" style="margin-top:28px">
        <a class="btn btn-primary" href="#projects">Все проекты</a>
        ${it.groups.filter(gname).map(id => `<a class="btn btn-ghost" href="#${esc(id)}">Страница ${esc(gname(id))}</a>`).join('')}
      </div>
    </div></section>`;
}

/* ---------- переход между разделами, группой и проектом ---------- */
/* Каждый пункт меню открывает свой раздел (data-page), без плавной прокрутки. */
const NAV_OF_PAGE = { home: '#about', achievements: '#achievements', projects: '#projects', ideas: '#ideas', groups: '#groups', news: '#news', support: '#support' };
const jump = (y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' });
let currentPage = null;
function setNav(page) {
  const href = NAV_OF_PAGE[page] || '';
  $$('nav a[href^="#"]').forEach(a => a.classList.toggle('active', a.getAttribute('href') === href));
}
function showPage(page) {
  const secs = $$('#home > section[data-page]');
  secs.forEach(s => { s.hidden = s.dataset.page !== page; s.classList.remove('page-first'); });
  const first = secs.find(s => !s.hidden);
  if (first) first.classList.add('page-first');
  return first;
}
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  const g = groups.find(x => x.id === h);
  const p = h.startsWith('p-') && items.find(x => x.id === h.slice(2) && x.story);
  if (p && home && view) {
    renderProject(p);
    home.hidden = true; view.hidden = false; currentPage = null;
    document.title = `${p.title}: ${BASE_TITLE}`;
    setNav('projects'); jump(0);
  } else if (g && home && view) {
    renderGroup(g);
    home.hidden = true; view.hidden = false; currentPage = null;
    document.title = `${g.name}: ${BASE_TITLE}`;
    setNav('groups'); jump(0);
  } else if (home && view) {
    const target = h && document.getElementById(h);
    const owner = target && target.closest('section[data-page]');
    const page = owner ? owner.dataset.page : 'home';
    home.hidden = false; view.hidden = true;
    document.title = BASE_TITLE;
    const first = showPage(page);
    setNav(page);
    currentPage = page;
    if (target && target !== first && target.id !== 'top') {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else jump(0);
  }
  watch();
}
window.addEventListener('hashchange', route);
route();

watch();

/* ---------- v2: шапка поверх фото и меню на телефоне ---------- */
(() => { const tw = $('#team-word'); if (tw) tw.textContent = plural(TOTAL, ['человек', 'человека', 'человек']); })();
(() => {
  const header = $('header');
  if (!header) return;
  const heroEl = $('.hero');
  const update = () => {
    const onHero = heroEl && home && !home.hidden && window.scrollY < heroEl.offsetHeight - 80;
    header.classList.toggle('over-hero', !!onHero);
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('hashchange', () => setTimeout(update, 0));
  addEventListener('resize', update);
  update();

  const b = $('.burger'), ul = $('nav ul');
  if (b && ul) {
    const sync = () => {
      const open = ul.classList.contains('open');
      header.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      b.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    };
    b.addEventListener('click', () => setTimeout(sync, 0));
    $$('a', ul).forEach(a => a.addEventListener('click', () => setTimeout(sync, 0)));
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && ul.classList.contains('open')) { ul.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); sync(); }
    });
  }
})();
