// Generates the animated profile SVGs from one token config.
// Usage: node scripts/build.mjs   (emits into assets/)
//
// Every component is emitted in a dark and a light variant wired to the
// portfolio's two modes: dark = qa side (warm black / amber-orange),
// light = dev side (cool light / blue). Fonts are embedded as base64
// woff2 so rendering is identical for every visitor — GitHub serves
// these through camo inside <img>, where external resources are blocked.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fonts = JSON.parse(fs.readFileSync(path.join(root, 'fonts', 'fonts-b64.json'), 'utf8'));

// ---------------------------------------------------------------- tokens

const EASE_OUT = 'cubic-bezier(.22,1,.36,1)';
const EASE_SPRING = 'cubic-bezier(.34,1.56,.64,1)';

const themes = {
  dark: {
    id: 'dark',
    bg0: '#0B0A08', bg1: '#121110', bg2: '#1A1815',
    fg1: '#F7F3EC', fg2: '#BDB6AB', fg3: '#8B847A', fg4: '#5F5A52',
    line1: 'rgba(247,243,236,0.07)', line2: 'rgba(247,243,236,0.13)', line3: 'rgba(247,243,236,0.2)',
    brand: '#FF6B1A', brandSoft: '#FFC24B',
    pass: '#34D17E', fail: '#FF5C5C',
    glowBrand: 'rgba(255,107,26,0.35)', glowPass: 'rgba(52,209,126,0.3)',
    roles: ['software qa engineer', 'fullstack developer'],
  },
  light: {
    id: 'light',
    bg0: '#E6EAEF', bg1: '#EEF1F5', bg2: '#FBFCFE',
    fg1: '#0C1116', fg2: '#39424D', fg3: '#6B7480', fg4: '#8E97A1',
    line1: 'rgba(12,17,22,0.08)', line2: 'rgba(12,17,22,0.14)', line3: 'rgba(12,17,22,0.22)',
    brand: '#0A84E5', brandSoft: '#3A9DEC',
    pass: '#0E9558', fail: '#D83A3A',
    glowBrand: 'rgba(10,132,229,0.3)', glowPass: 'rgba(14,149,88,0.28)',
    roles: ['fullstack developer', 'software qa engineer'],
  },
};

// IBM Plex Mono advance width is 0.6em.
const adv = (px) => px * 0.6;

const FACES = {
  mono400: `@font-face{font-family:'PlexMono';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${fonts['IBMPlexMono-400']}) format('woff2')}`,
  mono600: `@font-face{font-family:'PlexMono';font-style:normal;font-weight:600;src:url(data:font/woff2;base64,${fonts['IBMPlexMono-600']}) format('woff2')}`,
  display: `@font-face{font-family:'Grotesk';font-style:normal;font-weight:300 700;src:url(data:font/woff2;base64,${fonts['SpaceGrotesk-700']}) format('woff2')}`,
};
const fontCss = (...names) => names.map((n) => FACES[n]).join('\n');
const MONO = `'PlexMono',ui-monospace,'Cascadia Code',Consolas,Menlo,monospace`;
const DISPLAY = `'Grotesk','Segoe UI',system-ui,sans-serif`;

const REDUCED = `@media (prefers-reduced-motion:reduce){*{animation:none !important}}`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Positioning lives on the outer <g> (transform attribute); the animated
// class goes on an inner <g>, because a CSS transform animation would
// otherwise override the positioning transform entirely.
const check = (x, y, color, cls = '', size = 1) =>
  `<g transform="translate(${x},${y}) scale(${size})"><g class="${cls}" style="transform-box:fill-box;transform-origin:center">` +
  `<path d="M0 3.2 3.4 6.6 9.6 0" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;

const zap = (x, y, s, cls = '') =>
  `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}" style="transform-box:fill-box;transform-origin:center">` +
  `<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></g></g>`;

// ---------------------------------------------------------------- hero

