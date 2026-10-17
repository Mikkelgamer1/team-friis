// Al HTML til sitet. Tekster rettes her; tal, heste og resultater kommer fra data/travinfo.json.

export const SITE = {
  // ← Bekræft domænet før lancering (kan også sættes med miljøvariablen SITE_URL). På Vercel bruges projektets adresse.
  url: (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL) || 'https://www.mortenfriis.dk').replace(/\/$/, ''),
  navn: 'Team Friis',
  person: 'Morten Friis',
  fornavn: 'Morten',
  licens: 20245,
  telefon: '+45 24 26 64 99',
  email: 'teamfriis@outlook.dk',
  gade: 'Vittrupvej 19',
  sted: 'Lånum',
  postnr: '7850',
  by: 'Stoholm',
  slogan: ['Passion', 'Udvikling', 'Resultater'], // fra Team Friis' egne grafikker
  facebook: 'https://www.facebook.com/Team.Friis', // opslag vises som kort, når FB_SIDE/FB_TOKEN er sat i GitHub
  instagram: '', // ← profilens adresse, hvis stalden har en
  travinfo: 'https://travinfo.dk/licenseholder-tabs/20245',
  hjemmebane: 'https://www.skive-trav.dk/',
  kort: 'https://www.google.com/maps/search/?api=1&query=Vittrupvej+19%2C+7850+Stoholm',
};

// Samarbejdspartnere (logoerne står på Mortens løbsdragt).
const PARTNERE = [
  { navn: 'reron Fibertech', url: 'https://www.reronfibertech.dk/', logo: 'partner-reron.png', b: 274, h: 94, tekst: 'Specialister i fiber og lyslederkabler · Nykøbing Mors' },
  { navn: 'KRAFFT', url: 'https://www.kraffthestefoder.dk/', logo: 'partner-krafft.png', b: 400, h: 304, tekst: 'Hestefoder' },
];

// Billeder fra Team Friis' Facebook-side: navn → [forhold, bredder…]
const BILLEDER = {
  'hero': [1.829, 1200, 1800, 2048],
  'hero-mobil': [1, 700, 1100],
  'emblem': [1, 480, 900],
  'portraet': [1, 480, 720],
  'i-loeb': [1.332, 800, 1368],
  'fold-tre': [1.337, 600, 960],
  'traening-jog': [1.333, 600, 1224],
  'fold-portraet': [0.75, 600, 720],
  'traening-par': [1.333, 600, 1224],
  'fold-sol': [1.333, 600, 960],
  'traening-bane': [1.333, 600, 1224],
  'fold-rul': [1.333, 600, 960],
  'fold-brun': [0.75, 600, 720],
  'traening-sort': [1.155, 600, 1060],
  'fold-front': [0.75, 600, 720],
};
// Hestekort fra Facebook (hest-id → billede). Forlader hesten træningslisten, forsvinder kortet.
const HESTEKORT = { 638223: 'diamant-oestervang', 656269: 'melody', 654259: 'licorice-cash', 661285: 'huff-n-puff', 653910: 'lovely-day' };

const BANER = { Sk: 'Skive', 'Ål': 'Aalborg', 'År': 'Aarhus', Od: 'Odense', Ch: 'Charlottenlund', Bi: 'Billund', Bh: 'Bornholm', Ny: 'Nykøbing F.', Bs: 'Skovbo', Kl: 'Klampenborg', 'Åb': 'Åby', 'Jæ': 'Jägersro', Ax: 'Axevalla' };
// Banernes omtrentlige placering [længdegrad, breddegrad] til det skematiske Danmarkskort (svenske baner og Bornholm vises ikke).
const BANE_POS = { Sk: [9.06, 56.56], 'Ål': [9.87, 57.05], 'År': [10.2, 56.14], Od: [10.36, 55.4], Ch: [12.58, 55.75], Bi: [9.12, 55.73], Ny: [11.87, 54.77], Bs: [12.03, 55.46], Kl: [12.59, 55.77] };
const HJEM = 'Sk';
const SVENSKE = ['Åb', 'Jæ', 'Ax'];
const NAV = [['om-morten/', 'Om Morten'], ['stalden/', 'Stalden'], ['heste/', 'Heste'], ['resultater/', 'Resultater']];

// ---------- små hjælpere ----------

let R = ''; // sti tilbage til roden fra den side, der bygges
let V = ''; // versionsmærke til css/js
let KORT;   // Danmarks omrids og projektionstal fra data/danmark.json

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf = (n) => Number(n).toLocaleString('da-DK');
const kr = (n) => `${nf(n)}&nbsp;kr.`;
const d = (iso) => new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
const langDato = (iso) => new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d(iso));
const kortDato = (iso) => new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d(iso));
const ugedag = (iso) => new Intl.DateTimeFormat('da-DK', { weekday: 'long', timeZone: 'UTC' }).format(d(iso));
const dkListe = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} og ${a.at(-1)}`);
// API'et giver kun en kode. Ukendte koder er udenlandske baner (alle danske står i BANER), så de vises som Udlandet.
const bane = (kode) => BANER[kode] ?? 'Udlandet';
const tlfLink = SITE.telefon.replace(/\s/g, '');

/** "16,0a" → "1.16,0a". Tomt, hvis der ikke er en tid (fx galop uden tid). */
export const tid = (t) => (/^\d\d,\d/.test(t ?? '') ? `1.${t}` : '');

/** Hurtigste tid i en rekordstreng som "18,7k 14,3m *12,2am" → "1.12,2am". */
export const bedsteRekord = (mark) => {
  const tider = String(mark ?? '').replace(/\*/g, '').split(/\s+/).filter((x) => /^\d\d,\d/.test(x));
  tider.sort((a, b) => parseFloat(a.replace(',', '.')) - parseFloat(b.replace(',', '.')));
  return tider.length ? `1.${tider[0]}` : '';
};

/** Placering som den vises: 1, 2, 3 … "–" for uplaceret, "disk." for diskvalificeret. */
export const plac = (p) => (/^[1-9]\d*$/.test(p) ? p : p === 'd' ? 'disk.' : '–');

const pil = '<svg class="pil" viewBox="0 0 22 10" width="22" height="10" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const ud = '<svg class="ud" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M1 9 9 1M3 1h6v6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const nyFane = '<span class="sr"> (åbner i ny fane)</span>';
const ekstern = (href, tekst, cls = 'link') => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${tekst} ${ud}${nyFane}</a>`;
const knap = (href, tekst, cls = '') => `<a class="knap ${cls}" href="${R}${href}">${tekst} ${pil}</a>`;
const link = (href, tekst, cls = '') => `<a class="link ${cls}" href="${R}${href}">${tekst} ${pil}</a>`;

const billede = (navn, alt, { sizes = '100vw', lazy = true, cls = '' } = {}) => {
  const [forhold, ...bredder] = BILLEDER[navn];
  const max = bredder.at(-1);
  return `<img${cls ? ` class="${cls}"` : ''} src="${R}assets/img/${navn}-${bredder[0]}.webp" srcset="${bredder.map((w) => `${R}assets/img/${navn}-${w}.webp ${w}w`).join(', ')}" sizes="${sizes}" width="${max}" height="${Math.round(max / forhold)}" alt="${esc(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>`;
};
const etiket = (tekst, attr = '') => `<p class="etiket"${attr}>${tekst}</p>`;

