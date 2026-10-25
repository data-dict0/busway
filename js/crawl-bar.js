(function () {
  const TOTAL = 183000;
  const ANNOTATIONS = [
    // Baseline is always on since the value never drops below 0
    { value: 0, text: '' },
    { value: 20000, text: 'MOA Arena capacity' },
    { value: 55000, text: 'San Miguel Corp. employees' },
    { value: 100000, text: 'Average number of people in 58,000 cars in EDSA' },
  ];
  // The fill starts when the track top passes READ_LINE and finishes when the track bottom
  // passes END_LINE, so little space is needed below the bar
  const READ_LINE = 0.6;
  const END_LINE = 0.85;

  const fmt = new Intl.NumberFormat('en-US');
  const root = document.getElementById('crawl-bar');
  if (!root) return;
  const track = root.querySelector('.crawl-track');
  const fill = root.querySelector('.crawl-fill');
  const tip = root.querySelector('.crawl-tip');
  const tipValue = root.querySelector('.crawl-tip-value');

  const notes = ANNOTATIONS.map((a) => {
    const el = document.createElement('div');
    el.className = a.value === 0 ? 'crawl-note crawl-note-zero' : 'crawl-note';
    el.style.top = `${(a.value / TOTAL) * 100}%`;
    el.innerHTML =
      '<span class="crawl-note-line"></span>' +
      `<span class="crawl-note-label"><strong>${fmt.format(a.value)}</strong> ${a.text}</span>`;
    track.appendChild(el);
    return { el, value: a.value };
  });

  function update() {
    const rect = track.getBoundingClientRect();
    const h = rect.height;
    const vh = window.innerHeight;
    const span = h - (END_LINE - READ_LINE) * vh;
    const p = span > 0 ? Math.max(0, Math.min(1, (vh * READ_LINE - rect.top) / span)) : 1;
    const filled = p * h;
    const value = Math.round((p * TOTAL) / 100) * 100;

    fill.style.height = `${filled}px`;
    tip.style.top = `${filled}px`;
    tip.classList.toggle('is-on', filled > 0);
    tipValue.textContent = fmt.format(value);
    notes.forEach((n) => n.el.classList.toggle('is-on', value >= n.value));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
})();