function hero(t) {
  const W = 880, H = 240;
  const [roleA, roleB] = t.roles;
  const roleSize = 15, roleAdv = adv(roleSize);
  const roleX = 88;
  const curA = roleX + roleA.length * roleAdv + 8;
  const curB = roleX + roleB.length * roleAdv + 8;

  // right-hand status chips — the portfolio's playground labels
  const chips = ['ci deploy', 'type check', 'model infer'];
  const chipW = 190, chipH = 36, chipX = W - 44 - chipW;

  const chipEls = chips.map((label, i) => {
    const y = 50 + i * 48;
    return `
  <g>
    <rect x="${chipX}" y="${y}" width="${chipW}" height="${chipH}" rx="9" fill="${t.bg1}" stroke="${t.line2}"/>
    <circle class="dot d${i}" cx="${chipX + 20}" cy="${y + chipH / 2}" r="3" fill="${t.pass}"/>
    <circle class="ring d${i}" cx="${chipX + 20}" cy="${y + chipH / 2}" r="3" fill="none" stroke="${t.pass}" opacity="0"/>
    <text x="${chipX + 36}" y="${y + 22.5}" class="mono" font-size="12.5" fill="${t.fg2}">${label}</text>
    ${check(chipX + chipW - 26, y + 14.5, t.pass, `pop p${i}`)}
  </g>`;
  }).join('');

  const passLine = 'deployed · zero downtime · green';
  const passW = passLine.length * adv(11.5);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="felix — software qa engineer and fullstack developer">
<style>
${fontCss('mono400', 'mono600', 'display')}
.mono{font-family:${MONO}}
.disp{font-family:${DISPLAY}}
.roleA{animation:roleA 10s ${EASE_OUT} infinite}
.roleB{opacity:0;animation:roleB 10s ${EASE_OUT} infinite}
@keyframes roleA{0%,46%{opacity:1;transform:translateY(0)}50%,96%{opacity:0;transform:translateY(-6px)}100%{opacity:1;transform:translateY(0)}}
@keyframes roleB{0%,46%{opacity:0;transform:translateY(6px)}50%,96%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(6px)}}
.cursor{animation:blink 1.1s steps(2,jump-none) infinite}
@keyframes blink{0%{opacity:1}100%{opacity:0}}
.zap{fill:${t.fg3};animation:zapflash 5s ${EASE_SPRING} infinite}
@keyframes zapflash{0%,88%{fill:${t.fg3};transform:rotate(0deg) scale(1)}94%{fill:${t.brand};transform:rotate(-14deg) scale(1.25)}100%{fill:${t.fg3};transform:rotate(0deg) scale(1)}}
.under{animation:under 10s ${EASE_OUT} infinite}
@keyframes under{0%{width:0}8%,100%{width:132px}}
.ring{animation:ring 3.2s ${EASE_OUT} infinite}
.ring.d1{animation-delay:1.05s}.ring.d2{animation-delay:2.1s}
@keyframes ring{0%{r:3;opacity:.8}55%{r:9;opacity:0}100%{r:9;opacity:0}}
.pop{animation:pop 3.2s ${EASE_SPRING} infinite}
.pop.p1{animation-delay:1.05s}.pop.p2{animation-delay:2.1s}
@keyframes pop{0%{transform:scale(1)}6%{transform:scale(1.35)}14%,100%{transform:scale(1)}}
.drift{animation:drift 14s ease-in-out infinite alternate}
@keyframes drift{from{transform:translateX(-30px)}to{transform:translateX(50px)}}
${REDUCED}
</style>
<defs>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="16"/></clipPath>
  <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="${t.line1}"/>
  </pattern>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${t.brand}" stop-opacity=".09"/>
    <stop offset="100%" stop-color="${t.brand}" stop-opacity="0"/>
  </radialGradient>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${t.bg0}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <g class="drift"><ellipse cx="300" cy="40" rx="340" ry="150" fill="url(#halo)"/></g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${t.line2}"/>

<text x="44" y="56" class="mono" font-size="12" letter-spacing="2" fill="${t.fg3}">hi, i'm</text>
<text x="42" y="116" class="disp" font-size="60" font-weight="700" fill="${t.fg1}">felix</text>
<rect class="under" x="44" y="130" width="132" height="4" rx="2" fill="${t.brand}"/>

${zap(44, 160, 0.62, 'zap')}
<text x="72" y="172" class="mono" font-size="${roleSize}" font-weight="600" fill="${t.brand}">&gt;</text>
<g class="roleA">
  <text x="${roleX}" y="172" class="mono" font-size="${roleSize}" fill="${t.fg2}">${roleA}</text>
  <rect class="cursor" x="${curA}" y="159" width="8" height="16" fill="${t.brand}"/>
</g>
<g class="roleB">
  <text x="${roleX}" y="172" class="mono" font-size="${roleSize}" fill="${t.fg2}">${roleB}</text>
  <rect class="cursor" x="${curB}" y="159" width="8" height="16" fill="${t.brand}"/>
