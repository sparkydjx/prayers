/**
 * Cloister progress path — prayer stations without the rosary bead map.
 */

/**
 * @param {string} visualId
 * @returns {'opening' | 'closing' | `decade-${1|2|3|4|5}`}
 */
export function sectionForVisual(visualId) {
  if (
    visualId === 'crucifix' ||
    visualId === 'gold-opening' ||
    visualId === 'gap-opening' ||
    /^purple-opening-\d$/.test(visualId)
  ) {
    return 'opening'
  }
  if (visualId === 'mary') return 'closing'
  const decadeGold = /^gold-mystery-(\d)$/.exec(visualId)
  if (decadeGold) return `decade-${decadeGold[1]}`
  const gapOf = /^gap-of-(\d)$/.exec(visualId)
  if (gapOf) return `decade-${gapOf[1]}`
  const purple = /^purple-d(\d)-\d+$/.exec(visualId)
  if (purple) return `decade-${purple[1]}`
  const gapGb = /^gap-gb-(\d)$/.exec(visualId)
  if (gapGb) return `decade-${gapGb[1]}`
  return 'opening'
}

/**
 * Short place label without bead language.
 * @param {string} visualId
 * @param {string[]} [mysteryShortTitles]
 */
export function cloisterPlaceLabel(visualId, mysteryShortTitles = []) {
  if (visualId === 'crucifix') return 'Opening · Sign of the Cross'
  if (visualId === 'gold-opening') return 'Opening · Our Father'
  const openingPurple = /^purple-opening-(\d)$/.exec(visualId)
  if (openingPurple) {
    return `Opening · Hail Mary ${openingPurple[1]} of 3`
  }
  if (visualId === 'gap-opening') return 'Opening · Glory & Fatima'
  const gold = /^gold-mystery-(\d)$/.exec(visualId)
  if (gold) {
    const n = Number(gold[1])
    const title = mysteryShortTitles[n - 1]
    return title ? `Mystery ${n} · ${title}` : `Mystery ${n}`
  }
  const gapOf = /^gap-of-(\d)$/.exec(visualId)
  if (gapOf) return `Decade ${gapOf[1]} · Our Father`
  const purple = /^purple-d(\d)-(\d+)$/.exec(visualId)
  if (purple) {
    return `Decade ${purple[1]} · Hail Mary ${purple[2]} of 10`
  }
  const gapGb = /^gap-gb-(\d)$/.exec(visualId)
  if (gapGb) return `Decade ${gapGb[1]} · Glory & Fatima`
  if (visualId === 'mary') return 'Closing · Our Lady'
  return ''
}

/**
 * @param {string} title
 */
function shortMysteryTitle(title) {
  const parts = String(title).split('—')
  const tail = (parts[1] ?? parts[0]).trim()
  return tail.replace(/^The\s+/i, '')
}

/**
 * @param {import('./data/index.js').RosaryLaidOutStep[]} steps
 * @param {string} section
 */
function firstIndexForSection(steps, section) {
  return steps.findIndex((s) => sectionForVisual(s.visualId) === section)
}

/**
 * @param {HTMLElement} container
 * @param {{
 *   steps: import('./data/index.js').RosaryLaidOutStep[],
 *   mysteryTitles: string[]
 * }} opts
 */
