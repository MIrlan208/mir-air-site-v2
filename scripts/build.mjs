// Сборка: проверяет файлы и копирует сайт в dist/. Без зависимостей (Node 18+).
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SITE_FILES = ['index.html', 'style.css', 'script.js', 'data.js', 'bank.js'];
const SITE_DIRS = ['img', 'media', 'fonts'];
let errors = 0;
const fail = (msg) => { console.error('✗ ' + msg); errors++; };

// 1. синтаксис JS
for (const f of SITE_FILES.filter(f => f.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); console.log('✓ синтаксис ' + f); }
  catch (e) { fail(`синтаксическая ошибка в ${f}\n${e.stderr}`); }
}

// 2. все ссылки на img/ и media/ ведут на существующие файлы
const assetRe = /(?:img|media)\/[A-Za-z0-9_.\-\/]+\.(?:jpg|jpeg|png|webp|svg|mp4|pdf)/g;
const seen = new Set();
for (const f of SITE_FILES) {
  const text = readFileSync(f, 'utf8').split('\n')
    .filter(l => !l.trim().startsWith('//')).join('\n'); // примеры в комментариях не считаем
  for (const p of text.match(assetRe) || []) {
    if (seen.has(p)) continue; seen.add(p);
    if (!existsSync(p)) fail(`${f}: нет файла ${p}`);
  }
}
console.log(`✓ проверено файлов в img/ и media/: ${seen.size}`);

// 3. уникальные id у проектов
const bank = readFileSync('bank.js', 'utf8');
const ids = [...bank.matchAll(/^\s*id:\s*"([^"]+)"/gm)].map(m => m[1]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) fail('повторяются id проектов: ' + [...new Set(dup)].join(', '));
else console.log(`✓ id проектов уникальны (${ids.length})`);

if (errors) { console.error(`\nСборка остановлена: ошибок ${errors}`); process.exit(1); }

// 4. копирование в dist/
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const f of SITE_FILES) cpSync(f, `dist/${f}`);
for (const d of SITE_DIRS) cpSync(d, `dist/${d}`, { recursive: true });
// 5. версия сборки: метка в подвале и сброс кеша браузера (?v=...)
let sha = process.env.GITHUB_SHA || '', when = new Date();
try {
  if (!sha) sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  when = new Date(execFileSync('git', ['log', '-1', '--format=%cI'], { encoding: 'utf8' }).trim());
} catch { /* без git: берём текущее время */ }
const short = (sha || 'dev').slice(0, 7);
const stamp = when.toLocaleString('ru-RU', { timeZone: 'Asia/Bishkek', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
let html = readFileSync('dist/index.html', 'utf8')
  .replace('<!--BUILD-->', ` · версия ${short} от ${stamp}`)
  .replace(/(href|src)="(style\.css|script\.js|data\.js|bank\.js)"/g, `$1="$2?v=${short}"`);
writeFileSync('dist/index.html', html);
console.log(`✓ версия сборки: ${short} от ${stamp}`);

const mb = (statSync('dist/media/projects.mp4').size / 1048576).toFixed(1);
console.log(`\n✓ Готово: dist/ (видео ${mb} МБ). Загрузи содержимое dist/ на хостинг.`);