</g>
${chipEls}

<line x1="44" y1="196" x2="${W - 44}" y2="196" stroke="${t.line1}"/>
<text x="44" y="220" class="mono" font-size="11.5" fill="${t.fg4}">currently at cicon ltd</text>
<g opacity=".9">
  ${check(W - 44 - passW - 18, 210, t.pass)}
  <text x="${W - 44 - passW}" y="220" class="mono" font-size="11.5" fill="${t.pass}">${passLine}</text>
</g>
</svg>`;
}

// ---------------------------------------------------------------- pipeline

function pipeline(t) {
  const W = 880, H = 312;
  const fs13 = 13, a = adv(fs13);
  const x0 = 30;
  const col = 34; // column (in chars) where checks align

  const cmd = '$ felix run release-gate --strict';
  const cmdW = cmd.length * a;

  const lines = [
    { label: 'type check', status: 'fully typed' },
    { label: 'playwright e2e', status: '128 passed · 1 skipped' },
    { label: 'docker build', status: 'multi-stage · cached' },
    { label: 'deploy', status: 'zero downtime' },
  ];
  // line reveal / check pop / status fade timings as % of the 12s cycle
  const times = [[11, 14, 16], [20, 23, 25], [29, 32, 34], [38, 41, 43]];

  const tag = 'releases, made boring.';
  const tagSize = 14, tagAdv = adv(tagSize);
  const tagX = 56, tagY = 224;
  const tagW = tag.length * tagAdv;

  const lineEls = lines.map((l, i) => {
    const y = 106 + i * 27;
    const dots = '.'.repeat(col - l.label.length - 3);
    const checkX = x0 + (col + 0.5) * a;
    const statusX = x0 + (col + 3) * a;
    return `
  <g class="rise r${i}">
    <text x="${x0}" y="${y}" class="mono" font-size="${fs13}"><tspan fill="${t.fg2}">&gt; ${l.label} </tspan><tspan fill="${t.fg4}">${dots}</tspan></text>
    ${check(checkX, y - 9.5, t.pass, `pop p${i}`, 1.05)}
    <text x="${statusX}" y="${y}" class="mono status s${i}" font-size="${fs13}" fill="${t.fg3}">${l.status}</text>
  </g>`;
  }).join('');

  const riseKf = times.map(([r], i) =>
    `.rise.r${i}{animation-name:rise${i}}@keyframes rise${i}{0%,${r}%{opacity:0;transform:translateY(7px)}${r + 2.5}%,100%{opacity:1;transform:translateY(0)}}`
  ).join('\n');
  const popKf = times.map(([, p], i) =>
    `.pop.p${i}{animation-name:pop${i}}@keyframes pop${i}{0%,${p}%{transform:scale(0)}${p + 1.6}%{transform:scale(1.3)}${p + 3.2}%,100%{transform:scale(1)}}`
  ).join('\n');
  const statusKf = times.map(([, , s], i) =>
    `.status.s${i}{animation-name:st${i}}@keyframes st${i}{0%,${s}%{opacity:0}${s + 2.5}%,100%{opacity:1}}`
  ).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="ci pipeline: type check, e2e, build and deploy all green — releases, made boring">
<style>
${fontCss('mono400', 'mono600')}
.mono{font-family:${MONO}}
.reset{animation:reset 12s linear infinite}
@keyframes reset{0%,93%{opacity:1}97%,99.9%{opacity:0}100%{opacity:1}}
.typeCmd{animation:typeCmd 12s steps(${cmd.length},jump-none) infinite}
@keyframes typeCmd{0%,1%{width:0}9%,100%{width:${cmdW.toFixed(1)}px}}
.rise,.pop,.status{animation-duration:12s;animation-timing-function:${EASE_OUT};animation-iteration-count:infinite}
.pop{animation-timing-function:${EASE_SPRING}}
${riseKf}
${popKf}
${statusKf}
.tagWrap{animation:tagWrap 12s linear infinite}
@keyframes tagWrap{0%,49%{opacity:0}50%,100%{opacity:1}}
.typeTag{animation:typeTag 12s steps(${tag.length},jump-none) infinite}
@keyframes typeTag{0%,50%{width:0}58%,100%{width:${(tagW + 4).toFixed(1)}px}}
.cursor{animation:blink 1s steps(2,jump-none) infinite}
@keyframes blink{0%{opacity:1}100%{opacity:0}}
.gate{animation:gate 12s ${EASE_OUT} infinite}
@keyframes gate{0%,9%{width:0;fill:${t.brand}}16%{width:205px}25%{width:410px}34%{width:615px}43%{width:820px;fill:${t.brand}}50%,100%{width:820px;fill:${t.pass}}}
.gateLabel{animation:gateLabel 12s linear infinite}
@keyframes gateLabel{0%,49%{opacity:0}53%,100%{opacity:1}}
${REDUCED}
</style>
<defs>
  <clipPath id="cmdClip"><rect class="typeCmd" x="${x0}" y="62" width="${cmdW.toFixed(1)}" height="22"/></clipPath>
  <clipPath id="tagClip"><rect class="typeTag" x="${tagX}" y="${tagY - 16}" width="${(tagW + 4).toFixed(1)}" height="22"/></clipPath>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${t.glowBrand.replace(/rgba\(([^)]+),[^,)]+\)/, 'rgb($1)')}" flood-opacity=".45"/>
  </filter>
</defs>

<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.bg1}" stroke="${t.line2}"/>
<circle cx="28" cy="21" r="5.5" fill="${t.fail}" opacity=".8"/>
<circle cx="48" cy="21" r="5.5" fill="${t.brandSoft}" opacity=".8"/>
<circle cx="68" cy="21" r="5.5" fill="${t.pass}" opacity=".8"/>
<text x="92" y="25.5" class="mono" font-size="12" fill="${t.fg3}">felix@qadence — release gate</text>
<text x="${W - 30}" y="25.5" text-anchor="end" class="mono" font-size="11.5" fill="${t.fg4}">ci · bash</text>
<line x1="1" y1="41" x2="${W - 1}" y2="41" stroke="${t.line1}"/>

<g class="reset">
  <g clip-path="url(#cmdClip)">
    <text x="${x0}" y="78" class="mono" font-size="${fs13}"><tspan fill="${t.brand}" font-weight="600">$</tspan><tspan fill="${t.fg1}"> felix run release-gate --strict</tspan></text>
  </g>
  ${lineEls}

  <g class="tagWrap">
    ${check(x0 + 4, tagY - 10, t.pass, '', 1.1)}
    <g clip-path="url(#tagClip)">
      <text x="${tagX}" y="${tagY}" class="mono" font-size="${tagSize}" font-weight="600" fill="${t.brand}" filter="url(#soft)">${tag}</text>
    </g>
    <rect class="cursor" x="${tagX + tagW + 7}" y="${tagY - 13}" width="8" height="15" fill="${t.brand}"/>
  </g>

  <text x="${W - 30}" y="262" text-anchor="end" class="mono gateLabel" font-size="11" fill="${t.pass}">gate: green</text>
  <rect x="${x0}" y="272" width="${W - 2 * x0}" height="4" rx="2" fill="${t.line1}"/>
  <rect class="gate" x="${x0}" y="272" width="820" height="4" rx="2" fill="${t.pass}"/>
</g>
</svg>`;
}

