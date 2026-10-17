// Al HTML til sitet. Tekster rettes her; tal, heste og resultater kommer fra data/travinfo.json.

export const SITE = {
  // ← Bekræft domænet før lancering (kan også sættes med miljøvariablen SITE_URL). På Vercel bruges projektets adresse.
  url: (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL) || 'https://www.mortenfriis.dk').replace(/\/$/, ''),
  navn: 'Morten Friis Travtræning',
  person: 'Morten Friis',
  fornavn: 'Morten',
  licens: 20245,
  telefon: '+45 24 26 64 99',
  gade: 'Vittrupvej 19',
  postnr: '7850',
  by: 'Stoholm',
  facebook: '', // ← sidens adresse; så vises link (og opslag, når FB_SIDE/FB_TOKEN er sat i GitHub)
  instagram: '', // ← profilens adresse
  travinfo: 'https://travinfo.dk/licenseholder-tabs/20245',
  hjemmebane: 'https://www.skive-trav.dk/',
  kort: 'https://www.google.com/maps/search/?api=1&query=Vittrupvej+19%2C+7850+Stoholm',
};

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

// Skærf i løbsfarverne sort, blå og grøn – staldens gennemgående mærke.
const skaerf = (cls = '') => `<span class="skaerf ${cls}" aria-hidden="true"><i></i><i></i><i></i></span>`;
// Afsnitsnummer som et startnummer i programmet (farverne skifter mellem sort, blå og grøn).
const nr = (n) => `<span class="nr nr--${(n - 1) % 3}" aria-hidden="true">${n}</span>`;

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
  };
}

// ---------- fælles dele ----------

const navnetraek = (cls = '') => `<span class="navnetraek ${cls}">${skaerf('skaerf--lille')}<span>Morten <b>Friis</b></span></span>`;

const top = (sti) => `
<header class="top">
  <div class="top__inner wrap">
    <a class="top__logo" href="${R || './'}" aria-label="${SITE.navn} – til forsiden">${navnetraek()}</a>
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
    ${navnetraek()}
    <button class="burger burger--luk" type="button" data-luk commandfor="menu" command="close"><span>Luk</span><i aria-hidden="true"></i></button>
  </div>
  <nav class="menu__nav wrap" aria-label="Menu">
    <ol>
      ${[['', 'Forside'], ...NAV, ['kontakt/', 'Kontakt']].map(([href, navn], i) => `<li style="--i:${i}"><a href="${R}${href || (R ? '' : './')}"${(href ? sti.startsWith(href) : sti === '') ? ' aria-current="page"' : ''}>${nr(i + 1)}${navn}</a></li>`).join('\n      ')}
    </ol>
  </nav>
  <div class="menu__bund wrap">
    <a href="tel:${tlfLink}">${SITE.telefon}</a>
  </div>
</dialog>`;

const kontaktbaand = () => `
<section class="cta">
  <div class="wrap cta__inner">
    <div>
      <h2 data-vis>Skal din hest i træning hos Morten?</h2>
      <p data-vis style="--i:1">Ring eller send en sms – så tager I en snak om hesten og mulighederne.</p>
    </div>
    <div class="cta__valg" data-vis style="--i:2">
      <a class="cta__tlf" href="tel:${tlfLink}">${SITE.telefon}</a>
      <p class="valg"><a class="link link--lys" href="sms:${tlfLink}">Send en sms ${pil}</a> ${link('kontakt/', 'Alle kontaktoplysninger', 'link--lys')}</p>
    </div>
  </div>
</section>`;