// ---------- afledte tal ----------

function afled(data, idag) {
  const heste = [...data.heste].sort((a, b) => b.praemier - a.praemier || a.navn.localeCompare(b.navn, 'da'));
  const navne = new Map(heste.map((h) => [h.id, h.navn]));
  const medNavn = (r) => ({ ...r, hest: navne.get(r.hestId) ?? r.hest });
  const saeson = data.traenerStatistik.find((s) => s.sejre > 0) ?? data.traenerStatistik.find((s) => s.starter > 0) ?? data.traenerStatistik[0];
  const kusk = data.kuskStatistik.find((s) => s.aar === saeson.aar) ?? data.kuskStatistik[0];
  const iAar = data.resultater.filter((r) => r.dato.startsWith(String(saeson.aar)));
  const prNavn = {};
  for (const r of iAar) (prNavn[bane(r.bane)] ??= { kode: r.bane, navn: bane(r.bane), antal: 0 }).antal++;
  const banetal = Object.values(prNavn).sort((a, b) => b.antal - a.antal);
  const traenerAar = data.traenerStatistik.filter((s) => s.starter > 0);
  return {
    heste,
    saeson,
    kusk,
    opdateret: langDato(data.opdateret),
    seneste: data.resultater.slice(0, 10).map(medNavn),
    kommende: data.kommende.filter((k) => k.dato >= idag).map(medNavn),
    banetal,
    banerIAar: [...banetal.filter((b) => b.navn !== 'Udlandet').map((b) => b.navn), ...(prNavn.Udlandet ? ['udenlandske baner'] : [])],
    svenske: banetal.filter((b) => SVENSKE.includes(b.kode)).map((b) => b.navn),
    hjemmestarter: prNavn[bane(HJEM)]?.antal ?? 0,
    ungheste: heste.filter((h) => h.alder <= 2),
    aldre: [Math.min(...heste.map((h) => h.alder)), Math.max(...heste.map((h) => h.alder))],
    femAar: { aar: traenerAar.length, sejre: traenerAar.reduce((s, x) => s + x.sejre, 0), starter: traenerAar.reduce((s, x) => s + x.starter, 0), fra: traenerAar.at(-1)?.aar },
    fb: (data.facebook ?? []).slice(0, 5),
    kortheste: heste.filter((h) => HESTEKORT[h.id]),
  };
}

// ---------- fælles dele ----------

const maerke = (cls = '') => `<span class="maerke ${cls}"><img src="${R}assets/img/emblem-480.webp" width="480" height="480" alt=""><span>Team <b>Friis</b></span></span>`;

const top = (sti) => `
<header class="top${sti === '' ? ' top--hero' : ''}">
  <div class="top__inner wrap">
    <a class="top__logo" href="${R || './'}" aria-label="${SITE.navn} – til forsiden">${maerke()}</a>
    <nav class="top__nav" aria-label="Primær navigation">
      ${NAV.map(([href, navn]) => `<a href="${R}${href}"${sti.startsWith(href) ? ' aria-current="page"' : ''}>${navn}</a>`).join('\n      ')}
    </nav>
    <a class="top__tlf" href="tel:${tlfLink}"><span class="sr">Ring til ${SITE.fornavn}: </span>${SITE.telefon}</a>
    <a class="knap knap--lille top__cta" href="${R}kontakt/"${sti.startsWith('kontakt/') ? ' aria-current="page"' : ''}>Kontakt</a>
    <button class="burger" type="button" aria-haspopup="dialog" aria-controls="menu" commandfor="menu" command="show-modal"><span>Menu</span><i aria-hidden="true"></i></button>
  </div>
</header>
<dialog class="menu" id="menu" aria-label="Menu">
  <div class="menu__top wrap">
    ${maerke()}
    <button class="burger burger--luk" type="button" data-luk commandfor="menu" command="close"><span>Luk</span><i aria-hidden="true"></i></button>
  </div>
  <nav class="menu__nav wrap" aria-label="Menu">
    <ul>
      ${[['', 'Forside'], ...NAV, ['kontakt/', 'Kontakt']].map(([href, navn], i) => `<li style="--i:${i}"><a href="${R}${href || (R ? '' : './')}"${(href ? sti.startsWith(href) : sti === '') ? ' aria-current="page"' : ''}>${navn}</a></li>`).join('\n      ')}
    </ul>
  </nav>
  <div class="menu__bund wrap">
    <a href="tel:${tlfLink}">${SITE.telefon}</a>
    <a href="mailto:${SITE.email}">${SITE.email}</a>
  </div>
</dialog>`;

const kontaktbaand = () => `
<section class="cta">
  <div class="wrap cta__inner">
    <div>
      ${etiket('Kontakt', ' data-vis')}
      <h2 data-vis style="--i:1">Skal din hest i træning hos Team Friis?</h2>
      <p data-vis style="--i:2">Ring, send en sms eller skriv – så tager I en snak om hesten og mulighederne.</p>
    </div>
    <div class="cta__valg" data-vis style="--i:3">
      <a class="cta__tlf" href="tel:${tlfLink}">${SITE.telefon}</a>
      <p class="valg"><a class="knap knap--hvid" href="mailto:${SITE.email}">Skriv en mail ${pil}</a> ${link('kontakt/', 'Alle kontaktoplysninger', 'link--lys')}</p>
    </div>
  </div>
</section>`;

const partnere = () => `
<section class="sek sek--moerk sek--smal">
  <div class="wrap partnere">
    <div>
      ${etiket('Samarbejdspartnere', ' data-vis')}
      <h2 data-vis style="--i:1">Med på holdet.</h2>
    </div>
    <ul class="partnere__liste">${PARTNERE.map((p, i) => `
      <li data-vis style="--i:${i + 1}"><a href="${p.url}" target="_blank" rel="noopener"><img src="${R}assets/img/${p.logo}" width="${p.b}" height="${p.h}" alt="${esc(p.navn)}" loading="lazy"><span>${esc(p.tekst)} ${ud}</span>${nyFane}</a></li>`).join('')}
    </ul>
  </div>
</section>`;

const bund = (o) => `
<footer class="bund">
  <div class="wrap bund__gitter">
    <div class="bund__brand">
      ${maerke('maerke--stor')}
      <p>${SITE.slogan.join(' · ')}. Professionel travtræning med Skive Trav som hjemmebane.</p>
    </div>
    <nav aria-label="Sider">
      <h2>Sider</h2>
      <ul>
        ${[...NAV, ['kontakt/', 'Kontakt']].map(([href, navn]) => `<li><a href="${R}${href}">${navn}</a></li>`).join('')}
      </ul>
    </nav>
    <div>
      <h2>Kontakt</h2>
      <ul>
        <li><a href="tel:${tlfLink}">${SITE.telefon}</a></li>
        <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
        <li><address>${SITE.gade}, ${SITE.sted}<br>${SITE.postnr} ${SITE.by}</address></li>
      </ul>
    </div>
    <div>
      <h2>Følg med</h2>
      <ul>
        ${SITE.facebook ? `<li>${ekstern(SITE.facebook, 'Facebook', '')}</li>` : ''}
        ${SITE.instagram ? `<li>${ekstern(SITE.instagram, 'Instagram', '')}</li>` : ''}
        <li>${ekstern(SITE.travinfo, 'Travinfo', '')}</li>
        <li>${ekstern(SITE.hjemmebane, 'Skive Trav', '')}</li>
      </ul>
    </div>
  </div>
  <div class="wrap bund__linje">
    <p>Resultater og statistik: Dansk Hestevæddeløb · opdateret ${o.opdateret}</p>
    <p>Billeder: Team Friis' Facebook-side</p>
    <p>© ${new Date().getFullYear()} ${SITE.navn}</p>
  </div>
</footer>`;