// ---------------------------------------------------------------- ticker

// Real brand logos from thesvg.org (cdn.jsdelivr.net/gh/glincker/thesvg),
// vendored into logos/ and inlined here — external images never load
// inside GitHub's camo-proxied <img>.
function loadLogo(slug, t) {
  let svg = fs.readFileSync(path.join(root, 'logos', `${slug}-default.svg`), 'utf8')
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  // namespace ids and class names so logos can't collide with each other
  // or with the component's own styles
  svg = svg
    .replace(/id="([^"]+)"/g, `id="tk-${slug}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#tk-${slug}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#tk-${slug}-$1"`)
    .replace(/class="([^"]+)"/g, (m, cl) => `class="${cl.split(/\s+/).map((c) => `tk-${slug}-${c}`).join(' ')}"`)
    .replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, attrs, css) =>
      `<style${attrs}>${css.replace(/\.([a-zA-Z0-9_-]+)\s*\{/g, `.tk-${slug}-$1{`)}</style>`);
  // white-only / currentColor marks need per-theme (or true brand) colors
  if (slug === 'flask') svg = svg.replace(/fill="#ffffff"/gi, `fill="${t.fg1}"`);
  if (slug === 'mysql') svg = svg.replace(/fill="#FFF"/gi, 'fill="#00758F"');
  if (slug === 'tensorflow') svg = svg.replace(/fill:\s*#fff\b/gi, 'fill:#FF6F00');
  if (slug === 'aws') svg = svg.replace(/fill="currentColor"/g, `fill="${t.id === 'dark' ? t.fg1 : '#232F3E'}"`);
  if (slug === 'vercel') svg = svg.replace(/fill="#fff"/g, `fill="${t.fg1}"`);
  if (slug === 'nextjs' && t.id === 'dark') {
    // black-circle mark: flip to a light disc with a bg-colored N for dark chips
    svg = svg
      .replace(/<g mask="([^"]+)"><circle cx="128" cy="128" r="128"\/>/, `<g mask="$1"><circle cx="128" cy="128" r="128" fill="${t.fg1}"/>`)
      .replace(/stop-color="#fff"/g, `stop-color="${t.bg1}"`);
  }
  // all-black glyph logos would vanish on the dark chips — flip them to fg1
  const DARKEN = new Set(['apache-kafka', 'langchain', 'owasp', 'oauth']);
  if (t.id === 'dark' && DARKEN.has(slug)) {
    svg = svg
      .replace(/fill="#(231f20|030710|000000|000)"/gi, `fill="${t.fg1}"`)
      .replace(/fill:\s*#(231f20|030710|000000|000)\b/gi, `fill:${t.fg1}`);
    if (slug === 'oauth') svg = svg.replace(/fill="#fff"/g, `fill="${t.bg1}"`);
  }
  // root-level presentation attrs (docker/onnx carry their brand fill there)
  const rootTag = svg.match(/^<svg[^>]*>/)[0];
  let rootFill = rootTag.match(/fill="([^"]+)"/)?.[1];
  if (t.id === 'dark' && DARKEN.has(slug)) rootFill = t.fg1;
  let inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  if (rootFill && rootFill !== 'none') inner = `<g fill="${rootFill}">${inner}</g>`;
  return { inner, viewBox };
}

