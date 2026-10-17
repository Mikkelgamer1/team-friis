// Sticky top, mobilmenu og diskrete indtoninger. Ingen afhængigheder.
window.__klar = true;

const rod = document.documentElement;
const vedScroll = () => rod.classList.toggle('er-scrollet', scrollY > 24);
addEventListener('scroll', vedScroll, { passive: true });
vedScroll();

const menu = document.getElementById('menu');
// Knapperne har også commandfor/command, så menuen virker uden JavaScript i nyere browsere.
document.querySelector('.top .burger')?.addEventListener('click', () => { if (!menu.open) menu.showModal(); });
menu?.addEventListener('click', (e) => { if (menu.open && e.target.closest('[data-luk], a')) menu.close(); });

const io = new IntersectionObserver((poster) => {
  for (const p of poster) if (p.isIntersecting) { p.target.classList.add('ses'); io.unobserve(p.target); }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
document.querySelectorAll('[data-vis]').forEach((el) => io.observe(el));

// Facebook-opslag på forsiden. Facebook sætter cookies, så feedet hentes først, når den besøgende har sagt ja
// (i banneret eller ved at trykke på knappen). Valget huskes i browseren. Uden JavaScript hentes intet.
const fb = document.querySelector('[data-fb]');
if (fb) {
  const NOEGLE = 'fb-samtykke';
  const husk = (v) => { try { localStorage.setItem(NOEGLE, v); } catch {} };
  const valg = (() => { try { return localStorage.getItem(NOEGLE); } catch { return null; } })();
  const hent = () => {
    const b = Math.max(180, Math.min(500, Math.floor(fb.clientWidth)));
    const f = document.createElement('iframe');
    f.title = 'Seneste opslag fra Morten Friis på Facebook';
    f.loading = 'lazy';
    f.src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(fb.dataset.fb) + '&tabs=timeline&width=' + b + '&height=640&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false';
    f.style.maxWidth = b + 'px';
    fb.replaceChildren(f);
  };
  fb.querySelector('button').addEventListener('click', () => { husk('ja'); document.querySelector('.samtykke')?.remove(); hent(); });

  if (valg === 'ja') hent();
  else if (valg !== 'nej') {
    const banner = document.createElement('div');
    banner.className = 'samtykke';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookies');
    banner.innerHTML = '<p>Forsiden viser staldens seneste opslag fra Facebook. Det sætter cookies fra Facebook. Er det i orden?</p><div><button class="knap knap--lys knap--lille" type="button" data-svar="ja">Ja, vis opslag</button><button class="knap knap--lille samtykke__nej" type="button" data-svar="nej">Nej tak</button></div>';
    banner.addEventListener('click', (e) => {
      const svar = e.target.closest('[data-svar]')?.dataset.svar;
      if (!svar) return;
      husk(svar); banner.remove();
      if (svar === 'ja') hent();
    });
    document.body.append(banner);
  }
}