export function mountCloisterPath(container, opts) {
  const { steps, mysteryTitles } = opts
  const shorts = mysteryTitles.map(shortMysteryTitle)

  const root = document.createElement('div')
  root.className = 'cloister-path'
  root.setAttribute('role', 'group')
  root.setAttribute('aria-label', 'Rosary cloister progress')

  const sky = document.createElement('div')
  sky.className = 'cloister-path__glow'
  sky.setAttribute('aria-hidden', 'true')
  for (let i = 0; i < 12; i++) {
    const speck = document.createElement('span')
    speck.className = 'cloister-path__mote'
    speck.style.setProperty('--x', `${8 + ((i * 19) % 84)}%`)
    speck.style.setProperty('--y', `${12 + ((i * 31) % 68)}%`)
    speck.style.setProperty('--d', `${(i % 5) * 0.4}s`)
    sky.append(speck)
  }

  const track = document.createElement('ol')
  track.className = 'cloister-path__track'

  /** @type {{ id: string, label: string, sub: string }[]} */
  const stations = [
    { id: 'opening', label: 'I', sub: 'Narthex' },
    ...shorts.map((title, i) => ({
      id: `decade-${i + 1}`,
      label: `${i + 1}`,
      sub: title
    })),
    { id: 'closing', label: '✠', sub: 'Our Lady' }
  ]

  for (const station of stations) {
    const li = document.createElement('li')
    li.className = 'cloister-path__station'
    li.dataset.section = station.id
    li.tabIndex = 0
    li.setAttribute('role', 'button')
    li.setAttribute(
      'aria-label',
      station.id === 'opening'
        ? 'Opening prayers'
        : station.id === 'closing'
          ? 'Closing prayers'
          : `Decade: ${station.sub}`
    )

    const node = document.createElement('span')
    node.className = 'cloister-path__node'
    node.textContent = station.label

    const caption = document.createElement('span')
    caption.className = 'cloister-path__caption'
    caption.textContent = station.sub

    li.append(node, caption)
    track.append(li)
  }

  const detail = document.createElement('div')
  detail.className = 'cloister-path__detail'
  detail.setAttribute('aria-hidden', 'true')

  root.append(sky, track, detail)
  container.replaceChildren(root)

  root._cloister = { steps, shorts, detail }
  return root
}

/**
 * @param {HTMLElement} root
 * @param {string | undefined} activeVisualId
 * @param {number} currentIndex
 */
export function highlightCloisterPath(root, activeVisualId, currentIndex) {
  const state = root._cloister
  if (!state || !activeVisualId) return
  const { steps, shorts, detail } = state
  const section = sectionForVisual(activeVisualId)

  root.querySelectorAll('.cloister-path__station').forEach((el) => {
    const id = el.getAttribute('data-section')
    const stationIndex = firstIndexForSection(steps, id ?? '')
    const isActive = id === section
    let sectionEnd = stationIndex
    if (stationIndex >= 0) {
      for (let i = stationIndex; i < steps.length; i++) {
        if (sectionForVisual(steps[i].visualId) === id) sectionEnd = i
        else break
      }
    }
    const past = stationIndex >= 0 && currentIndex > sectionEnd
    el.classList.toggle('is-active', isActive)
    el.classList.toggle('is-past', past && !isActive)
  })

  detail.replaceChildren()
  const inSection = steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => sectionForVisual(s.visualId) === section)

  const title = document.createElement('p')
  title.className = 'cloister-path__detail-title'
  if (section === 'opening') title.textContent = 'Opening prayers'
  else if (section === 'closing') title.textContent = 'Closing · Our Lady'
  else {
    const n = Number(section.split('-')[1])
    title.textContent = shorts[n - 1]
      ? `Decade ${n} · ${shorts[n - 1]}`
      : `Decade ${n}`
  }
  detail.append(title)

  const row = document.createElement('div')
  row.className = 'cloister-path__sparks'
  for (const { s, i } of inSection) {
    const spark = document.createElement('button')
    spark.type = 'button'
    spark.className = 'cloister-path__spark'
    spark.dataset.stepIndex = String(i)
    spark.setAttribute('aria-label', s.english.title)
    spark.title = s.english.title
    if (i < currentIndex) spark.classList.add('is-past')
    if (i === currentIndex) spark.classList.add('is-active')
    row.append(spark)
  }
  detail.append(row)
}

/**
 * @param {HTMLElement} root
 * @param {string} sectionId
 * @returns {number}
 */
export function firstIndexForCloisterSection(root, sectionId) {
  const steps = root._cloister?.steps
  if (!steps) return -1
  return firstIndexForSection(steps, sectionId)
}