function ticker(t) {
  const W = 880, H = 56;
  const fs12 = 12.5, a = adv(fs12);
  const chips = [
    { slug: 'typescript', label: 'typescript' },
    { slug: 'react', label: 'react' },
    { slug: 'nextjs', label: 'next.js' },
    { slug: 'playwright', label: 'playwright' },
    { slug: 'python', label: 'python' },
    { slug: 'fastapi', label: 'fastapi' },
    { slug: 'docker', label: 'docker' },
    { slug: 'onnx', label: 'onnx' },
    { slug: 'huggingface', label: 'hugging face' },
    { slug: 'modal', label: 'modal' },
    { slug: 'vercel', label: 'vercel' },
    { label: 'llama.cpp' },
    { label: 'rag pipelines' },
    { label: 'llm evals' },
  ];
  const gap = 10, padL = 12, logoGap = 8, padR = 15, logoSize = 17;

  const defs = [];
  let x = 0;
  const one = chips.map((c) => {
    let iconEl = '', iconW = 0;
    if (c.slug) {
      const { inner, viewBox } = loadLogo(c.slug, t);
      const [, , vw, vh] = viewBox;
      const s = logoSize / Math.max(vw, vh);
      const w = vw * s, h = vh * s;
      const [minx, miny] = viewBox;
      defs.push(`<g id="tk-${c.slug}" transform="scale(${s.toFixed(4)}) translate(${-minx},${-miny})">${inner}</g>`);
      iconEl = `<use href="#tk-${c.slug}" x="0" y="0" transform="translate(${padL},${(28 - h / 2).toFixed(1)})"/>`;
      iconW = w + logoGap;
    } else {
      iconEl = `<circle cx="${padL + 4}" cy="28" r="2.5" fill="${t.brand}"/>`;
      iconW = 8 + logoGap;
    }
    const w = padL + iconW + c.label.length * a + padR;
    const el = `
    <g transform="translate(${x.toFixed(1)},0)">
      <rect y="11" width="${w.toFixed(1)}" height="34" rx="17" fill="${t.bg1}" stroke="${t.line2}"/>
      ${iconEl}
      <text x="${(padL + iconW).toFixed(1)}" y="32.5" class="mono" font-size="${fs12}" fill="${t.fg2}">${c.label}</text>
    </g>`;
    x += w + gap;
    return el;
  }).join('');
  const total = x; // width of one full sequence incl. trailing gap
  const dur = Math.round(total / 42);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="stack: ${chips.map((c) => c.label).join(', ')}">
<style>
${fontCss('mono400')}
.mono{font-family:${MONO}}
.scroll{animation:scroll ${dur}s linear infinite}
@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(${(-total).toFixed(1)}px)}}
${REDUCED}
</style>
<defs>
  ${defs.join('\n  ')}
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="14"/></clipPath>
  <linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${t.bg0}"/><stop offset="1" stop-color="${t.bg0}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="fadeR" x1="1" y1="0" x2="0" y2="0">
    <stop offset="0" stop-color="${t.bg0}"/><stop offset="1" stop-color="${t.bg0}" stop-opacity="0"/>
  </linearGradient>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${t.bg0}"/>
  <g transform="translate(24,0)">
    <g class="scroll">${one}<g transform="translate(${total.toFixed(1)},0)">${one}</g></g>
  </g>
  <rect width="70" height="${H}" fill="url(#fadeL)"/>
  <rect x="${W - 70}" width="70" height="${H}" fill="url(#fadeR)"/>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="13.5" fill="none" stroke="${t.line2}"/>