const organisation = () => ({
  '@type': ['LocalBusiness', 'SportsOrganization'],
  '@id': `${SITE.url}/#stald`,
  name: SITE.navn,
  description: 'Professionel travtræning med Skive Trav som hjemmebane: træning af løbsheste og tilkøring af ungheste.',
  url: `${SITE.url}/`,
  telephone: tlfLink,
  email: SITE.email,
  image: `${SITE.url}/assets/img/og.jpg`,
  logo: `${SITE.url}/assets/img/emblem-480.webp`,
  sport: 'Travsport',
  address: { '@type': 'PostalAddress', streetAddress: SITE.gade, postalCode: SITE.postnr, addressLocality: SITE.by, addressCountry: 'DK' },
  founder: { '@id': `${SITE.url}/#person` },
  sameAs: [SITE.travinfo, SITE.facebook, SITE.instagram].filter(Boolean),
});
const person = () => ({
  '@type': 'Person',
  '@id': `${SITE.url}/#person`,
  name: SITE.person,
  jobTitle: 'Professionel travtræner og kusk',
  url: `${SITE.url}/om-morten/`,
  image: `${SITE.url}/assets/img/portraet-720.webp`,
  worksFor: { '@id': `${SITE.url}/#stald` },
  sameAs: [SITE.travinfo],
});