const bund = (o) => `
<footer class="bund">
  ${skaerf('bund__skaerf')}
  <div class="wrap bund__gitter">
    <div class="bund__brand">
      ${navnetraek('navnetraek--stor')}
      <p>Professionel travtræning med Skive Trav som hjemmebane. Træning af løbsheste og tilkøring af ungheste.</p>
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
        <li><address>${SITE.gade}<br>${SITE.postnr} ${SITE.by}</address></li>
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
  image: `${SITE.url}/assets/img/og.jpg`,
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
<meta name="theme-color" content="#f4f0e8">
<meta property="og:type" content="website">
<meta property="og:locale" content="da_DK">
<meta property="og:site_name" content="${SITE.navn}">
<meta property="og:title" content="${esc(titel)}">
<meta property="og:description" content="${esc(beskrivelse)}">
<meta property="og:url" content="${kanonisk}">
<meta property="og:image" content="${SITE.url}/assets/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Morten Friis – travtræner, Skive">
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

// Sidehoved på undersider: stor bred titel på papir, med afsnitsnummer og skærfet i løbsfarverne.
const sidehoved = ({ sti, n, h1, tekst, fakta = [] }) => `
<section class="sidehoved">
  <div class="wrap">
    <nav class="sti" aria-label="Brødkrumme"><a href="${R}">Forside</a><span aria-hidden="true">/</span><span aria-current="page">${sti}</span></nav>
    <div class="sidehoved__titel">${nr(n)}<h1>${h1}</h1></div>
    <div class="sidehoved__bund">
      <p class="indled">${tekst}</p>
      ${fakta.length ? `<dl class="sidehoved__fakta">${fakta.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join('')}</dl>` : ''}
    </div>
  </div>
  ${skaerf('sidehoved__skaerf')}
</section>`;

// Afsnitshoved i programstil: nummer, titel og evt. tekst til højre.
const afsnit = (n, titel, tekst = '') => `
    <header class="afsnit">
      <div class="afsnit__titel" data-vis>${nr(n)}<h2>${titel}</h2></div>
      ${tekst ? `<p data-vis style="--i:1">${tekst}</p>` : ''}
    </header>`;

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
        <time datetime="${k.dato}">${ugedag(k.dato)} ${kortDato(k.dato)}</time>
        <span class="kom__hest">${esc(k.hest)}</span>
        <span class="kom__bane">${esc(bane(k.bane))} · ${k.loeb}. løb${k.kusk ? ` · ${esc(k.kusk)}` : ''}</span>
      </li>`).join('')}
    </ul>`;
const ingenStarter = () => `<p class="tom">Ingen af staldens heste er startmeldt lige nu. Nye startlister kommer på ${ekstern(SITE.travinfo, 'Travinfo')}.</p>`;

const omHest = (h) => `${h.alder}-årig ${esc(h.koen.toLowerCase())}`;
const afstamning = (h) => (h.far ? `e. ${esc(h.far)} – ${esc(h.mor)}` : '');

// En hest som en linje i et travprogram: nummer, navn, afstamning og de vigtigste tal.
const programlinje = (h, i) => `
      <li class="prog" data-vis style="--i:${i % 6}">
        <span class="prog__nr nr nr--${i % 3}" aria-hidden="true">${i + 1}</span>
        <div class="prog__navn">
          <h3><a href="https://travinfo.dk/horse_tabs/${h.id}" target="_blank" rel="noopener">${esc(h.navn)}${nyFane}</a></h3>
          <p>${omHest(h)}${afstamning(h) ? ` · ${afstamning(h)}` : ''}</p>
        </div>
        ${h.starter ? `<dl class="prog__tal">
          <div><dt>Indkørt</dt><dd>${kr(h.praemier)}</dd></div>
          <div><dt>Starter</dt><dd>${h.starter} <small>${esc(h.placeringer)}</small></dd></div>
          <div><dt>Rekord</dt><dd>${bedsteRekord(h.rekord) || '–'}</dd></div>
        </dl>` : '<p class="prog__tal prog__tal--tom">Ustartet</p>'}
      </li>`;

const ydelser = (o) => `
    <ol class="ydelser">
      <li data-vis>
        <h3>Træning af løbsheste</h3>
        <p>Stalden træner og starter løbsheste på baner over hele landet. I ${o.saeson.aar} har staldens heste været til start i ${dkListe(o.banerIAar)}.</p>
      </li>
      <li data-vis style="--i:1">
        <h3>Tilkøring af ungheste</h3>
        <p>Ungheste køres til og bygges op mod deres første starter.${o.ungheste.length > 1 ? ` Lige nu står ${o.ungheste.length} åringer og 2-årige på træningslisten.` : ''}</p>
      </li>
      <li data-vis style="--i:2">
        <h3>Træner og kusk</h3>
        <p>${SITE.fornavn} kører selv mange af staldens heste – i ${o.kusk.aar} er det blevet til ${o.kusk.starter} starter og ${o.kusk.sejre} sejre som kusk.</p>
      </li>
    </ol>`;

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

// "Følg stalden" vises kun, når stalden har en kanal at følge.
const foelg = (n, fb = []) => (SITE.facebook || SITE.instagram || fb.length ? `
<section class="sek sek--papir2">
  <div class="wrap">
    ${afsnit(n, 'Følg stalden', `Startdage, sejre og livet i stalden deles løbende${fb.length ? ' – her er de seneste opslag fra Facebook' : ''}.`)}
    <p class="valg">
      ${SITE.facebook ? ekstern(SITE.facebook, 'Facebook', 'knap knap--kant') : ''}
      ${SITE.instagram ? ekstern(SITE.instagram, 'Instagram', 'knap knap--kant') : ''}
    </p>
    ${SITE.facebook && !fb.length ? `<div class="fb" data-fb="${SITE.facebook}">
      <button class="knap knap--kant" type="button">Vis de seneste opslag ${pil}</button>
      <p class="fb__note">Opslagene hentes fra Facebook og sætter cookies derfra.</p>
    </div>` : ''}
    ${fb.length ? fbKort(fb) : ''}
  </div>
