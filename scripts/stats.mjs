// Self-made github stats card — no third-party card service.
// Usage: node scripts/stats.mjs   (emits assets/gh-stats-{dark,light}.svg)
//
// Fetches public data from the GitHub API (uses GITHUB_TOKEN if set, e.g.
// inside the refresh workflow) and renders the numbers in the same design
// system as the rest of the profile. Search-based counts degrade to "—"
// gracefully if the API rate-limits an unauthenticated run.

import { themes, fontCss, MONO, EASE_OUT, REDUCED, adv, esc, writeSvgs } from './build.mjs';

const USER = 'FelixMatrixar';
const YEAR = new Date().getFullYear();

// official github language colors (fallback: theme fg3)
const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', HTML: '#e34c26',
  CSS: '#563d7c', SCSS: '#c6538c', Go: '#00ADD8', 'Jupyter Notebook': '#DA5B0B',
  Shell: '#89e051', 'C++': '#f34b7d', C: '#555555', Java: '#b07219', Rust: '#dea584',
  Kotlin: '#A97BFF', PHP: '#4F5D95', Ruby: '#701516', Swift: '#F05138', Dart: '#00B4AB',
  Vue: '#41b883', Svelte: '#ff3e00', Dockerfile: '#384d54', PowerShell: '#012456',
  'C#': '#178600', Lua: '#000080', R: '#198CE7', MATLAB: '#e16737',
};

// ---------------------------------------------------------------- fetch

const headers = {
  'User-Agent': 'profile-stats',
  Accept: 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};
const j = async (url) => {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
};
const searchCount = async (endpoint, q) => {
  try {
    return (await j(`https://api.github.com/search/${endpoint}?per_page=1&q=${encodeURIComponent(q)}`)).total_count;
  } catch {
    return null;
  }
};

const profile = await j(`https://api.github.com/users/${USER}`);
const repos = await j(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`);

const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
const langBytes = {};
for (const r of repos.filter((r) => !r.fork)) {
  try {
    for (const [k, v] of Object.entries(await j(r.languages_url))) langBytes[k] = (langBytes[k] || 0) + v;
  } catch { /* skip repo on rate limit */ }
}
const commits = await searchCount('commits', `author:${USER} committer-date:>=${YEAR}-01-01`);
const prs = await searchCount('issues', `author:${USER} type:pr`);
const issues = await searchCount('issues', `author:${USER} type:issue`);

const langs = Object.entries(langBytes).sort((a, b) => b[1] - a[1]).slice(0, 8);
const langTotal = langs.reduce((s, [, v]) => s + v, 0);

const data = {
  rows: [
    ['total stars', stars],
    [`commits (${YEAR})`, commits],
    ['pull requests', prs],
    ['issues', issues],
    ['followers', profile.followers],
    ['public repos', profile.public_repos],
  ],
  langs: langs.map(([name, v]) => ({ name, pct: (v / langTotal) * 100 })),
};
console.log(JSON.stringify(data, null, 1));

// ---------------------------------------------------------------- render

function statsCard(t, d) {
  const W = 880;
  const fsRow = 13, a = adv(fsRow);
  const leftX = 32, valX = 392;
  const rightX = 470, barW = W - 32 - rightX;
  const rowY0 = 78, rowStep = 28;
  const H = Math.max(rowY0 + d.rows.length * rowStep, 130 + Math.ceil(d.langs.length / 2) * 26) + 6;

  const fmt = (v) => (v === null || v === undefined ? '—' : v.toLocaleString('en-US'));

  const rowEls = d.rows.map(([label, v], i) => {
    const y = rowY0 + i * rowStep;
    const val = fmt(v);
    const dots = '.'.repeat(Math.max(2, Math.floor((valX - leftX) / a) - label.length - val.length - 3));
    return `
  <g class="row r${i}">
    <text x="${leftX}" y="${y}" class="mono" font-size="${fsRow}"><tspan fill="${t.brand}" font-weight="600">&gt; </tspan><tspan fill="${t.fg2}">${esc(label)} </tspan><tspan fill="${t.fg4}">${dots}</tspan></text>
    <text x="${valX}" y="${y}" text-anchor="end" class="mono" font-size="${fsRow}" font-weight="600" fill="${t.fg1}">${val}</text>
  </g>`;
  }).join('');

  let segX = 0;
  const segEls = d.langs.map(({ name, pct }) => {
    const w = (pct / 100) * barW;
    const el = `<rect x="${(rightX + segX).toFixed(1)}" y="58" width="${Math.max(w - 2, 1.5).toFixed(1)}" height="10" rx="3" fill="${LANG_COLORS[name] || t.fg3}"/>`;
    segX += w;
    return el;
  }).join('\n  ');

  const legEls = d.langs.map(({ name, pct }, i) => {
    const x = rightX + (i % 2) * (barW / 2 + 10);
    const y = 96 + Math.floor(i / 2) * 26;
    return `
  <g class="leg l${i}">
    <circle cx="${x + 4}" cy="${y - 4}" r="3.5" fill="${LANG_COLORS[name] || t.fg3}"/>
    <text x="${x + 15}" y="${y}" class="mono" font-size="12" fill="${t.fg2}">${esc(name.toLowerCase())} <tspan fill="${t.fg3}">${pct.toFixed(1)}%</tspan></text>
  </g>`;
  }).join('');

  const rowKf = d.rows.map((_, i) => `.row.r${i}{animation-delay:${(i * 0.09).toFixed(2)}s}`).join('');
  const legKf = d.langs.map((_, i) => `.leg.l${i}{animation-delay:${(0.5 + i * 0.07).toFixed(2)}s}`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="github stats: ${esc(d.rows.map(([l, v]) => `${l} ${fmt(v)}`).join(', '))}">
<style>
${fontCss('mono400', 'mono600')}
.mono{font-family:${MONO}}
.row,.leg{animation:rise .5s ${EASE_OUT} both}
${rowKf}${legKf}
@keyframes rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
.wipe{animation:wipe 1s ${EASE_OUT} both;animation-delay:.15s}
@keyframes wipe{from{width:0}to{width:${barW}px}}
${REDUCED}
</style>
<defs>
  <clipPath id="barclip"><rect class="wipe" x="${rightX}" y="56" width="${barW}" height="14"/></clipPath>
</defs>

<text x="${leftX}" y="44" class="mono" font-size="11" letter-spacing="1.2" fill="${t.fg3}">github stats</text>
${rowEls}

<text x="${rightX}" y="44" class="mono" font-size="11" letter-spacing="1.2" fill="${t.fg3}">most used languages</text>
<g clip-path="url(#barclip)">
  ${segEls}
</g>
${legEls}
</svg>`;
}

writeSvgs({
  'gh-stats-dark.svg': statsCard(themes.dark, data),
  'gh-stats-light.svg': statsCard(themes.light, data),
});