function layout({ sti, titel, beskrivelse, indhold, o, klasse = '', noindex = false }) {
  const kanonisk = `${SITE.url}/${sti}`;
  const sideNavn = [...NAV, ['kontakt/', 'Kontakt']].find(([href]) => href === sti)?.[1];
  const graf = [
    { '@type': 'WebSite', '@id': `${SITE.url}/#website`, url: `${SITE.url}/`, name: SITE.navn, inLanguage: 'da-DK' },
    organisation(),
    person(),
    ...(sideNavn ? [{ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Forside', item: `${SITE.url}/` }, { '@type': 'ListItem', position: 2, name: sideNavn, item: kanonisk }] }] : []),
  ];
  return `<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titel)}</title>
<meta name="description" content="${esc(beskrivelse)}">
${noindex ? '<meta name="robots" content="noindex">' : '<link rel="canonical" href="' + kanonisk + '">'}
<meta name="theme-color" content="#070b18">
<meta property="og:type" content="website">
<meta property="og:locale" content="da_DK">
<meta property="og:site_name" content="${SITE.navn}">
<meta property="og:title" content="${esc(titel)}">
<meta property="og:description" content="${esc(beskrivelse)}">
<meta property="og:url" content="${kanonisk}">
<meta property="og:image" content="${SITE.url}/assets/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Team Friis – travtræner Morten Friis, Skive">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="48x48" href="${R}assets/img/ikon-48.png">
<link rel="apple-touch-icon" href="${R}assets/img/ikon-180.png">
<link rel="preload" href="${R}assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${R}assets/css/site.css?v=${V}">
<script>document.documentElement.classList.add('js');setTimeout(function(){window.__klar||document.documentElement.classList.remove('js')},2500)</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graf }).replace(/</g, '\\u003c')}</script>
</head>
<body class="${klasse}">
<a class="skip" href="#indhold">Spring til indhold</a>
${top(sti)}
<main id="indhold">
${indhold}
</main>
${bund(o)}
<script src="${R}assets/js/site.js?v=${V}" defer></script>
</body>
</html>
`;
}

// Sidehoved på undersider: mørkt felt med et af stallens billeder bagved, stor titel og nøgletal som "chips".
const sidehoved = ({ sti, h1, tekst, foto, pos = '50% 50%', chips = [] }) => `
<section class="sidehoved">
  <div class="sidehoved__foto" style="--pos:${pos}">${billede(foto, '', { lazy: false })}</div>
  <div class="wrap sidehoved__inner">
    <nav class="sti" aria-label="Brødkrumme"><a href="${R}">Forside</a><span aria-hidden="true">/</span><span aria-current="page">${sti}</span></nav>
    <h1>${h1}</h1>
    <p class="indled">${tekst}</p>
    ${chips.length ? `<ul class="chips">${chips.map(([tal, tekst]) => `<li><b>${tal}</b> ${tekst}</li>`).join('')}</ul>` : ''}
  </div>
</section>`;

/**
 * Skematisk Danmarkskort. `punkter` er [{ kode, navn, antal? }]: med antal tegnes en boble med tallet i,
 * uden antal en lille prik. Hjemmebanen får en ring, og der tegnes linjer derfra til de andre baner.
 */
function danmarkskort(punkter, beskrivelse) {
  const { bredde, hoejde, lon0, lat1, kx, ky, sti } = KORT;
  const max = Math.max(1, ...punkter.map((p) => p.antal ?? 0));
  const vist = punkter.filter((p) => BANE_POS[p.kode]).map((p) => {
    const [lon, lat] = BANE_POS[p.kode];
    const r = p.antal ? +(8 + 6 * Math.sqrt(p.antal / max)).toFixed(1) : 7;
    return { ...p, x: +((lon - lon0) * kx).toFixed(1), y: +((lat1 - lat) * ky).toFixed(1), r, ydre: p.kode === HJEM ? r + (p.antal ? 4 : 6) : r };
  });
  const hjem = vist.find((p) => p.kode === HJEM);
  const ruter = hjem ? vist.filter((p) => p !== hjem) : [];

  // Navnet sættes dér, hvor det bedst holder sig inden for kortet og fri af ruter og andre baner.
  const navn = (p) => {
    const w = p.navn.length * 6.4, m = p.ydre + 6;
    const steder = [['start', p.x + m, p.y + 3.7], ['middle', p.x, p.y + m + 9], ['end', p.x - m, p.y + 3.7], ['end', Math.min(p.x + p.ydre, bredde - 4), p.y + m + 9], ['middle', p.x, p.y - m - 2]];
    const straf = ([anker, x, y]) => { // 100 for at stikke ud over kortet, 10 for at ramme en rute eller en anden bane
      const x0 = (anker === 'start' ? x : anker === 'end' ? x - w : x - w / 2) - 3, x1 = x0 + w + 6, y0 = y - 12, y1 = y + 4;
      const inde = (px, py, luft = 0) => px > x0 - luft && px < x1 + luft && py > y0 - luft && py < y1 + luft;
      const udenfor = x0 < 0 || x1 > bredde || y0 < 0 || y1 > hoejde;
      const rammer = vist.some((q) => q !== p && inde(q.x, q.y, q.ydre))
        || ruter.some((q) => { for (let t = 0; t <= 1; t += 0.02) if (inde(hjem.x + (q.x - hjem.x) * t, hjem.y + (q.y - hjem.y) * t)) return true; return false; });
      return (udenfor ? 100 : 0) + (rammer ? 10 : 0);
    };
    // Hjemmebanen helst til venstre, uden for viften af ruter. Ved lige straf vinder det første sted på listen.
    const [anker, x, y] = (p === hjem ? [steder[2], ...steder] : steder).map((sted, i) => [straf(sted) + i / 100, sted]).sort((a, b) => a[0] - b[0])[0][1];
    return `<text class="kort__navn" x="${+x.toFixed(1)}" y="${+y.toFixed(1)}" text-anchor="${anker}">${esc(p.navn)}</text>`;
  };

  return `<svg class="kort__svg" viewBox="0 0 ${bredde} ${hoejde}" role="img" aria-label="${esc(beskrivelse)}">
        <defs><linearGradient id="rute" x1="0" x2="1"><stop offset="0" stop-color="#4f8bff"/><stop offset="1" stop-color="#4cc46a"/></linearGradient></defs>
        <path class="kort__land" d="${sti}"/>${ruter.map((p, i) => `
        <path class="kort__rute" pathLength="1" d="M${hjem.x},${hjem.y}L${p.x},${p.y}" style="--n:${i}"/>`).join('')}${vist.map((p, i) => `
        <g class="kort__bane" style="--n:${i}">${p === hjem ? `<circle class="kort__ring" cx="${p.x}" cy="${p.y}" r="${p.ydre}"/>` : ''}<circle class="kort__prik" cx="${p.x}" cy="${p.y}" r="${p.r}"/>${p.antal ? `<text class="kort__tal" x="${p.x}" y="${+(p.y + 3.3).toFixed(1)}" text-anchor="middle">${p.antal}</text>` : ''}${navn(p)}</g>`).join('')}
      </svg>`;
}

// ---------- genbrugte blokke ----------

const plKlasse = (p) => (p === '1' ? ' pl--1' : /^[23]$/.test(p) ? ' pl--23' : p === 'd' ? ' pl--tekst' : '');

const resultatRaekke = (r) => `
      <li class="res__r">
        <span class="pl${plKlasse(r.placering)}"><span class="sr">Placering: </span>${plac(r.placering)}</span>
        <span class="res__hest">${esc(r.hest)}</span>
        <span class="res__info"><time datetime="${r.dato}">${kortDato(r.dato)}</time> · ${esc(bane(r.bane))} · ${r.loeb}. løb · ${nf(r.distance)}&nbsp;m</span>
        <span class="res__tid">${tid(r.tid) || '<span aria-hidden="true">–</span><span class="sr">ingen tid</span>'}</span>
        <span class="res__kr">${r.praemie ? kr(r.praemie) : '<span aria-hidden="true">–</span><span class="sr">ingen præmie</span>'}</span>
      </li>`;
const resultatliste = (liste) => `<ol class="res">${liste.map(resultatRaekke).join('')}
    </ol>`;

const kommendeListe = (liste) => `<ul class="kom">${liste.map((k) => `
      <li>
        <time datetime="${k.dato}"><b>${new Date(`${k.dato}T12:00:00Z`).getUTCDate()}</b>${kortDato(k.dato).replace(/^\d+\.\s*/, '')}</time>
        <span class="kom__hest">${esc(k.hest)}</span>
        <span class="kom__bane">${ugedag(k.dato)} · ${esc(bane(k.bane))} · ${k.loeb}. løb${k.kusk ? ` · ${esc(k.kusk)}` : ''}</span>
      </li>`).join('')}
    </ul>`;
const ingenStarter = () => `<p class="tom">Ingen af staldens heste er startmeldt lige nu. Nye startlister kommer på ${ekstern(SITE.travinfo, 'Travinfo')}.</p>`;

const omHest = (h) => `${h.alder}-årig ${esc(h.koen.toLowerCase())}`;
const afstamning = (h) => (h.far ? `e. ${esc(h.far)} – ${esc(h.mor)}` : '');
const sejre = (h) => Number(h.placeringer.split('-')[0]) || 0;

// Profilkort for de mest vindende heste.
const profilkort = (h, i) => `
      <a class="profil" href="https://travinfo.dk/horse_tabs/${h.id}" target="_blank" rel="noopener" data-vis style="--i:${i % 6}">
        <span class="profil__nr" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <h3>${esc(h.navn)}</h3>
        <p>${omHest(h)}${afstamning(h) ? `<br>${afstamning(h)}` : ''}</p>
        <p class="profil__kr">${kr(h.praemier)}<small>indkørt</small></p>
        <dl>
          <div><dt>Starter</dt><dd>${h.starter}</dd></div>
          <div><dt>Sejre</dt><dd>${sejre(h)}</dd></div>
          <div><dt>Rekord</dt><dd>${bedsteRekord(h.rekord) || '–'}</dd></div>
        </dl>
        <span class="profil__ud">Travinfo ${ud}${nyFane}</span>
      </a>`;

// Hestekortene fra Facebook.
const hestekort = (heste) => `<ul class="hestekort" aria-label="Hestekort fra Team Friis' Facebook">${heste.map((h, i) => `
      <li data-vis style="--i:${i}"><a href="https://travinfo.dk/horse_tabs/${h.id}" target="_blank" rel="noopener"><img src="${R}assets/img/hest-${HESTEKORT[h.id]}-600.webp" srcset="${R}assets/img/hest-${HESTEKORT[h.id]}-600.webp 600w, ${R}assets/img/hest-${HESTEKORT[h.id]}-1200.webp 1200w" sizes="(min-width: 1100px) 24vw, 80vw" width="1200" height="900" alt="Hestekort for ${esc(h.navn)} fra Team Friis" loading="lazy" decoding="async"><span>${esc(h.navn)} ${ud}${nyFane}</span></a></li>`).join('')}
    </ul>`;

// Hesterække til den fulde træningsliste.
const hesteraekke = (h, i) => `
      <li class="hest" data-vis style="--i:${i % 6}">
        <div class="hest__navn">
          <h3><a href="https://travinfo.dk/horse_tabs/${h.id}" target="_blank" rel="noopener">${esc(h.navn)}${nyFane}</a></h3>
          <p>${omHest(h)}${afstamning(h) ? ` · ${afstamning(h)}` : ''}</p>
        </div>
        ${h.starter ? `<dl class="hest__tal">
          <div><dt>Starter</dt><dd>${h.starter} <small>${esc(h.placeringer)}</small></dd></div>
          <div><dt>Indkørt</dt><dd>${kr(h.praemier)}</dd></div>
          <div><dt>Rekord</dt><dd>${bedsteRekord(h.rekord) || '–'}</dd></div>
        </dl>` : '<p class="hest__tal hest__tal--tom">Ustartet</p>'}
      </li>`;
const hestegruppe = (titel, heste) => (heste.length ? `
    <div class="gruppe">
      <h2 class="gruppe__titel" data-vis>${titel} <span>${heste.length}</span></h2>
      <ul class="hesteliste">${heste.map(hesteraekke).join('')}
      </ul>
    </div>` : '');

const ydelser = (o) => `
    <ul class="ydelser">
      <li data-vis>
        <span class="ydelser__ikon" aria-hidden="true">01</span>
        <h3>Træning af løbsheste</h3>
        <p>Stalden træner og starter løbsheste på baner over hele landet. I ${o.saeson.aar} har staldens heste været til start i ${dkListe(o.banerIAar)}.</p>
      </li>
      <li data-vis style="--i:1">
        <span class="ydelser__ikon" aria-hidden="true">02</span>
        <h3>Tilkøring af ungheste</h3>
        <p>Ungheste køres til og bygges op mod deres første starter.${o.ungheste.length > 1 ? ` Lige nu står ${o.ungheste.length} åringer og 2-årige på træningslisten.` : ''}</p>
      </li>
      <li data-vis style="--i:2">
        <span class="ydelser__ikon" aria-hidden="true">03</span>
        <h3>Træner og kusk</h3>
        <p>${SITE.fornavn} kører selv mange af staldens heste – i ${o.kusk.aar} er det blevet til ${o.kusk.starter} starter og ${o.kusk.sejre} sejre som kusk.</p>
      </li>
    </ul>`;

const galleri = (n = 8) => {
  const fotos = [
    ['fold-tre', 'Tre heste på folden i solskin'],
    ['traening-jog', 'Travhest i træning på Skive Trav'],
    ['fold-portraet', 'Mørk travhest tæt på ved folden'],
    ['traening-par', 'To heste i træning en frisk formiddag'],
    ['fold-sol', 'Travhest på folden i sommersol'],
    ['traening-bane', 'Formiddagstræning på Skive Trav'],
    ['fold-rul', 'Hest ruller sig i sandet på folden'],
    ['fold-brun', 'Brun travhest på folden'],
  ].slice(0, n);
  return `<ul class="galleri">${fotos.map(([navn, alt], i) => `
      <li data-vis style="--i:${i % 4}">${billede(navn, alt, { sizes: '(min-width: 1000px) 30vw, 50vw' })}</li>`).join('')}
    </ul>`;
};

const banebjaelker = (banetal) => {
  const max = Math.max(1, ...banetal.map((b) => b.antal));
  return `<ul class="baner">${banetal.map((b) => `
        <li style="--w:${Math.round((b.antal / max) * 100)}%"><span>${esc(b.navn)}</span><b>${b.antal}</b></li>`).join('')}
      </ul>`;
};

const statTabel = (titel, raekker) => `
      <div class="tabelboks" role="region" aria-label="${titel}" tabindex="0">
        <table class="tabel">
          <caption>${titel}</caption>
          <thead><tr><th scope="col">År</th><th scope="col">Starter</th><th scope="col">1.–2.–3.</th><th scope="col">Sejrs&shy;procent</th><th scope="col">Præmiesum</th></tr></thead>
          <tbody>${raekker.filter((s) => s.starter > 0).map((s) => `
            <tr><th scope="row">${s.aar}</th><td>${s.starter}</td><td>${s.sejre}–${s.toer}–${s.treer}</td><td>${s.procent}&nbsp;%</td><td>${kr(s.praemier)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;

const formkurve = (liste) => `<ol class="form" aria-label="Placeringer i de seneste ${liste.length} starter, nyeste først">${liste.map((r) => `<li class="pl${plKlasse(r.placering)}"><span class="sr">${esc(r.hest)}: </span>${plac(r.placering)}</li>`).join('')}</ol>`;

/** Lang tekst forkortes ved et ordskifte. */
const kortTekst = (s, max = 240) => (s.length <= max ? s : `${s.slice(0, s.lastIndexOf(' ', max))}…`);

// De seneste Facebook-opslag (hentet af build.mjs) som kort. Vises kun, når der er opslag.
const fbKort = (liste) => `
    <ul class="fbkort" aria-label="Seneste opslag fra Facebook">${liste.map((p, i) => `
      <li data-vis style="--i:${i}">
        <a href="${esc(p.link)}" target="_blank" rel="noopener">
          ${p.billede ? `<img src="${R}assets/fb/${p.billede}" alt="" loading="lazy" decoding="async">` : ''}
          <time datetime="${p.dato}">${langDato(p.dato)}</time>
          ${p.tekst ? `<p>${esc(kortTekst(p.tekst))}</p>` : ''}
          <span class="fbkort__mere">Se opslaget på Facebook ${ud}</span>${nyFane}
        </a>
      </li>`).join('')}
    </ul>`;

const foelg = (fb = []) => (SITE.facebook || SITE.instagram || fb.length ? `
<section class="sek sek--lys">
  <div class="wrap foelg">
    <div>
      ${etiket('Følg med', ' data-vis')}
      <h2 data-vis style="--i:1">Hverdagen hos Team Friis.</h2>
      <p data-vis style="--i:2">Startdage, sejre og livet i stalden deles løbende på Facebook${fb.length ? ' – her er de seneste opslag' : ''}.</p>
      <p class="valg" data-vis style="--i:3">
        ${SITE.facebook ? ekstern(SITE.facebook, 'Team Friis på Facebook', 'knap knap--blaa') : ''}
        ${SITE.instagram ? ekstern(SITE.instagram, 'Instagram', 'knap knap--kant') : ''}
      </p>
    </div>
    <div>
      ${SITE.facebook && !fb.length ? `<div class="fb" data-fb="${SITE.facebook}">
        <button class="knap knap--kant" type="button">Vis de seneste opslag ${pil}</button>
        <p class="fb__note">Opslagene hentes fra Facebook og sætter cookies derfra.</p>
      </div>` : ''}
    </div>
  </div>
  ${fb.length ? `<div class="wrap">${fbKort(fb)}</div>` : ''}
</section>` : '');

// ---------- sider ----------

const forside = (o) => `
<section class="hero">
  <picture class="hero__foto">
    <source media="(max-aspect-ratio: 1/1)" srcset="${R}assets/img/hero-mobil-700.webp 700w, ${R}assets/img/hero-mobil-1100.webp 1100w" sizes="100vw">
    ${billede('hero', 'Team Friis\' heste løber på folden i solnedgang', { lazy: false })}
  </picture>
  <div class="wrap hero__gitter">
    <div class="hero__tekst">
      <p class="etiket etiket--lys">Team Friis · Travtræner · Skive Trav</p>
      <h1>Morten <span>Friis</span></h1>
      <p class="hero__slogan">${SITE.slogan.map((s) => `<span>${s}</span>`).join('')}</p>
      <p class="hero__indled">Professionel travtræner og kusk med Skive Trav som hjemmebane. Stalden ligger i ${SITE.sted} ved ${SITE.by} og har ${o.heste.length} heste i træning.</p>
      <p class="valg">${knap('kontakt/', 'Kontakt Morten')} ${knap('heste/', 'Se hestene', 'knap--glas')}</p>
    </div>
    <figure class="emblem">${billede('emblem', 'Team Friis-emblemet: Morten Friis, travtræner', { sizes: '(min-width: 901px) 30vw, 60vw', lazy: false })}</figure>
  </div>
</section>

<section class="tal" aria-label="Sæsonen i tal">
  <div class="wrap">
    <div class="tal__kort">
      <div class="tal__titel"><b>Sæson ${o.saeson.aar}</b><span>som træner</span></div>
      <dl>
        <div><dt>Starter</dt><dd>${o.saeson.starter}</dd></div>
        <div><dt>Sejre</dt><dd>${o.saeson.sejre}</dd></div>
        <div><dt>Sejrsprocent</dt><dd>${o.saeson.procent}<small>%</small></dd></div>
        <div><dt>Indkørt</dt><dd>${nf(o.saeson.praemier)}<small>kr.</small></dd></div>
      </dl>
      <div class="tal__naeste">
        <span>Næste start</span>
        ${o.kommende.length ? `<b>${esc(o.kommende[0].hest)}</b><em>${ugedag(o.kommende[0].dato)} ${kortDato(o.kommende[0].dato)} · ${esc(bane(o.kommende[0].bane))}</em>` : '<b>Ingen startmeldte</b><em>Startlister på Travinfo</em>'}
      </div>
    </div>
  </div>
</section>

<section class="sek sek--lys">
  <div class="wrap traener">
    <figure class="traener__foto" data-vis>${billede('portraet', 'Morten Friis i løbsdragten', { sizes: '(min-width: 901px) 34vw, 90vw' })}<figcaption><b>Morten Friis</b>Træner og kusk · A1-licens</figcaption></figure>
    <div>
      ${etiket('Træneren', ' data-vis')}
      <h2 data-vis style="--i:1">Manden bag Team Friis.</h2>
      <p class="indled" data-vis style="--i:2">${SITE.person} er født i 1983 og har A1-licens som både træner og kusk. Han træner hestene hjemme i ${SITE.sted} og kører selv mange af dem i løb.</p>
      <p data-vis style="--i:3">Team Friis er Morten og holdets monterytter Tineke Borup – plus en flok unge og voksne, der hjælper til i stalden.</p>
      <dl class="nogle" data-vis style="--i:4">
        <div><dt>Sejre de seneste ${o.femAar.aar} sæsoner</dt><dd>${o.femAar.sejre}</dd></div>
        <div><dt>Starter de seneste ${o.femAar.aar} sæsoner</dt><dd>${nf(o.femAar.starter)}</dd></div>
        <div><dt>Sejre som kusk i ${o.kusk.aar}</dt><dd>${o.kusk.sejre}</dd></div>
      </dl>
      <p class="valg" data-vis style="--i:5">${link('om-morten/', 'Mere om Morten')}</p>
    </div>
  </div>
</section>

<section class="sek sek--moerk">
  <div class="wrap">
    <div class="sekhoved">
      <div>
        ${etiket('Hestene', ' data-vis')}
        <h2 data-vis style="--i:1">Holdet lige nu.</h2>
      </div>
      <p data-vis style="--i:2">${o.heste.length} heste står på træningslisten${o.ungheste.length > 1 ? ` – ${o.heste.length - o.ungheste.length} i løbsalderen og ${o.ungheste.length} ungheste på vej` : ''}.</p>
    </div>
    ${o.kortheste.length ? hestekort(o.kortheste) : ''}
    <h3 class="mini" data-vis>Mest vindende på listen</h3>
    <div class="profiler">${o.heste.slice(0, 6).map(profilkort).join('')}
    </div>
    <p class="midt" data-vis>${knap('heste/', `Hele træningslisten (${o.heste.length})`, 'knap--glas')}</p>
  </div>
</section>

<section class="sek sek--lys">
  <div class="wrap">
    <div class="sekhoved">
      <div>
        ${etiket('Stalden', ' data-vis')}
        <h2 data-vis style="--i:1">Hverdagen i ${SITE.sted}.</h2>
      </div>
      <p data-vis style="--i:2">Fra formiddagstræning på Skive Trav til fritid på foldene.</p>
    </div>
    ${galleri()}
  </div>
</section>

<section class="sek sek--moerk">
  <div class="wrap">
    <div class="sekhoved">
      <div>
        ${etiket('Fra banen', ' data-vis')}
        <h2 data-vis style="--i:1">Seneste resultater.</h2>
      </div>
      <p data-vis style="--i:2">Opdateret ${o.opdateret} fra Dansk Hestevæddeløb.</p>
    </div>
    <div class="resgitter">
      <div class="panel" data-vis>
        <h3 class="mini">Seneste starter</h3>
        ${resultatliste(o.seneste.slice(0, 6))}
        <p class="valg">${link('resultater/', 'Alle resultater og statistik', 'link--lys')}</p>
      </div>
      <div class="panel" data-vis style="--i:1">
        <h3 class="mini">Kommende starter</h3>
        ${o.kommende.length ? kommendeListe(o.kommende.slice(0, 5)) : ingenStarter()}
        <h3 class="mini mini--luft">Formkurve</h3>
        ${formkurve(o.seneste)}
      </div>
    </div>
  </div>
</section>

<section class="sek sek--lys">
  <div class="wrap duo">
    <div>
      ${etiket('Banerne', ' data-vis')}
      <h2 data-vis style="--i:1">Hjemme i Skive – ude i hele landet.</h2>
      <p class="indled" data-vis style="--i:2">Skive Trav er hjemmebanen${o.hjemmestarter ? `, hvor stalden har haft ${o.hjemmestarter} starter i ${o.saeson.aar}` : ''}.</p>
      <div data-vis style="--i:3">${banebjaelker(o.banetal)}</div>
    </div>
    <figure class="kort" data-vis style="--i:2">
      ${danmarkskort(o.banetal, `Danmarkskort med staldens starter pr. bane i ${o.saeson.aar}: ${o.banetal.map((b) => `${b.navn} ${b.antal}`).join(', ')}.`)}
      <figcaption>Starter pr. dansk bane i ${o.saeson.aar}. Ringen markerer hjemmebanen.</figcaption>
    </figure>
  </div>
</section>
${partnere()}
${foelg(o.fb)}
${kontaktbaand()}`;

const omMorten = (o, data) => `
${sidehoved({
  sti: 'Om Morten',
  h1: 'Morten Friis',
  tekst: `Professionel travtræner og kusk med ${esc(data.traener.licens)}-licens og manden bag Team Friis. Født i ${data.traener.foedt} – med Skive Trav som hjemmebane og stald i ${SITE.sted}.`,
  foto: 'traening-jog',
  pos: '50% 60%',
  chips: [[o.femAar.sejre, `sejre de seneste ${o.femAar.aar} sæsoner`], [o.heste.length, 'heste i træning'], ['A1', 'licens']],
})}

<section class="sek sek--lys">
  <div class="wrap artikel">
    <aside class="fakta" data-vis>
      <figure class="fakta__foto">${billede('portraet', 'Morten Friis i løbsdragten', { sizes: '(min-width: 901px) 340px, 92vw' })}</figure>
      <dl>
        <div><dt>Født</dt><dd>${data.traener.foedt}</dd></div>
        <div><dt>Licens</dt><dd>${esc(data.traener.licens)} – professionel træner og kusk</dd></div>
        <div><dt>Hjemmebane</dt><dd>Skive Trav</dd></div>
        <div><dt>Løbsfarver</dt><dd>Sort, blå og grøn</dd></div>
        <div><dt>Stald</dt><dd>Team Friis, ${SITE.sted}</dd></div>
        <div><dt>Heste i træning</dt><dd>${o.heste.length}</dd></div>
      </dl>
    </aside>
    <div class="prosa">
      ${etiket('Træneren', ' data-vis')}
      <h2 data-vis>Team Friis.</h2>
      <p class="indled" data-vis>${SITE.person} træner travheste under navnet Team Friis fra stalden i ${SITE.sted} ved ${SITE.by} med Skive Trav som hjemmebane.</p>
      <p data-vis>Holdet består af Morten og monterytteren Tineke Borup – og en flok unge og voksne, der hjælper til i stalden og med andre opgaver.</p>
      <p data-vis>Lige nu står ${o.heste.length} heste på træningslisten – fra åringer til rutinerede løbsheste. Over de seneste ${o.femAar.aar} sæsoner har stalden vundet ${o.femAar.sejre} løb, og i ${o.saeson.aar} står stalden på ${o.saeson.sejre} sejre på ${o.saeson.starter} starter.</p>
      <h2 data-vis>Kusken.</h2>
      <p data-vis>Morten kører selv mange af staldens heste. I ${o.kusk.aar} er det blevet til ${o.kusk.starter} starter og ${o.kusk.sejre} sejre i sulkyen.</p>
      <figure class="prosa__foto" data-vis>${billede('i-loeb', 'Travheste i opløbet på banen', { sizes: '(min-width: 1000px) 60vw, 92vw' })}</figure>
      <p class="valg" data-vis>${ekstern(SITE.travinfo, 'Se Mortens profil på Travinfo')}</p>
    </div>
  </div>
</section>

<section class="sek sek--moerk">
  <div class="wrap">
    <div class="sekhoved">
      <div>
        ${etiket('Statistik', ' data-vis')}
        <h2 data-vis style="--i:1">Sæson for sæson.</h2>
      </div>
      <p data-vis style="--i:2">Officielle tal fra Dansk Hestevæddeløb, opdateret ${o.opdateret}.</p>
    </div>
    <div class="tabeller" data-vis>
      ${statTabel('Som træner', data.traenerStatistik)}
      ${statTabel('Som kusk', data.kuskStatistik)}
    </div>
  </div>
</section>
${partnere()}
${kontaktbaand()}`;

const stalden = (o) => `
${sidehoved({
  sti: 'Stalden',
  h1: `Stalden i ${SITE.sted}`,
  tekst: `${SITE.navn} træner ${o.heste.length} heste – fra åringer til rutinerede løbsheste – med Skive Trav som hjemmebane.`,
  foto: 'fold-tre',
  pos: '50% 55%',
  chips: [[o.heste.length, 'heste i træning'], [`${o.aldre[0]}–${o.aldre[1]}`, 'år gamle'], [o.banetal.length, `baner i ${o.saeson.aar}`]],
})}

<section class="sek sek--lys">
  <div class="wrap">
    <div class="sekhoved">
      <div>
        ${etiket('Det tilbyder stalden', ' data-vis')}
        <h2 data-vis style="--i:1">Fra første tilkøring til målstregen.</h2>
      </div>
      <p data-vis style="--i:2">Kontakt ${SITE.fornavn} for pris.</p>
    </div>
    ${ydelser(o)}
  </div>
</section>

<section class="sek sek--moerk">
  <div class="wrap">
    <div class="sekhoved">
      <div>
        ${etiket('Hverdagen', ' data-vis')}
        <h2 data-vis style="--i:1">Træning og fritid.</h2>
      </div>
      <p data-vis style="--i:2">Billeder fra Team Friis' Facebook-side.</p>
    </div>
    ${galleri()}
  </div>
</section>

<section class="sek sek--lys">
  <div class="wrap duo">
    <div>
      ${etiket('Hjemmebanen', ' data-vis')}
      <h2 data-vis style="--i:1">Skive Trav.</h2>
      <p class="indled" data-vis style="--i:2">Skive Trav er staldens hjemmebane${o.hjemmestarter ? ` – i ${o.saeson.aar} har stalden haft ${o.hjemmestarter} starter her` : ''}.</p>
      <p data-vis style="--i:3">Banen åbnede i 1948 som Nordvestjysk Væddeløbsbane og har ligget på Flyvej i Skive siden 1966. Et lysanlæg fra 2019–20 gør det muligt at køre løb hele vinteren.</p>
      <div data-vis style="--i:4">${banebjaelker(o.banetal)}</div>
      <p class="valg" data-vis style="--i:5">${ekstern(SITE.hjemmebane, 'skive-trav.dk')}</p>
    </div>
    <figure class="kort" data-vis style="--i:2">
      ${danmarkskort(o.banetal, `Danmarkskort med staldens starter pr. bane i ${o.saeson.aar}: ${o.banetal.map((b) => `${b.navn} ${b.antal}`).join(', ')}.`)}
      <figcaption>Starter pr. dansk bane i ${o.saeson.aar}. Ringen markerer hjemmebanen.</figcaption>
    </figure>
  </div>
</section>

<section class="sek sek--lys sek--top0">
  <div class="wrap">
    <div class="adresse" data-vis>
      <div>
        ${etiket('Adresse')}
        <address class="adresse__stor">${SITE.navn}<br>${SITE.gade}, ${SITE.sted}<br>${SITE.postnr} ${SITE.by}</address>
      </div>
      <p>${ekstern(SITE.kort, 'Åbn i Google Maps', 'knap knap--blaa')}</p>
    </div>
  </div>
</section>
${partnere()}
${kontaktbaand()}`;

const heste = (o) => `
${sidehoved({
  sti: 'Heste',
  h1: 'Heste i træning',
  tekst: 'Træningslisten kommer direkte fra Dansk Hestevæddeløb og følger automatisk med, når heste kommer til eller rejser videre.',
  foto: 'fold-sol',
  pos: '50% 40%',
  chips: [[o.heste.length - o.ungheste.length, 'løbsheste'], [o.ungheste.length, 'ungheste']],
})}

${o.kortheste.length ? `
<section class="sek sek--moerk sek--smal">
  <div class="wrap">
    ${etiket('Fra Team Friis\' Facebook', ' data-vis')}
    ${hestekort(o.kortheste)}
  </div>
</section>` : ''}

<section class="sek sek--lys">
  <div class="wrap">
    ${hestegruppe('Løbsheste', o.heste.filter((h) => h.alder >= 3))}
    ${hestegruppe('2-årige', o.heste.filter((h) => h.alder === 2))}
    ${hestegruppe('Åringer', o.heste.filter((h) => h.alder <= 1))}
    <p class="note" data-vis>Starter, placeringer (1.–2.–3.), præmiesum og rekord er livstal. Rekorden er hestens hurtigste kilometertid; a = autostart, k/m/l = kort, mellem og lang distance. Klik på en hest for at se den på Travinfo. Kilde: Dansk Hestevæddeløb, opdateret ${o.opdateret}.</p>
  </div>
</section>
${kontaktbaand()}`;

const resultater = (o, data) => `
${sidehoved({
  sti: 'Resultater',
  h1: 'Resultater',
  tekst: `Staldens seneste starter, kommende løb og sæsonens tal. Data kommer fra Dansk Hestevæddeløb og er senest opdateret ${o.opdateret}.`,
  foto: 'traening-bane',
  pos: '50% 55%',
  chips: [[o.saeson.sejre, `sejre i ${o.saeson.aar}`], [`${o.saeson.procent} %`, 'sejrsprocent']],
})}

<section class="sek sek--lys">
  <div class="wrap">
    ${etiket(`Sæson ${o.saeson.aar}`, ' data-vis')}
    <dl class="kpi" data-vis>
      <div><dt>Starter</dt><dd>${o.saeson.starter}</dd></div>
      <div><dt>Sejre</dt><dd>${o.saeson.sejre}</dd></div>
      <div><dt>2.-pladser</dt><dd>${o.saeson.toer}</dd></div>
      <div><dt>3.-pladser</dt><dd>${o.saeson.treer}</dd></div>
      <div><dt>Sejrsprocent</dt><dd>${o.saeson.procent}<small>%</small></dd></div>
      <div><dt>Indkørt</dt><dd>${nf(o.saeson.praemier)}<small>kr.</small></dd></div>
    </dl>
    <div class="formboks" data-vis style="--i:1">
      <h3 class="mini">Formkurve – de seneste ${o.seneste.length} starter</h3>
      ${formkurve(o.seneste)}
    </div>
  </div>
</section>

<section class="sek sek--moerk">
  <div class="wrap resgitter">
    <div class="panel" data-vis>
      <h2 class="mini">De seneste ${o.seneste.length} starter</h2>
      ${resultatliste(o.seneste)}
      <p class="note">Tider er kilometertider. a = autostart, g = galop undervejs. – = uplaceret, disk. = diskvalificeret.</p>
    </div>
    <div class="panel" data-vis style="--i:1">
      <h2 class="mini">Kommende starter</h2>
      ${o.kommende.length ? kommendeListe(o.kommende) : ingenStarter()}
    </div>
  </div>
</section>

<section class="sek sek--lys">
  <div class="wrap">
    <div class="sekhoved">
      <div>
        ${etiket('Statistik', ' data-vis')}
        <h2 data-vis style="--i:1">Sæson for sæson.</h2>
      </div>
      <p data-vis style="--i:2">Alle resultater og detaljer findes hos Dansk Hestevæddeløb. ${ekstern(SITE.travinfo, 'Åbn Travinfo')}</p>
    </div>
    <div class="tabeller" data-vis>
      ${statTabel('Som træner', data.traenerStatistik)}
      ${statTabel('Som kusk', data.kuskStatistik)}
    </div>
  </div>
</section>
${kontaktbaand()}`;

const kontakt = () => `
${sidehoved({
  sti: 'Kontakt',
  h1: 'Kontakt Morten',
  tekst: 'Har du en hest, der skal i træning, eller et spørgsmål til stalden? Ring, send en sms eller skriv en mail.',
  foto: 'fold-tre',
  pos: '50% 50%',
})}

<section class="sek sek--lys">
  <div class="wrap kontakt">
    <div class="kontakt__felt kontakt__felt--tlf" data-vis>
      <h2 class="mini">Telefon</h2>
      <p class="kontakt__stor"><a href="tel:${tlfLink}">${SITE.telefon}</a></p>
      <p class="valg"><a class="knap knap--hvid" href="tel:${tlfLink}">Ring op ${pil}</a> <a class="link link--lys" href="sms:${tlfLink}">Send en sms ${pil}</a></p>
    </div>
    <div class="kontakt__felt" data-vis style="--i:1">
      <h2 class="mini">E-mail</h2>
      <p class="kontakt__stor kontakt__stor--mail"><a href="mailto:${SITE.email}">${SITE.email}</a></p>
      <p class="valg"><a class="knap knap--blaa" href="mailto:${SITE.email}?subject=${encodeURIComponent('Henvendelse fra hjemmesiden')}">Skriv en mail ${pil}</a></p>
    </div>
    <div class="kontakt__felt kontakt__felt--kort" data-vis style="--i:2">
      <div>
        <h2 class="mini">Stalden</h2>
        <address class="kontakt__adr">${SITE.navn}<br>${SITE.gade}, ${SITE.sted}<br>${SITE.postnr} ${SITE.by}</address>
        <p class="valg">${ekstern(SITE.kort, 'Find vej')}</p>
      </div>
      <div class="kort kort--mini">${danmarkskort([{ kode: HJEM, navn: 'Skive' }], 'Danmarkskort, hvor Skive er markeret')}</div>
    </div>
  </div>
</section>
${foelg()}`;

const ikkeFundet = () => `
<section class="sidehoved sidehoved--enkel">
  <div class="sidehoved__foto">${billede('fold-tre', '', { lazy: false })}</div>
  <div class="wrap sidehoved__inner">
    ${etiket('Fejl 404', '')}
    <h1>Siden findes ikke</h1>
    <p class="indled">Adressen er forkert, eller siden er flyttet.</p>
    <p class="valg">${knap('', 'Til forsiden')}</p>
  </div>
</section>`;

/** Alle sider som [{ sti, html }]. `idag` er YYYY-MM-DD, `v` et versionsmærke til css/js. */
export function sider(data, { v, idag, kort }) {
  V = v;
  KORT = kort;
  const o = afled(data, idag);
  const side = (sti, def) => {
    R = sti === '404.html' ? new URL(SITE.url + '/').pathname : sti ? '../' : '';
    return { sti: sti.endsWith('.html') ? sti : `${sti}index.html`, url: sti, html: layout({ sti, o, ...def() }) };
  };
  return [
    side('', () => ({
      titel: `${SITE.navn} – travtræner ${SITE.person}, Skive`,
      beskrivelse: `${SITE.person} og Team Friis: professionel travtræning med Skive Trav som hjemmebane. ${o.heste.length} heste i træning i ${SITE.sted} ved ${SITE.by}.`,
      klasse: 'forside',
      indhold: forside(o),
    })),
    side('om-morten/', () => ({
      titel: `Om ${SITE.person} – travtræner og kusk | ${SITE.navn}`,
      beskrivelse: `Mød ${SITE.person}: professionel travtræner og kusk med A1-licens, manden bag Team Friis i ${SITE.sted} med Skive Trav som hjemmebane.`,
      indhold: omMorten(o, data),
    })),
    side('stalden/', () => ({
      titel: `Stalden i ${SITE.sted} – travtræning ved Skive | ${SITE.navn}`,
      beskrivelse: `${SITE.navn} holder til på ${SITE.gade} i ${SITE.sted} ved ${SITE.by} med Skive Trav som hjemmebane. Træning af løbsheste og tilkøring af ungheste.`,
      indhold: stalden(o),
    })),
    side('heste/', () => ({
      titel: `Heste i træning | ${SITE.navn}`,
      beskrivelse: `Se de ${o.heste.length} travheste, der lige nu er i træning hos ${SITE.person} – med afstamning, starter, præmiesum og rekord.`,
      indhold: heste(o),
    })),
    side('resultater/', () => ({
      titel: `Resultater og statistik | ${SITE.navn}`,
      beskrivelse: `Seneste resultater, kommende starter og sæsonstatistik for travtræner ${SITE.person}: ${o.saeson.sejre} sejre på ${o.saeson.starter} starter i ${o.saeson.aar}.`,
      indhold: resultater(o, data),
    })),
    side('kontakt/', () => ({
      titel: `Kontakt ${SITE.person} – ${SITE.navn}, Skive`,
      beskrivelse: `Kontakt ${SITE.navn}: telefon ${SITE.telefon}, ${SITE.email}. Stalden ligger på ${SITE.gade}, ${SITE.sted}, ${SITE.postnr} ${SITE.by}.`,
      indhold: kontakt(),
    })),
    side('404.html', () => ({
      titel: `Siden findes ikke | ${SITE.navn}`,
      beskrivelse: 'Siden findes ikke.',
      noindex: true,
      indhold: ikkeFundet(),
    })),
  ];
}