</section>` : '');

// ---------- sider ----------

const forside = (o) => `
<section class="hero">
  ${skaerf('hero__skaerf')}
  <div class="wrap hero__gitter">
    <div class="hero__tekst">
      <p class="etiket">Travtræner · Skive Trav</p>
      <h1><span>Morten</span> <span>Friis</span></h1>
      <p class="hero__indled">Professionel travtræner og kusk med A1-licens og Skive Trav som hjemmebane. Stalden ligger i ${SITE.by} og har ${o.heste.length} heste i træning – fra åringer til rutinerede løbsheste.</p>
      <p class="valg">${knap('kontakt/', 'Kontakt Morten')} ${link('heste/', 'Se hestene')}</p>
    </div>
    <aside class="programkort" aria-label="Sæsonen og næste start">
      <p class="programkort__top"><span>Sæson ${o.saeson.aar}</span><span>Som træner</span></p>
      <dl>
        <div><dt>Starter</dt><dd>${o.saeson.starter}</dd></div>
        <div><dt>Sejre</dt><dd>${o.saeson.sejre}</dd></div>
        <div><dt>Sejrsprocent</dt><dd>${o.saeson.procent}&nbsp;%</dd></div>
        <div><dt>Indkørt</dt><dd>${kr(o.saeson.praemier)}</dd></div>
      </dl>
      <div class="programkort__naeste">
        <p class="mini">Næste start</p>
        ${o.kommende.length ? `<p class="programkort__start"><b>${esc(o.kommende[0].hest)}</b> ${ugedag(o.kommende[0].dato)} ${kortDato(o.kommende[0].dato)} · ${esc(bane(o.kommende[0].bane))}, ${o.kommende[0].loeb}. løb</p>` : '<p class="programkort__start">Ingen startmeldte lige nu</p>'}
      </div>
      <p class="programkort__kilde">Dansk Hestevæddeløb · ${o.opdateret}</p>
    </aside>
  </div>
</section>

<section class="sek">
  <div class="wrap">
    ${afsnit(1, 'Træneren')}
    <div class="to">
      <p class="indled" data-vis>${SITE.person} er født i 1983 og har A1-licens som både træner og kusk. Han træner hestene hjemme i ${SITE.by} og kører selv mange af dem i løb.</p>
      <div data-vis style="--i:1">
        <p>Over de seneste ${o.femAar.aar} sæsoner har stalden vundet ${o.femAar.sejre} løb på ${nf(o.femAar.starter)} starter. I ${o.saeson.aar} er det indtil videre blevet til ${o.saeson.sejre} sejre som træner og ${o.kusk.sejre} som kusk.</p>
        <p class="valg">${link('om-morten/', 'Mere om Morten')}</p>
      </div>
    </div>
  </div>
</section>

<section class="sek sek--papir2">
  <div class="wrap">
    ${afsnit(2, 'Hestene', `${o.heste.length} heste står på træningslisten${o.ungheste.length > 1 ? ` – ${o.heste.length - o.ungheste.length} i løbsalderen og ${o.ungheste.length} ungheste på vej` : ''}. Her er de seks, der har tjent mest.`)}
    <ol class="program">${o.heste.slice(0, 6).map(programlinje).join('')}
    </ol>
    <p class="valg" data-vis>${knap('heste/', `Hele træningslisten (${o.heste.length})`, 'knap--kant')}</p>
  </div>
</section>

