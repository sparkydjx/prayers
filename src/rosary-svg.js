const SVG_NS = 'http://www.w3.org/2000/svg'

const CX = 200
const CY = 248
const RX = 148
const RY = 168
const T0 = Math.PI / 2
const DECADE_ARC = (Math.PI * 2) / 5
const GOLD_MARGIN = 0.2
const END_MARGIN = 0.2

function ellipsePoint(t) {
  return { x: CX + RX * Math.cos(t), y: CY + RY * Math.sin(t) }
}

function arcD(t0, t1) {
  const a = ellipsePoint(t0)
  const b = ellipsePoint(t1)
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${RX} ${RY} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name)
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue
    node.setAttribute(key, String(value))
  }
  for (const child of children) {
    node.append(child)
  }
  return node
}

function title(text) {
  const t = document.createElementNS(SVG_NS, 'title')
  t.textContent = text
  return t
}

function maryLabel() {
  const label = el('text', {
    y: '31',
    'text-anchor': 'middle',
    'font-size': '8',
    fill: '#fef3c7',
    'font-family': 'Georgia, serif',
    'pointer-events': 'none'
  })
  label.textContent = 'Mary'
  return label
}

function goldBead(visualId, x, y, label) {
  return el(
    'g',
    {
      class: 'bead bead-gold',
      'data-visual': visualId,
      transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
      role: 'button',
      tabindex: '-1'
    },
    [
      title(label),
      el('circle', { class: 'bead-hit', r: '16' }),
      el('circle', { class: 'bead-face', r: '12', fill: 'url(#bead-gold)' })
    ]
  )
}

function purpleBead(visualId, x, y, label) {
  return el(
    'g',
    {
      class: 'bead bead-purple',
      'data-visual': visualId,
      transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
      role: 'button',
      tabindex: '-1'
    },
    [
      title(label),
      el('circle', { class: 'bead-hit', r: '12' }),
      el('circle', { class: 'bead-face', r: '7.2', fill: 'url(#bead-purple)' })
    ]
  )
}

function gapPath(visualId, d, label, extraClass = 'gap') {
  return el(
    'g',
    {
      class: extraClass,
      'data-visual': visualId,
      role: 'button',
      tabindex: '-1'
    },
    [
      title(label),
      el('path', { class: 'gap-hit', d }),
      el('path', { class: 'gap-face', d })
    ]
  )
}

function crucifix() {
  return el(
    'g',
    {
      class: 'crucifix',
      'data-visual': 'crucifix',
      transform: 'translate(200 655)',
      role: 'button',
      tabindex: '-1'
    },
    [
      title('Crucifix'),
      el('rect', { class: 'bead-hit', x: '-22', y: '-40', width: '44', height: '78', rx: '8' }),
      el('rect', {
        x: '-4.5',
        y: '-32',
        width: '9',
        height: '62',
        rx: '1.5',
        fill: 'url(#wood)'
      }),
      el('rect', {
        x: '-18',
        y: '-16',
        width: '36',
        height: '8',
        rx: '1.5',
        fill: 'url(#wood)'
      }),
      el('rect', { x: '-3.2', y: '-30', width: '6.4', height: '8', rx: '0.8', fill: '#d6c28a' })
    ]
  )
}

function maryMedal() {
  return el(
    'g',
    {
      class: 'mary-medal',
      'data-visual': 'mary',
      transform: `translate(${CX} ${CY})`,
      role: 'button',
      tabindex: '-1'
    },
    [
      title('Image of Mary'),
      el('circle', { class: 'bead-hit', r: '48' }),
      el('circle', { r: '44', fill: 'url(#medal-gold)' }),
      el('circle', { r: '36', fill: '#1e3a8a' }),
      el('circle', { cx: '0', cy: '-11', r: '13', fill: 'none', stroke: '#fde68a', 'stroke-width': '1.6' }),
      el('path', {
        d: 'M -16 8 Q 0 -6 16 8 L 18 30 Q 0 38 -18 30 Z',
        fill: '#93c5fd'
      }),
      el('path', {
        d: 'M -13 -8 Q 0 -30 13 -8 L 11 10 Q 0 16 -11 10 Z',
        fill: '#e0e7ff'
      }),
      el('ellipse', { cx: '0', cy: '-10', rx: '6.2', ry: '7.2', fill: '#f8e4d4' }),
      el('path', {
        d: 'M -5 4 Q 0 10 5 4 L 7 22 Q 0 28 -7 22 Z',
        fill: '#1d4ed8'
      }),
      maryLabel()
    ]
  )
}

