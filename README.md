# Team Friis – hjemmeside

Statisk site for Team Friis og travtræner Morten Friis (licens 20245). Ingen afhængigheder – kræver kun Node 20+.

```
node build.mjs            byg til dist/ med de gemte data
node build.mjs --hent     hent friske data fra Dansk Hestevæddeløb først
node build.mjs --serve    byg og vis på http://localhost:4173 (PORT=… for en anden port)
node build.mjs --test     selvtjek
```

## Det opdaterer sig selv

- **Heste i træning, resultater, kommende starter og statistik** hentes fra Dansk Hestevæddeløbs åbne data (samme kilde som travinfo.dk) og gemmes i `data/travinfo.json`.
- `.github/workflows/opdater.yml` henter data hver morgen og ved hvert push til `main` og gemmer dem i repoet – så bygger Vercel en ny udgave. Fejler hentningen, bygges der videre med de gemte data.
- På Vercel bygges sitet med `vercel.json` og får projektets adresse automatisk. En `vercel.app`- eller `github.io`-adresse holdes ude af søgemaskinerne.

## Facebook-opslag på forsiden

De 5 seneste opslag fra staldens Facebook-**side** kan vises som kort på forsiden. De hentes ved den daglige opdatering via Meta's Graph API, og billederne gemmes på sitet selv – ingen indlejring, ingen cookies og intet klik.

Opsætning (én gang, af en administrator af Facebook-siden):

1. developers.facebook.com → **Mine apps** → **Opret app** (type: Virksomhed).
2. **Graph API Explorer**: vælg appen og siden, giv tilladelserne `pages_show_list` og `pages_read_engagement`, hent et **sideadgangstoken** og forlæng det i **Access Token Debugger**.
3. Find sidens id (`me?fields=id,name` med sidetokenet).
4. GitHub-repoet → **Settings → Secrets and variables → Actions**: secret `FB_TOKEN` = sidetokenet, variable `FB_SIDE` = sidens id.
5. Kør workflowet "Opdater data" én gang.

Sæt også sidens adresse i `SITE.facebook` (og Instagram i `SITE.instagram`), så "Følg stalden" og links vises.

## Ret indhold

Alt indhold står i `templates.mjs`: kontaktoplysninger i `SITE` øverst. Design i `assets/css/site.css` (farverne øverst: papir, sort, blå og grøn – staldens løbsfarver).

## Kilder

| Oplysning | Kilde |
| --- | --- |
| Født 1983, A1-licens, hjemmebane Skive Trav, adresse, telefon, løbsfarver (sort/blå/grøn) | Dansk Hestevæddeløb (licens 20245) |
| Træningsliste, resultater, statistik | Dansk Hestevæddeløb, opdateres dagligt |
| Skive Trav: åbnet 1948, Flyvej siden 1966, lysanlæg 2019–20 | skive-trav.dk/om-os |
| Instagram: instagram.com/team_friis | Givet af Mikkel 13.11.2026 |
| Team Friis, Lånum, e-mail, monterytter Tineke Borup | Facebook-siden facebook.com/Team.Friis (introduktion) |
| Emblem, portræt, løbsfoto og hestekort | Team Friis' Facebook-side |
| Slogan "Passion · Udvikling · Resultater" | Team Friis' egne grafikker på Facebook |
| Sejre som kusk i karrieren (seglet på forsiden) | 1.000 nået med Kaos i Aalborg 11.11.2026 (travet.dk 12.11.2026: "Morten Friis: Fra jockeyernes førertrøje til 1.000 sejre"); hver ny sejr lægges til fra Dansk Hestevæddeløbs kuskresultater ved den daglige opdatering |
| Tidslinjen på Om-siden: landschampion for jockeyer 2004–2008 (46, 62, 45, 49, 59 sejre) | Travsportens Hall of Fame: thof.dk/media/2186/landschampionater-2018.pdf |
| Tidslinjen: storløb med Politiken, Amalie Bork og Hokita; 20 og 17 sejre med Morten som kusk | Dansk Hestevæddeløbs resultater for hestene med officielle løbsnavne (tjekket 13.11.2026) |
| Tidslinjen: Taroks Mindeløb med Flik Flak 2004 og 2006 | travet.dk 12.11.2026; sejrene (Charlottenlund 31.10.2004 og 29.10.2006) står i Dansk Hestevæddeløbs data uden løbsnavn |
| Samarbejdspartnere: KRAFFT og reron Fibertech | Logoer på Mortens løbsdragt; reronfibertech.dk |