<section class="sek">
  <div class="wrap">
    ${afsnit(3, 'Fra banen', `Seneste resultater og kommende starter – opdateret ${o.opdateret}.`)}
    <div class="resgitter">
      <div data-vis>
        <h3 class="mini">Seneste starter</h3>
        ${resultatliste(o.seneste.slice(0, 6))}
        <p class="valg">${link('resultater/', 'Alle resultater og statistik')}</p>
      </div>
      <aside data-vis style="--i:1">
        <h3 class="mini">Kommende starter</h3>
        ${o.kommende.length ? kommendeListe(o.kommende.slice(0, 5)) : ingenStarter()}
        <h3 class="mini mini--luft">Formkurve</h3>
        ${formkurve(o.seneste)}
      </aside>
    </div>
  </div>
</section>

<section class="sek sek--papir2">
  <div class="wrap duo">
    <div>
      ${afsnit(4, 'Banerne')}
      <p class="indled" data-vis style="--i:1">Hjemmebanen er Skive Trav${o.hjemmestarter ? `, hvor stalden har haft ${o.hjemmestarter} starter i ${o.saeson.aar}` : ''}. Men hestene kører over hele landet${o.svenske.length ? ' og i Sverige' : ''}.</p>
      <ul class="banetal" data-vis style="--i:2">${o.banetal.map((b) => `
        <li><span>${esc(b.navn)}</span><b>${b.antal}</b></li>`).join('')}
      </ul>
    </div>
    <figure class="kort" data-vis style="--i:2">
      ${danmarkskort(o.banetal, `Danmarkskort med staldens starter pr. bane i ${o.saeson.aar}: ${o.banetal.map((b) => `${b.navn} ${b.antal}`).join(', ')}.`)}
      <figcaption>Starter pr. dansk bane i ${o.saeson.aar}. Ringen markerer hjemmebanen.</figcaption>
    </figure>
  </div>
</section>
${foelg(5, o.fb)}
${kontaktbaand()}`;

const omMorten = (o, data) => `
${sidehoved({
  sti: 'Om Morten',
  n: 1,
  h1: 'Morten Friis',
  tekst: `Professionel travtræner og kusk med ${esc(data.traener.licens)}-licens. Født i ${data.traener.foedt} – med Skive Trav som hjemmebane og stald i ${SITE.by}.`,
  fakta: [['Sejre som træner', `${o.femAar.sejre} <small>siden ${o.femAar.fra}</small>`], ['Heste i træning', o.heste.length]],
})}

<section class="sek">
  <div class="wrap artikel">
    <aside class="fakta" data-vis>
      <h2 class="mini">Kort fortalt</h2>
      <dl>
        <div><dt>Født</dt><dd>${data.traener.foedt}</dd></div>
        <div><dt>Licens</dt><dd>${esc(data.traener.licens)} – professionel træner og kusk</dd></div>
        <div><dt>Hjemmebane</dt><dd>Skive Trav</dd></div>
        <div><dt>Løbsfarver</dt><dd>Sort, blå og grøn</dd></div>
        <div><dt>Stald</dt><dd>${SITE.gade}, ${SITE.postnr} ${SITE.by}</dd></div>
        <div><dt>Heste i træning</dt><dd>${o.heste.length}</dd></div>
      </dl>
    </aside>
    <div class="prosa">
      <h2 data-vis>Træneren</h2>
      <p class="indled" data-vis>${SITE.person} træner travheste fra sin stald i ${SITE.by} med Skive Trav som hjemmebane.</p>
      <p data-vis>Lige nu står ${o.heste.length} heste på træningslisten – fra åringer til rutinerede løbsheste. Over de seneste ${o.femAar.aar} sæsoner har stalden vundet ${o.femAar.sejre} løb, og i ${o.saeson.aar} står stalden på ${o.saeson.sejre} sejre på ${o.saeson.starter} starter.</p>
      <h2 data-vis>Kusken</h2>
      <p data-vis>Morten kører selv mange af staldens heste. I ${o.kusk.aar} er det blevet til ${o.kusk.starter} starter og ${o.kusk.sejre} sejre i sulkyen.</p>
      <p class="valg" data-vis>${ekstern(SITE.travinfo, 'Se Mortens profil på Travinfo')}</p>
    </div>
  </div>
</section>

