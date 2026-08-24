import rosaryHtml from '../rosary.html?raw'

const GAP_NEIGHBORS = {
  'gap-opening': ['purple-opening-3', 'gold-mystery-1'],
  'gap-of-2': ['gold-mystery-2', 'purple-d2-1'],
  'gap-of-3': ['gold-mystery-3', 'purple-d3-1'],
  'gap-of-4': ['gold-mystery-4', 'purple-d4-1'],
  'gap-of-5': ['gold-mystery-5', 'purple-d5-1'],
  'gap-gb-1': ['purple-d1-10', 'gold-mystery-2'],
  'gap-gb-2': ['purple-d2-10', 'gold-mystery-3'],
  'gap-gb-3': ['purple-d3-10', 'gold-mystery-4'],
  'gap-gb-4': ['purple-d4-10', 'gold-mystery-5']
}

function extractRosaryMarkup(html) {
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i)
  const start = html.lastIndexOf('<div class="rosary">')
  if (start < 0) {
    throw new Error('rosary.html is missing the .rosary map')
  }
  const bodyClose = html.lastIndexOf('</body>')
  const markup = html.slice(start, bodyClose > start ? bodyClose : undefined)
  return { css: styleMatch ? styleMatch[1] : '', markup }
}

function scopeRosaryCss(css) {
  return css
    .replace(/\bbody\s*\{/, '.rosary-stage {')
    .replace(/min-height:\s*100vh;/, 'min-height: 0;')
}

function ensureRosaryStyles(css) {
  if (document.getElementById('rosary-map-style')) return
  const style = document.createElement('style')
  style.id = 'rosary-map-style'
  style.textContent = scopeRosaryCss(css)
  document.head.append(style)
}

function publicAsset(path) {
  const name = String(path).replace(/^(\.\/)?assets\//, '')
  return `./assets/${name}`
}

function beadCircles(svg) {
  return [...svg.querySelectorAll('circle[fill^="url(#rosary-bead-"]')]
}

function tag(el, visualId) {
  if (!el) return
  el.setAttribute('data-visual', visualId)
}

function annotateRosaryMap(root) {
  const crucifixImg = root.querySelector('.crucifix-image')
  const crucifixSvg = [...root.querySelectorAll(':scope > svg')].find(
    (svg) => svg.getAttribute('width') === '86'
  )
  tag(crucifixImg, 'crucifix')
  tag(crucifixSvg, 'crucifix')
  if (crucifixImg && crucifixSvg) {
    crucifixImg.addEventListener('error', () => {
      crucifixImg.style.display = 'none'
      crucifixSvg.style.display = ''
    })
    crucifixImg.addEventListener('load', () => {
      crucifixSvg.style.display = 'none'
    })
  }

  const marys = root.querySelectorAll('.mary-container')
  tag(marys[0], 'gap-of-1')
  tag(marys[1], 'mary')

  const beadSvgs = [...root.querySelectorAll('svg')].filter(
    (svg) => beadCircles(svg).length > 0
  )
  if (beadSvgs.length !== 10) {
    throw new Error(
      `rosary.html expected 10 bead groups, found ${beadSvgs.length}`
    )
  }

  const pendant = beadCircles(beadSvgs[0]).slice().reverse()
  if (pendant.length !== 5) {
    throw new Error('rosary.html pendant should have 5 beads')
  }
  tag(pendant[0], 'gold-opening')
  tag(pendant[1], 'purple-opening-1')
  tag(pendant[2], 'purple-opening-2')
  tag(pendant[3], 'purple-opening-3')
  tag(pendant[4], 'gold-mystery-1')
  const openingGap = [...beadSvgs[0].querySelectorAll('line')].find(
    (line) => line.getAttribute('y1') === '18'
  )
  tag(openingGap, 'gap-opening')

  const loop = beadSvgs.slice(1)
  const tenBead = [loop[0], loop[2], loop[4], loop[6], loop[8]]
  const golds = [loop[1], loop[3], loop[5], loop[7]]
  if (tenBead.some((svg) => !svg) || golds.some((svg) => !svg)) {
    throw new Error('rosary.html decade layout does not match the expected map')
  }

  /**
   * The page is column-reverse, so after the center Mary you meet
   * HTML "decade 5" first. Map that physical order to mysteries 1–5.
   */
  const decadeSvgsFromMary = [
    tenBead[4],
    golds[3],
    tenBead[3],
    golds[2],
    tenBead[2],
    golds[1],
    tenBead[1],
    golds[0],
    tenBead[0]
  ]

  const d1 = beadCircles(decadeSvgsFromMary[0]).slice().reverse()
  d1.forEach((c, i) => tag(c, `purple-d1-${i + 1}`))
  tag(beadCircles(decadeSvgsFromMary[1])[0], 'gold-mystery-2')
  const d2 = beadCircles(decadeSvgsFromMary[2]).slice().reverse()
  d2.forEach((c, i) => tag(c, `purple-d2-${i + 1}`))
  tag(beadCircles(decadeSvgsFromMary[3])[0], 'gold-mystery-3')
  const d3 = beadCircles(decadeSvgsFromMary[4]).slice().reverse()
  d3.forEach((c, i) => tag(c, `purple-d3-${i + 1}`))
  tag(beadCircles(decadeSvgsFromMary[5])[0], 'gold-mystery-4')
  const d4 = beadCircles(decadeSvgsFromMary[6]).slice().reverse()
  d4.forEach((c, i) => tag(c, `purple-d4-${i + 1}`))
  tag(beadCircles(decadeSvgsFromMary[7])[0], 'gold-mystery-5')
  const d5 = beadCircles(decadeSvgsFromMary[8]).slice().reverse()
  d5.forEach((c, i) => tag(c, `purple-d5-${i + 1}`))

  const gapOnGold = [
    { svg: golds[3], gb: 'gap-gb-1', of: 'gap-of-2' },
    { svg: golds[2], gb: 'gap-gb-2', of: 'gap-of-3' },
    { svg: golds[1], gb: 'gap-gb-3', of: 'gap-of-4' },
    { svg: golds[0], gb: 'gap-gb-4', of: 'gap-of-5' }
  ]
  for (const { svg, gb, of } of gapOnGold) {
    const lines = [...svg.querySelectorAll('line')]
    const towardMary = lines.find((line) => line.getAttribute('y1') === '24')
    const towardEnd = lines.find((line) => line.getAttribute('y1') === '0')
    tag(towardMary, gb)
    tag(towardEnd, of)
  }
}

/**
 * Mount the static rosary map from rosary.html.
 * @param {HTMLElement} container
 * @returns {HTMLElement}
 */
export function mountRosaryMap(container) {
  const { css, markup } = extractRosaryMarkup(rosaryHtml)
  ensureRosaryStyles(css)

  const parsed = new DOMParser().parseFromString(markup, 'text/html')
  const rosary = parsed.body.querySelector('.rosary')
  if (!rosary) throw new Error('Could not parse rosary.html map')

  rosary.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src')
    if (src) img.setAttribute('src', publicAsset(src))
  })
  rosary.querySelectorAll('image').forEach((image) => {
    const href = image.getAttribute('href') || image.getAttribute('xlink:href')
    if (href) image.setAttribute('href', publicAsset(href))
  })

  const amethyst = rosary.querySelector('#rosary-bead-amethyst')
  if (amethyst && amethyst.tagName.toLowerCase() === 'pattern') {
    const svgNS = 'http://www.w3.org/2000/svg'
    const grad = document.createElementNS(svgNS, 'radialGradient')
    grad.setAttribute('id', 'rosary-bead-amethyst')
    grad.setAttribute('cx', '35%')
    grad.setAttribute('cy', '30%')
    grad.setAttribute('r', '70%')
    const stops = [
      ['0%', '#e9d5ff'],
      ['45%', '#7c3aed'],
      ['100%', '#4c1d95']
    ]
    for (const [offset, color] of stops) {
      const stop = document.createElementNS(svgNS, 'stop')
      stop.setAttribute('offset', offset)
      stop.setAttribute('stop-color', color)
      grad.append(stop)
    }
    amethyst.replaceWith(grad)
  }

  annotateRosaryMap(rosary)
  container.replaceChildren(rosary)
  return rosary
}

/**
 * @param {ParentNode} root
 * @param {string | undefined} activeId
 * @param {Set<string>} pastIds
 */
export function highlightRosaryVisual(root, activeId, pastIds) {
  const extra = new Set(GAP_NEIGHBORS[activeId] ?? [])
  root.querySelectorAll('[data-visual]').forEach((node) => {
    const id = node.getAttribute('data-visual')
    const isActive = id === activeId || extra.has(id)
    node.classList.toggle('is-active', isActive)
    node.classList.toggle('is-gap-neighbor', extra.has(id) && id !== activeId)
    node.classList.toggle(
      'is-past',
      Boolean(id && pastIds.has(id) && !isActive)
    )
  })
  const active =
    root.querySelector(`[data-visual="${activeId}"]`) ??
    (extra.size ? root.querySelector(`[data-visual="${[...extra][0]}"]`) : null)
  const stage = root.closest('.rosary-stage')
  if (active && stage) {
    const stageBox = stage.getBoundingClientRect()
    const activeBox = active.getBoundingClientRect()
    const offset =
      activeBox.top -
      stageBox.top -
      stageBox.height / 2 +
      activeBox.height / 2
    stage.scrollTop += offset
  }
}