function defs() {
  return el('defs', {}, [
    el(
      'radialGradient',
      { id: 'bead-gold', cx: '35%', cy: '30%', r: '70%' },
      [
        el('stop', { offset: '0%', 'stop-color': '#fff7d6' }),
        el('stop', { offset: '45%', 'stop-color': '#f5c84c' }),
        el('stop', { offset: '100%', 'stop-color': '#b45309' })
      ]
    ),
    el(
      'radialGradient',
      { id: 'bead-purple', cx: '35%', cy: '30%', r: '70%' },
      [
        el('stop', { offset: '0%', 'stop-color': '#ddd6fe' }),
        el('stop', { offset: '50%', 'stop-color': '#7c3aed' }),
        el('stop', { offset: '100%', 'stop-color': '#4c1d95' })
      ]
    ),
    el(
      'radialGradient',
      { id: 'medal-gold', cx: '35%', cy: '30%', r: '70%' },
      [
        el('stop', { offset: '0%', 'stop-color': '#fde68a' }),
        el('stop', { offset: '100%', 'stop-color': '#b45309' })
      ]
    ),
    el(
      'linearGradient',
      { id: 'wood', x1: '0', y1: '0', x2: '1', y2: '0' },
      [
        el('stop', { offset: '0%', 'stop-color': '#6b4423' }),
        el('stop', { offset: '50%', 'stop-color': '#8b5a2b' }),
        el('stop', { offset: '100%', 'stop-color': '#5c3a1e' })
      ]
    )
  ])
}

/**
 * Interactive rosary: gold beads, purple beads, crucifix, and Mary at the center.
 * @returns {SVGSVGElement}
 */
export function createRosarySvg() {
  const golds = []
  const decadePurples = []
  for (let d = 0; d < 5; d++) {
    const tGold = T0 + d * DECADE_ARC
    golds.push({ t: tGold, ...ellipsePoint(tGold) })
    const tStart = tGold + GOLD_MARGIN
    const tEnd = tGold + DECADE_ARC - END_MARGIN
    const beads = []
    for (let i = 0; i < 10; i++) {
      const t = tStart + (i / 9) * (tEnd - tStart)
      beads.push({ t, ...ellipsePoint(t) })
    }
    decadePurples.push(beads)
  }

  const opening = {
    gold: { x: 200, y: 575 },
    purple: [
      { x: 200, y: 538 },
      { x: 200, y: 508 },
      { x: 200, y: 478 }
    ]
  }

  const svg = el(
    'svg',
    {
      class: 'rosary-svg',
      viewBox: '0 0 400 720',
      role: 'img',
      'aria-label': 'Rosary with gold beads, purple beads, crucifix, and image of Mary'
    },
    [defs()]
  )

  svg.append(
    el('ellipse', {
      class: 'rosary-cord',
      cx: String(CX),
      cy: String(CY),
      rx: String(RX),
      ry: String(RY)
    }),
    el('line', {
      class: 'rosary-cord',
      x1: '200',
      y1: String(golds[0].y),
      x2: '200',
      y2: '628'
    })
  )

  svg.append(
    gapPath(
      'gap-opening',
      `M 200 ${opening.purple[2].y} L ${golds[0].x.toFixed(2)} ${golds[0].y.toFixed(2)}`,
      'Between the third purple bead and the gold bead'
    ),
    gapPath(
      'gap-of-1',
      `M ${golds[0].x.toFixed(2)} ${golds[0].y.toFixed(2)} L ${CX} ${CY}`,
      'Between the gold bead and the image of Mary',
      'gap gap-spoke'
    )
  )

  for (let d = 1; d < 5; d++) {
    svg.append(
      gapPath(
        `gap-of-${d + 1}`,
        arcD(golds[d].t, decadePurples[d][0].t),
        'Between the gold bead and the purple beads'
      )
    )
  }

  for (let d = 0; d < 4; d++) {
    svg.append(
      gapPath(
        `gap-gb-${d + 1}`,
        arcD(decadePurples[d][9].t, golds[d + 1].t),
        'Between the last purple bead and the gold bead'
      )
    )
  }

  svg.append(maryMedal())
  svg.append(crucifix())
  svg.append(goldBead('gold-opening', opening.gold.x, opening.gold.y, 'First gold bead'))

  opening.purple.forEach((p, i) => {
    svg.append(
      purpleBead(`purple-opening-${i + 1}`, p.x, p.y, `Purple bead (${i + 1} of 3)`)
    )
  })

  golds.forEach((g, i) => {
    svg.append(
      goldBead(`gold-mystery-${i + 1}`, g.x, g.y, `Gold bead — mystery ${i + 1}`)
    )
  })

  decadePurples.forEach((beads, di) => {
    beads.forEach((b, i) => {
      svg.append(
        purpleBead(
          `purple-d${di + 1}-${i + 1}`,
          b.x,
          b.y,
          `Purple bead (${i + 1} of 10)`
        )
      )
    })
  })

  return svg
}

/**
 * @param {SVGSVGElement} svg
 * @param {string | undefined} activeId
 * @param {Set<string>} pastIds
 */
export function highlightRosaryVisual(svg, activeId, pastIds) {
  svg.querySelectorAll('[data-visual]').forEach((node) => {
    const id = node.getAttribute('data-visual')
    node.classList.toggle('is-active', id === activeId)
    node.classList.toggle('is-past', Boolean(id && pastIds.has(id) && id !== activeId))
  })
}