<section class="sek sek--papir2">
  <div class="wrap">
    ${afsnit(2, 'Sæson for sæson', `Officielle tal fra Dansk Hestevæddeløb, opdateret ${o.opdateret}.`)}
    <div class="tabeller" data-vis>
      ${statTabel('Som træner', data.traenerStatistik)}
      ${statTabel('Som kusk', data.kuskStatistik)}
    </div>
  </div>
</section>
${kontaktbaand()}`;

const stalden = (o) => `
${sidehoved({
  sti: 'Stalden',
  n: 2,
  h1: `Stalden i ${SITE.by}`,
  tekst: `${SITE.navn} træner ${o.heste.length} heste – med Skive Trav som hjemmebane.`,
  fakta: [['Heste i træning', o.heste.length], ['Alder', `${o.aldre[0]}–${o.aldre[1]} år`]],
})}

<section class="sek">
  <div class="wrap">
    ${afsnit(1, 'Det tilbyder stalden', `Kontakt ${SITE.fornavn} for pris.`)}
    ${ydelser(o)}
  </div>
</section>

<section class="sek sek--papir2">
  <div class="wrap duo">
    <div>
      ${afsnit(2, 'Hjemmebanen')}
      <p class="indled" data-vis style="--i:1">Skive Trav er staldens hjemmebane${o.hjemmestarter ? ` – i ${o.saeson.aar} har stalden haft ${o.hjemmestarter} starter her` : ''}.</p>
      <p data-vis style="--i:2">Banen åbnede i 1948 som Nordvestjysk Væddeløbsbane og har ligget på Flyvej i Skive siden 1966. Et lysanlæg fra 2019–20 gør det muligt at køre løb hele vinteren.</p>
      <p class="valg" data-vis style="--i:3">${ekstern(SITE.hjemmebane, 'skive-trav.dk')}</p>
    </div>
    <figure class="kort" data-vis style="--i:2">
      ${danmarkskort(o.banetal, `Danmarkskort med staldens starter pr. bane i ${o.saeson.aar}: ${o.banetal.map((b) => `${b.navn} ${b.antal}`).join(', ')}.`)}
      <figcaption>Starter pr. dansk bane i ${o.saeson.aar}. Ringen markerer hjemmebanen.</figcaption>
    </figure>
  </div>
</section>

<section class="sek">
  <div class="wrap">
    ${afsnit(3, 'Adresse')}
    <div class="adresse" data-vis>
      <address class="adresse__stor">${SITE.gade}<br>${SITE.postnr} ${SITE.by}</address>
      <p>${ekstern(SITE.kort, 'Åbn i Google Maps', 'knap knap--kant')}</p>
    </div>
  </div>
</section>
${kontaktbaand()}`;

const hestegruppe = (titel, heste) => (heste.length ? `
    <div class="gruppe">
      <h2 class="gruppe__titel" data-vis>${titel} <span>${heste.length}</span></h2>
      <ol class="program program--taet">${heste.map(programlinje).join('')}
      </ol>
    </div>` : '');

const heste = (o) => `
${sidehoved({
  sti: 'Heste',
  n: 3,
  h1: 'Heste i træning',
  tekst: 'Træningslisten kommer direkte fra Dansk Hestevæddeløb og følger automatisk med, når heste kommer til eller rejser videre.',
  fakta: [['Løbsheste', o.heste.length - o.ungheste.length], ['Ungheste', o.ungheste.length]],
})}

<section class="sek">
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
  n: 4,
  h1: 'Resultater',
  tekst: `Staldens seneste starter, kommende løb og sæsonens tal. Data kommer fra Dansk Hestevæddeløb og er senest opdateret ${o.opdateret}.`,
  fakta: [[`Sejre i ${o.saeson.aar}`, o.saeson.sejre], ['Sejrsprocent', `${o.saeson.procent}&nbsp;%`]],
})}

<section class="sek sek--papir2">
  <div class="wrap">
    ${afsnit(1, `Sæson ${o.saeson.aar}`)}
    <dl class="noegletal" data-vis>
      <div><dt>Starter</dt><dd>${o.saeson.starter}</dd></div>
      <div><dt>Sejre</dt><dd>${o.saeson.sejre}</dd></div>
      <div><dt>2.-pladser</dt><dd>${o.saeson.toer}</dd></div>
      <div><dt>3.-pladser</dt><dd>${o.saeson.treer}</dd></div>
      <div><dt>Sejrsprocent</dt><dd>${o.saeson.procent}&nbsp;%</dd></div>
      <div><dt>Indkørt</dt><dd>${kr(o.saeson.praemier)}</dd></div>
    </dl>
    <div class="formboks" data-vis style="--i:1">
      <h3 class="mini">Formkurve – de seneste ${o.seneste.length} starter</h3>
      ${formkurve(o.seneste)}
    </div>
  </div>