</svg>`;
}

// ---------------------------------------------------------------- stack board

// full categorized stack — every category from the portfolio's about section.
// chips with a slug get the real logo; concept items get a brand-dot text chip.
const STACK = [
  { h: 'languages', items: [
    { slug: 'typescript', label: 'typescript' }, { slug: 'javascript', label: 'javascript' },
    { slug: 'python', label: 'python' }, { slug: 'linux', label: 'linux' }] },
  { h: 'backend frameworks', items: [
    { slug: 'fastapi', label: 'fastapi' }, { slug: 'flask', label: 'flask' },
    { slug: 'django', label: 'django' }, { slug: 'nestjs', label: 'nestjs' }] },
  { h: 'databases', items: [
    { slug: 'postgresql', label: 'postgresql' }, { slug: 'supabase', label: 'supabase' },
    { slug: 'mysql', label: 'mysql' }, { slug: 'sqlite', label: 'sqlite' },
    { slug: 'mongodb', label: 'mongodb' }, { slug: 'firebase', label: 'firebase / firestore' },
    { slug: 'redis', label: 'redis' }] },
  { h: 'frontend & ui', items: [
    { slug: 'react', label: 'react' }, { label: 'react flow' }, { slug: 'nextjs', label: 'next.js' },
    { slug: 'vite', label: 'vite' }, { slug: 'tailwindcss', label: 'tailwind css' }, { label: 'zustand' }] },
  { h: 'protocols', items: [
    { label: 'rest apis' }, { label: 'websockets' }, { slug: 'graphql', label: 'graphql' },
    { slug: 'oauth', label: 'oauth2 / oidc' }, { label: 'webhooks' }, { label: 'server-sent events' }] },
  { h: 'architecture & patterns', items: [
    { label: 'mvc / mvt' }, { label: 'dependency injection' }, { label: 'repository pattern' },
    { label: 'event-driven' }, { label: 'rate limiting' }, { label: 'caching strategies' },
    { label: 'serverless / faas' }] },
  { h: 'event streaming', items: [{ slug: 'apache-kafka', label: 'apache kafka' }] },
  { h: 'ai & machine learning', items: [
    { slug: 'pytorch', label: 'pytorch' }, { slug: 'tensorflow', label: 'tensorflow' },
    { slug: 'onnx', label: 'onnx' }, { slug: 'langchain', label: 'langchain' },
    { label: 'computer vision' }, { label: 'stable diffusion' }, { label: 'llm integration' }] },
  { h: 'data engineering', items: [
    { label: 'data pipelines' }, { slug: 'apache-airflow', label: 'apache airflow' },
    { label: 'statistical modelling' }] },
  { h: 'web scraping', items: [
    { slug: 'selenium', label: 'undetected chromedriver' }, { label: 'proxy networks' }] },
  { h: 'security testing', items: [
    { slug: 'burp-suite', label: 'burp suite' }, { slug: 'owasp', label: 'owasp zap' }] },
  { h: 'cloud & devops', items: [
    { slug: 'docker', label: 'docker' }, { slug: 'kubernetes', label: 'kubernetes' },
    { slug: 'git', label: 'git' }, { slug: 'github-actions', label: 'github actions' },
    { slug: 'google-cloud', label: 'gcp' }, { slug: 'aws', label: 'aws' },
    { slug: 'huawei', label: 'huawei cloud' }] },
];

function stack(t) {
  const W = 880;
  const fs12 = 12, a = adv(fs12);
  const labelX = 32, chipX0 = 232, chipXMax = W - 32;
  const chipH = 28, gapX = 8, gapY = 8, padL = 10, logoGap = 7, padR = 12, logoSize = 15, dotW = 8;
  const catGap = 18;

  let y = 34;
  const blocks = STACK.map((cat, ci) => {
    let x = chipX0, rowY = y;
    const chipEls = cat.items.map((c) => {
      let iconEl = '', iconW;
      let w;
      if (c.slug) {
        const { inner, viewBox } = loadLogo(c.slug, t);
        const [minx, miny, vw, vh] = viewBox;
        const s = logoSize / Math.max(vw, vh);
        const lw = vw * s, lh = vh * s;
        iconW = lw + logoGap;
        w = padL + iconW + c.label.length * a + padR;
        iconEl = `<g transform="translate(${padL},${((chipH - lh) / 2).toFixed(1)}) scale(${s.toFixed(4)}) translate(${-minx},${-miny})">${inner}</g>`;
      } else {
        iconW = dotW + logoGap;
        w = padL + iconW + c.label.length * a + padR;
        iconEl = `<circle cx="${padL + 3.5}" cy="${chipH / 2}" r="2.5" fill="${t.brand}"/>`;
      }
      if (x + w > chipXMax) { x = chipX0; rowY += chipH + gapY; }
      const el = `
    <g transform="translate(${x.toFixed(1)},${rowY})">
      <rect width="${w.toFixed(1)}" height="${chipH}" rx="${chipH / 2}" fill="${t.bg1}" stroke="${t.line2}"/>
      ${iconEl}
      <text x="${(padL + iconW).toFixed(1)}" y="${chipH / 2 + 4.5}" class="mono" font-size="${fs12}" fill="${t.fg2}">${esc(c.label)}</text>
    </g>`;
      x += w + gapX;
      return el;
    }).join('');

    const label = `<text x="${labelX}" y="${y + chipH / 2 + 4}" class="mono" font-size="11" letter-spacing="1.2" fill="${t.fg3}">${esc(cat.h)}</text>`;
    const block = `<g class="cat c${ci}">${label}${chipEls}</g>`;
    y = rowY + chipH + catGap;
    return block;
  }).join('\n');
  const H = y - catGap + 30;

  const stagger = STACK.map((_, i) => `.cat.c${i}{animation-delay:${(i * 0.09).toFixed(2)}s}`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="full stack: ${esc(STACK.map((c) => c.h).join(', '))}">
<style>
${fontCss('mono400')}
.mono{font-family:${MONO}}
.cat{animation:enter .55s ${EASE_OUT} backwards}
${stagger}
@keyframes enter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
${REDUCED}
</style>
<defs>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="16"/></clipPath>
  <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="${t.line1}"/>
  </pattern>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${t.bg0}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${t.line2}"/>
${blocks}
</svg>`;
}

// ---------------------------------------------------------------- live dot

function live() {
  const pass = '#34D17E';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" role="img" aria-label="live">
<style>
.ring{animation:ring 2.2s ${EASE_OUT} infinite}
@keyframes ring{0%{r:4;opacity:.9}70%{r:7.4;opacity:0}100%{r:7.4;opacity:0}}
${REDUCED}
</style>
<circle cx="8" cy="8" r="4" fill="${pass}"/>
<circle class="ring" cx="8" cy="8" r="4" fill="none" stroke="${pass}" stroke-width="1.4"/>
</svg>`;
}

// ---------------------------------------------------------------- emit

const outDir = path.join(root, 'assets');
fs.mkdirSync(outDir, { recursive: true });

const files = { 'live.svg': live() };
for (const t of Object.values(themes)) {
  files[`hero-${t.id}.svg`] = hero(t);
  files[`pipeline-${t.id}.svg`] = pipeline(t);
  files[`ticker-${t.id}.svg`] = ticker(t);
  files[`stack-${t.id}.svg`] = stack(t);
}
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), svg.trim() + '\n');
  console.log(`assets/${name}  ${(fs.statSync(path.join(outDir, name)).size / 1024).toFixed(1)} KB`);
}
