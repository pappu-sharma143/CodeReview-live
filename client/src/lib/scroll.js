export function scrollToSection(href) {
  const id = href.replace(/^#/, '');
  const el = document.getElementById(id);
  if (!el) return;

  const navOffset = 80;
  const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
  window.scrollTo({ top, behavior: 'smooth' });
}