</section>

<section class="sek">
  <div class="wrap">
    ${afsnit(2, 'Seneste og kommende')}
    <div class="resgitter">
      <div>
        <div data-vis>${resultatliste(o.seneste)}</div>
        <p class="note" data-vis>Tider er kilometertider. a = autostart, g = galop undervejs. – = uplaceret, disk. = diskvalificeret.</p>
      </div>
      <aside data-vis style="--i:1">
        <h3 class="mini">Kommende starter</h3>
        ${o.kommende.length ? kommendeListe(o.kommende) : ingenStarter()}
      </aside>
    </div>
  </div>
</section>

<section class="sek sek--papir2">
  <div class="wrap">
    ${afsnit(3, 'Sæson for sæson', `Alle resultater og detaljer findes hos Dansk Hestevæddeløb. ${ekstern(SITE.travinfo, 'Åbn Travinfo')}`)}
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
  n: 5,
  h1: 'Kontakt Morten',
  tekst: 'Har du en hest, der skal i træning, eller et spørgsmål til stalden? Ring eller send en sms.',
})}

<section class="sek">
  <div class="wrap kontakt">
    <div class="kontakt__felt kontakt__felt--tlf" data-vis>
      <h2 class="mini">Telefon</h2>
      <p class="kontakt__stor"><a href="tel:${tlfLink}">${SITE.telefon}</a></p>
      <p class="valg"><a class="knap knap--lys" href="tel:${tlfLink}">Ring op ${pil}</a> <a class="link link--lys" href="sms:${tlfLink}">Send en sms ${pil}</a></p>
    </div>
    <div class="kontakt__felt kontakt__felt--kort" data-vis style="--i:1">
      <div>
        <h2 class="mini">Stalden</h2>
        <address class="kontakt__adr">${SITE.navn}<br>${SITE.gade}<br>${SITE.postnr} ${SITE.by}</address>
        <p class="valg">${ekstern(SITE.kort, 'Find vej')}</p>
      </div>
      <div class="kort kort--mini">${danmarkskort([{ kode: HJEM, navn: 'Skive' }], 'Danmarkskort, hvor Skive er markeret')}</div>
    </div>
  </div>
</section>`;

const ikkeFundet = () => `
<section class="sidehoved sidehoved--enkel">
  <div class="wrap">
    <p class="etiket">Fejl 404</p>
    <div class="sidehoved__titel"><h1>Siden findes ikke</h1></div>
    <div class="sidehoved__bund"><p class="indled">Adressen er forkert, eller siden er flyttet.</p></div>
    <p class="valg">${knap('', 'Til forsiden')}</p>
  </div>
  ${skaerf('sidehoved__skaerf')}
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
      titel: `${SITE.person} – travtræner i Skive`,
      beskrivelse: `${SITE.person} er professionel travtræner og kusk med Skive Trav som hjemmebane. ${o.heste.length} heste i træning i ${SITE.by}.`,
      klasse: 'forside',
      indhold: forside(o),
    })),
    side('om-morten/', () => ({
      titel: `Om ${SITE.person} – travtræner og kusk | ${SITE.navn}`,
      beskrivelse: `Mød ${SITE.person}: professionel travtræner og kusk med A1-licens, stald i ${SITE.by} og Skive Trav som hjemmebane.`,
      indhold: omMorten(o, data),
    })),
    side('stalden/', () => ({
      titel: `Stalden i ${SITE.by} – travtræning ved Skive | ${SITE.navn}`,
      beskrivelse: `${SITE.navn} holder til på ${SITE.gade} i ${SITE.by} med Skive Trav som hjemmebane. Træning af løbsheste og tilkøring af ungheste.`,
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
      titel: `Kontakt ${SITE.person} – travtræner i Skive`,
      beskrivelse: `Kontakt ${SITE.person}: telefon ${SITE.telefon}. Stalden ligger på ${SITE.gade}, ${SITE.postnr} ${SITE.by}.`,
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
