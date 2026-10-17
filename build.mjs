#!/usr/bin/env node
// Bygger sitet til dist/. Ingen afhængigheder – kræver kun Node 20+.
//
//   node build.mjs            byg med de data, der ligger i data/travinfo.json
//   node build.mjs --hent     hent friske data fra Dansk Hestevæddeløb først
//   node build.mjs --serve    byg og vis på http://localhost:4173
//   node build.mjs --test     selvtjek af formatering og datalogik

import { readFile, writeFile, mkdir, cp, rm, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sider, SITE, tid, bedsteRekord, plac } from './templates.mjs';

const ROD = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROD, 'dist');
const DATAFIL = path.join(ROD, 'data', 'travinfo.json');
const API = 'https://api.danskhv.dk/webapi/trot'; // samme åbne data, som travinfo.dk selv viser
const flag = (navn) => process.argv.includes(`--${navn}`);

// ---------- data fra Dansk Hestevæddeløb ----------

/** "371 500 kr." → 371500, "19%" → 19 */
const tal = (s) => Number(String(s ?? '').replace(/[^\d]/g, '')) || 0;

/** "LET'S RUN KÅSGÅRD" → "Let's Run Kåsgård", "GIOVANNI* (SE)" → "Giovanni (SE)" */
const paentNavn = (s) => String(s ?? '').replace('*', '').trim().toLowerCase()
  .replace(/(^|[\s(-])(\p{L})/gu, (_, foer, bogstav) => foer + bogstav.toUpperCase())
  .replace(/\(([a-z]{2})\)/i, (_, land) => `(${land.toUpperCase()})`);

/** "Nielsen Casper M." → "Casper M. Nielsen" */
// ponytail: antager ét efternavn først; dobbelte efternavne bliver vendt forkert – ret her, hvis det sker.
const kuskNavn = (s) => { const [efternavn, ...rest] = String(s ?? '').trim().split(/\s+/); return [...rest, efternavn].join(' ').trim(); };

/** Kun rigtige starter: ikke strøgne heste, prøve-/kvalløb eller løb uden resultat endnu. */
const erStart = (r) => !r.withdrawn && r.raceType?.displayValue !== 'k' && r.placement?.displayValue !== '';

const tilResultat = (r) => ({
  id: `${r.raceInformation.raceId}-${r.horse.id}`,
  dato: r.raceInformation.date,
  bane: r.trackCode,
  loeb: r.raceInformation.raceNumber,
  hestId: r.horse.id,
  hest: paentNavn(r.horse.name),
  placering: r.placement.displayValue,
  tid: r.kilometerTime.displayValue,
  distance: r.distance.sortValue,
  praemie: r.prizeMoney.sortValue,
});

/** Nye resultater lægges oven på de gemte, så historikken bevares, selv om API'et kun viser de nyeste. */
const flet = (nye, gamle = []) => {
  const set = new Set(nye.map((r) => r.id));
  return [...nye, ...gamle.filter((r) => !set.has(r.id))].sort((a, b) => b.dato.localeCompare(a.dato) || b.loeb - a.loeb);
};

const tilStatistik = (svar) => svar.statistics.map((s) => ({
  aar: Number(s.year), starter: s.numberOfStarts, sejre: s.firstPlaces, toer: s.secondPlaces, treer: s.thirdPlaces,
  procent: tal(s.winningRates), praemier: tal(s.prizeMoney),
}));

// Vi gemmer kun de felter, sitet viser (ingen ejere, chipnumre, adresser eller andet fra registret).
async function hentTravinfo(gammel) {
  const get = async (sti) => {
    const svar = await fetch(API + sti, { headers: { 'User-Agent': `${new URL(SITE.url).hostname} (daglig opdatering)` }, signal: AbortSignal.timeout(20_000) });
    if (!svar.ok) throw new Error(`${svar.status} ${sti}`);
    return svar.json();
  };
  const L = SITE.licens;
  const basis = await get(`/licenseholders/${L}/basicinformation`);
  const traenerStat = await get(`/licenseholders/trainers/${L}/statistics`);
  const kuskStat = await get(`/licenseholders/drivers/${L}/statistics`);
  const resultater = await get(`/licenseholders/trainers/${L}/results`);
  const traeningsliste = await get(`/licenseholders/trainers/${L}/horses`);
  const kommende = await get(`/licenseholders/trainers/${L}/comingstarts`).catch(() => []);
  assert(Array.isArray(traeningsliste) && Array.isArray(resultater) && traenerStat.statistics?.length, 'uventet svar fra API');

  const kendte = new Map((gammel?.heste ?? []).map((h) => [h.id, h]));
  const heste = [];
  for (const h of traeningsliste) {
    const id = h.horse.id;
    let fast = kendte.get(id); // navn, fødsel og afstamning ændrer sig ikke – hentes kun første gang
    if (!fast?.far) {
      const info = await get(`/horses/${id}/basicinformation`);
      const stamtavle = await get(`/horses/${id}/pedigree?pedigreeTree=SMALL`);
      fast = { navn: info.name.replace('*', '').trim(), foedt: info.dateOfBirth, far: paentNavn(stamtavle.father?.name), mor: paentNavn(stamtavle.mother?.name) };
    }
    const livs = (await get(`/horses/${id}/statistics`)).statistics?.find((s) => s.year === 'Livs');
    heste.push({
      id, navn: fast.navn, alder: Number(h.age), koen: h.gender.text, foedt: fast.foedt, far: fast.far, mor: fast.mor,
      starter: tal(livs?.numberOfStarts), placeringer: livs?.placements ?? '0-0-0', praemier: h.prizeMoney ?? 0, rekord: livs?.mark ?? '',
    });
    await new Promise((r) => setTimeout(r, 150)); // rolig takt mod API'et
  }

  return {
    opdateret: new Date().toISOString(),
    traener: { foedt: Number(basis.yearBorn), hjemmebane: basis.homeTrack, licens: basis.licenseInfo?.description, farver: basis.trotAdditionalInformation?.dress },
    traenerStatistik: tilStatistik(traenerStat),
    kuskStatistik: tilStatistik(kuskStat),
    heste,
    resultater: flet(resultater.filter(erStart).map(tilResultat), gammel?.resultater),
    kommende: kommende.map((k) => ({ dato: k.raceInformation.date, bane: k.track.code, loeb: k.raceInformation.raceNumber, hestId: k.horse.id, hest: paentNavn(k.horse.name), kusk: kuskNavn(k.driver?.name) })),
  };
}

// ---------- Facebook ----------

// De 5 seneste opslag fra staldens Facebook-side hentes via Meta's Graph API, når FB_SIDE (sidens id eller brugernavn)
// og FB_TOKEN (et sideadgangstoken) er sat. Billederne gemmes på sitet selv, så de ikke udløber og ikke sætter cookies.
const FBFIL = path.join(ROD, 'data', 'facebook.json');
const FBMAPPE = path.join(ROD, 'assets', 'fb');
const GRAPH = 'https://graph.facebook.com/v24.0'; // ponytail: fast API-version – hæv den, når Meta udfaser den (ca. 2 år efter udgivelse)

/** Opslag fra Graph API → det, sitet viser. Opslag uden både tekst og billede bruges ikke. */
const tilOpslag = (p) => ({
  id: p.id,
  dato: p.created_time.slice(0, 10),
  tekst: (p.message ?? '').trim(),
  link: p.permalink_url,
  billede: p.full_picture ? `fb-${p.id.replace(/\W/g, '-')}.jpg` : '',
});

async function hentFacebook() {
  const svar = await fetch(`${GRAPH}/${encodeURIComponent(process.env.FB_SIDE)}/posts?fields=message,created_time,permalink_url,full_picture&limit=15`, {
    headers: { Authorization: `Bearer ${process.env.FB_TOKEN}` }, signal: AbortSignal.timeout(20_000),
  });
  if (!svar.ok) throw new Error(`Facebook svarede ${svar.status}`);
  const raa = (await svar.json()).data.filter((p) => p.message || p.full_picture).slice(0, 5);
  const opslag = raa.map(tilOpslag);
  await mkdir(FBMAPPE, { recursive: true });
  for (const [i, p] of raa.entries()) {
    if (!p.full_picture) continue;
    const billede = await fetch(p.full_picture, { signal: AbortSignal.timeout(20_000) });
    if (billede.ok) await writeFile(path.join(FBMAPPE, opslag[i].billede), Buffer.from(await billede.arrayBuffer()));
    else opslag[i].billede = '';
  }
  // ryd billeder fra opslag, der ikke længere er blandt de 5 seneste
  const behold = new Set(opslag.map((p) => p.billede));
  for (const fil of await readdir(FBMAPPE)) if (!behold.has(fil)) await rm(path.join(FBMAPPE, fil));
  await writeFile(FBFIL, `${JSON.stringify(opslag, null, 1)}\n`);
  return opslag.length;
}

// ---------- byg ----------

async function byg() {
  const data = JSON.parse(await readFile(DATAFIL, 'utf8'));
  data.facebook = await readFile(FBFIL, 'utf8').then(JSON.parse).catch(() => []);
  const kort = JSON.parse(await readFile(path.join(ROD, 'data', 'danmark.json'), 'utf8'));
  await rm(DIST, { recursive: true, force: true });
  await cp(path.join(ROD, 'assets'), path.join(DIST, 'assets'), { recursive: true });

  const hash = createHash('sha1');
  for (const fil of ['assets/css/site.css', 'assets/js/site.js']) hash.update(await readFile(path.join(ROD, fil)));
  const alle = sider(data, { v: hash.digest('hex').slice(0, 8), idag: new Date().toISOString().slice(0, 10), kort });

  for (const { sti, html } of alle) {
    await mkdir(path.dirname(path.join(DIST, sti)), { recursive: true });
    await writeFile(path.join(DIST, sti), html);
  }
  const offentlige = alle.filter((s) => s.url !== '404.html');
  await writeFile(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${offentlige.map((s) => `  <url><loc>${SITE.url}/${s.url}</loc><lastmod>${data.opdateret.slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>
`);
  // På en midlertidig github.io- eller vercel.app-adresse holdes sitet ude af søgemaskinerne; med eget domæne åbnes der.
  const midlertidig = /\.(github\.io|vercel\.app)$/.test(new URL(SITE.url).hostname);
  await writeFile(path.join(DIST, 'robots.txt'), midlertidig ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
  console.log(`Bygget ${alle.length} sider → dist/  (data fra ${data.opdateret.slice(0, 10)}: ${data.heste.length} heste, ${data.resultater.length} resultater)`);
}

// ---------- lokal forhåndsvisning ----------

function serve(port = Number(process.env.PORT) || 4173) {
  const typer = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
  http.createServer(async (req, res) => {
    let sti = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!path.extname(sti) && !sti.endsWith('/')) return res.writeHead(301, { location: `${sti}/` }).end();
    if (sti.endsWith('/')) sti += 'index.html';
    const fil = path.join(DIST, sti);
    if (!fil.startsWith(DIST + path.sep)) return res.writeHead(403).end();
    try {
      const indhold = await readFile(fil);
      res.writeHead(200, { 'content-type': typer[path.extname(fil)] ?? 'application/octet-stream' }).end(indhold);
    } catch {
      res.writeHead(404, { 'content-type': typer['.html'] }).end(await readFile(path.join(DIST, '404.html')).catch(() => 'Ikke fundet'));
    }
  }).listen(port, () => console.log(`Forhåndsvisning: http://localhost:${port}`));
}

// ---------- selvtjek ----------

function test() {
  assert.equal(tal('371 500 kr.'), 371500);
  assert.equal(tal('19%'), 19);
  assert.equal(paentNavn("LET'S RUN KÅSGÅRD"), "Let's Run Kåsgård");
  assert.equal(paentNavn('KARAT C N'), 'Karat C N');
  assert.equal(paentNavn('GIOVANNI* (SE)'), 'Giovanni (SE)');
  assert.equal(kuskNavn('Nielsen Casper M.'), 'Casper M. Nielsen');
  assert.equal(tid('16,0a'), '1.16,0a');
  assert.equal(tid('ga'), '');
  assert.equal(bedsteRekord('18,7k 14,3m 16,6ak *12,2am *12,6al'), '1.12,2am');
  assert.equal(bedsteRekord(''), '');
  assert.equal(plac('1'), '1');
  assert.equal(plac('0'), '–');
  assert.equal(plac('d'), 'disk.');
  const raa = (over) => ({ withdrawn: false, raceType: { displayValue: '' }, placement: { displayValue: '1' }, ...over });
  assert.equal(erStart(raa()), true);
  assert.equal(erStart(raa({ withdrawn: true })), false);
  assert.equal(erStart(raa({ raceType: { displayValue: 'k' } })), false);
  assert.equal(erStart(raa({ placement: { displayValue: '' } })), false);
  const flettet = flet([{ id: 'a', dato: '2026-10-02', loeb: 1, ny: true }], [{ id: 'a', dato: '2026-10-02', loeb: 1 }, { id: 'b', dato: '2026-10-03', loeb: 4 }]);
  assert.deepEqual(flettet.map((r) => r.id), ['b', 'a']);
  assert.equal(flettet[1].ny, true);
  const fb = tilOpslag({ id: '123_456', created_time: '2026-10-14T18:03:00+0000', message: ' Sejr i Aalborg! ', permalink_url: 'https://www.facebook.com/x', full_picture: 'https://scontent/x.jpg' });
  assert.deepEqual(fb, { id: '123_456', dato: '2026-10-14', tekst: 'Sejr i Aalborg!', link: 'https://www.facebook.com/x', billede: 'fb-123_456.jpg' });
  assert.equal(tilOpslag({ id: '1', created_time: '2026-10-14T00:00:00+0000', permalink_url: 'x' }).billede, '');
  console.log('Selvtjek OK');
}

// ---------- kør ----------

if (flag('test')) test();
else {
  if (flag('hent')) {
    const gammel = await readFile(DATAFIL, 'utf8').then(JSON.parse).catch(() => null);
    try {
      const nye = await hentTravinfo(gammel);
      await mkdir(path.dirname(DATAFIL), { recursive: true });
      await writeFile(DATAFIL, `${JSON.stringify(nye, null, 1)}\n`);
      console.log('Hentede friske data fra Dansk Hestevæddeløb.');
    } catch (fejl) {
      // Sitet må aldrig gå i stykker, fordi datakilden driller: behold de gamle data og byg videre.
      console.warn(`Kunne ikke hente nye data (${fejl.message}) – bygger med de gemte.`);
      if (!gammel) throw fejl;
    }
    if (process.env.FB_SIDE && process.env.FB_TOKEN) {
      // Samme princip: fejler Facebook, vises de gemte opslag.
      try { console.log(`Hentede ${await hentFacebook()} opslag fra Facebook.`); } catch (fejl) { console.warn(`Kunne ikke hente Facebook-opslag (${fejl.message}) – bruger de gemte.`); }
    }
  }
  await byg();
  if (flag('serve')) serve();
}
