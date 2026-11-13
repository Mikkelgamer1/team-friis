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
