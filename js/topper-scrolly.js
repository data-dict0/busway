(function () {
  // Blocks of 10 columns x 25 rows as in topper-Artboard_1.png; the last block may be partial
  const TOTAL_PEOPLE = 183000;
  const PEOPLE_PER_ICON = 100;
  const COLS = 10;
  const ROWS = 25;
  const TOTAL = Math.round(TOTAL_PEOPLE / PEOPLE_PER_ICON);
  const BLOCKS = Math.ceil(TOTAL / (COLS * ROWS));
  const COLOR = '#479a91';

  // Geometry in units of one column width
  const VIEWBOX = [-1, -1, 22, 52];
  const ICON_ASPECT = VIEWBOX[3] / VIEWBOX[2];
  const ICON_W = 0.86;
  const ICON_H = ICON_W * ICON_ASPECT;
  const ROW_STEP = 1.08;
  const GAP = 0.8;
  const BLOCK_H = (ROWS - 1) * ROW_STEP + ICON_H;

  const fmt = d3.format(',');
  const root = d3.select('#topper-scrolly');
  const chart = root.select('.scrolly-chart');
  const countEl = root.select('.scrolly-count');
  const counterNode = root.select('.scrolly-counter').node();
  const graphicNode = root.select('.scrolly-graphic').node();
  const stepNodes = root.selectAll('.scrolly-step').nodes();

  const svg = chart.append('svg').attr('class', 'scrolly-svg').attr('aria-hidden', true);

  const symbol = svg
    .append('defs')
    .append('symbol')
    .attr('id', 'person-icon')
    .attr('viewBox', VIEWBOX.join(' '));
  symbol.append('circle').attr('cx', 10).attr('cy', 4.6).attr('r', 4.3);
  // Body, arms and legs as one outline; the narrow slits beside the torso fill in with the white stroke
  symbol
    .append('path')
    .attr(
      'd',
      'M0.5,14.3A4,4 0 0 1 4.5,10.3H15.5A4,4 0 0 1 19.5,14.3V28.4A1.6,1.6 0 0 1 16.3,28.4V15.2H15.6' +
        'V47.3A2.2,2.2 0 0 1 11.2,47.3V31.3H8.8V47.3A2.2,2.2 0 0 1 4.4,47.3V15.2H3.7V28.4A1.6,1.6 0 0 1 0.5,28.4Z'
    );

  const data = d3.range(TOTAL).map((i) => {
    const inBlock = i % (COLS * ROWS);
    return { block: Math.floor(i / (COLS * ROWS)), row: Math.floor(inBlock / COLS), col: inBlock % COLS };
  });

  const icons = svg
    .append('g')
    .attr('fill', COLOR)
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.9)
    .attr('stroke-linejoin', 'round')
    .selectAll('use')
    .data(data)
    .join('use')
    .attr('href', '#person-icon')
    .attr('class', 'icon');
  const iconNodes = icons.nodes();

  root
    .select('.scrolly-legend')
    .insert('svg', ':first-child')
    .attr('viewBox', VIEWBOX.join(' '))
    .attr('width', 12)
    .attr('height', 12 * ICON_ASPECT)
    .attr('aria-hidden', true)
    .append('use')
    .attr('href', '#person-icon')
    .attr('fill', COLOR);
  root.select('.scrolly-legend-text').text(`= ${fmt(PEOPLE_PER_ICON)} people`);

  function layout() {
    const { width, height } = chart.node().getBoundingClientRect();
    svg.attr('width', width).attr('height', height);

    // Pick how many blocks sit side by side so the icons come out largest
    let best = null;
    for (let perRow = 1; perRow <= BLOCKS; perRow++) {
      const blockRows = Math.ceil(BLOCKS / perRow);
      const wUnits = perRow * COLS + (perRow - 1) * GAP;
      const hUnits = blockRows * BLOCK_H + (blockRows - 1) * GAP;
      const cell = Math.min(width / wUnits, height / hUnits);
      if (!best || cell > best.cell) best = { perRow, cell, wUnits, hUnits };
    }

    const { perRow, cell, wUnits, hUnits } = best;
    const ox = (width - wUnits * cell) / 2;
    const oy = (height - hUnits * cell) / 2;

    icons
      .attr('width', ICON_W * cell)
      .attr('height', ICON_H * cell)
      .attr('x', (d) => {
        const bRow = Math.floor(d.block / perRow);
        const inRow = Math.min(perRow, BLOCKS - bRow * perRow);
        const shift = ((perRow - inRow) * (COLS + GAP)) / 2;
        const bCol = d.block % perRow;
        return ox + (shift + bCol * (COLS + GAP) + d.col + (1 - ICON_W) / 2) * cell;
      })
      .attr('y', (d) => {
        const bRow = Math.floor(d.block / perRow);
        return oy + (bRow * (BLOCK_H + GAP) + d.row * ROW_STEP) * cell;
      });

    const first = iconNodes[0];
    gridRect = ['x', 'y', 'width', 'height'].map((k) => +first.getAttribute(k));
    const h = Math.min(height * 0.5, width * 1.2);
    const w = h / ICON_ASPECT;
    heroRect = [(width - w) / 2, Math.max(0, height * 0.4 - h / 2), w, h];
  }

  let gridRect = [0, 0, 0, 0];
  let heroRect = [0, 0, 0, 0];
  function placeFirst(t) {
    const r = d3.interpolate(heroRect, gridRect)(d3.easeCubicInOut(t));
    d3.select(iconNodes[0]).attr('x', r[0]).attr('y', r[1]).attr('width', r[2]).attr('height', r[3]);
  }

  let shown = 0;
  function setShown(n) {
    const lo = Math.min(shown, n);
    const hi = Math.max(shown, n);
    for (let i = lo; i < hi; i++) iconNodes[i].classList.toggle('is-on', i < n);
    shown = n;
    countEl.text(fmt(n * PEOPLE_PER_ICON));
  }

  // First icon shrinks into place while step 2 rises from the bottom to 70% of the screen,
  // then the fill runs until step 5 reaches mid-screen, before the headline fades the chart.
  function update() {
    const vh = window.innerHeight;
    const s2 = stepNodes[1].firstElementChild.getBoundingClientRect().top;
    const s5 = stepNodes[4].firstElementChild.getBoundingClientRect().top;
    const s6 = stepNodes[5].firstElementChild.getBoundingClientRect().top;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    placeFirst(clamp((vh - s2) / (vh * 0.3)));
    const p = clamp((vh * 0.7 - s2) / (s5 - s2 + vh * 0.2));
    setShown(1 + Math.round(p * (TOTAL - 1)));
    const fade = p === 1 ? clamp((vh - s6) / (vh * 0.5)) : 0;
    chart.style('opacity', 1 - fade * 0.7);
    // Push the counter up in step with the graphic once the graphic stops sticking and scrolls away
    const lift = Math.min(0, graphicNode.getBoundingClientRect().top - counterNode.offsetHeight);
    counterNode.style.transform = lift ? `translateY(${lift}px)` : '';
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

  layout();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    layout();
    update();
  });
})();
