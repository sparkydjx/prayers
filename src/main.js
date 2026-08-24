import './style.css'
import { registerSW } from 'virtual:pwa-register'
import {
  rosaryTypes,
  expandRosaryTypeLaidOut,
  mysteryGroups,
  visualPlaceLabel
} from './data/index.js'
import { mountRosaryMap, highlightRosaryVisual } from './rosary-map.js'

registerSW({ immediate: true })

const ROSARY_ORDER = [
  'rosary-joyful',
  'rosary-sorrowful',
  'rosary-glorious',
  'rosary-luminous'
]

/** @type {import('./data/index.js').RosaryType[]} */
const orderedRosaryTypes = ROSARY_ORDER.map((id) =>
  rosaryTypes.find((r) => r.id === id)
).filter(Boolean)

/** @type {import('./data/index.js').RosaryLaidOutStep[]} */
let activeRosarySteps = []
let currentIndex = 0
/** @type {string | null} */
let activeRosaryId = null

/** @type {HTMLButtonElement | null} */
let lastRosaryButton = null

/** @param {HTMLElement} el */
function setVisible(el, visible) {
  el.classList.toggle('hidden', !visible)
  el.setAttribute('aria-hidden', visible ? 'false' : 'true')
}

function stepStorageKey(rosaryTypeId) {
  return `rosary-step:${rosaryTypeId}`
}

function saveStep() {
  if (!activeRosaryId) return
  sessionStorage.setItem(stepStorageKey(activeRosaryId), String(currentIndex))
}

function loadStep(rosaryTypeId, length) {
  const raw = sessionStorage.getItem(stepStorageKey(rosaryTypeId))
  const n = raw == null ? 0 : Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, Math.max(0, length - 1))
}

/**
 * @param {HTMLElement} container
 * @param {'en' | 'la' | 'both'} mode
 * @param {import('./data/index.js').RosaryLaidOutStep} step
 */
function renderCurrentPrayer(container, mode, step) {
  container.replaceChildren()
  const article = document.createElement('article')
  article.className = 'rosary-step rosary-step--current'

  if (mode === 'both') {
    const row = document.createElement('div')
    row.className = 'rosary-step__both'

    const colEn = document.createElement('div')
    colEn.className = 'rosary-step__col rosary-step__col--en'
    const hEn = document.createElement('h3')
    hEn.textContent = step.english.title
    const pEn = document.createElement('p')
    pEn.className = 'rosary-step__text'
    pEn.textContent = step.english.text
    colEn.append(hEn, pEn)

    const colLa = document.createElement('div')
    colLa.className = 'rosary-step__col rosary-step__col--la'
    const hLa = document.createElement('h3')
    hLa.textContent = step.latin.title
    const pLa = document.createElement('p')
    pLa.className = 'rosary-step__text'
    pLa.textContent = step.latin.text
    colLa.append(hLa, pLa)

    row.append(colEn, colLa)
    article.append(row)
  } else {
    const prayer = mode === 'la' ? step.latin : step.english
    const h = document.createElement('h3')
    h.textContent = prayer.title
    const p = document.createElement('p')
    p.className = 'rosary-step__text'
    p.textContent = prayer.text
    article.append(h, p)
  }

  container.append(article)
}

document.querySelector('#app').innerHTML = `
  <main class="app">
    <img src="./icon.svg" width="84" height="84" alt="" />
    <h1>Holy Rosary</h1>
    <p class="lede">
      Choose a mystery set. Each prayer is paired with the crucifix, a gold bead,
      a purple bead, the chain between beads, or the image of Mary.
    </p>
    <section class="actions actions--rosary" id="rosary-actions" aria-label="Rosary by mystery set"></section>
  </main>

  <div id="rosary-sheet" class="rosary-sheet hidden" aria-hidden="true">
    <div class="rosary-sheet__backdrop" id="rosary-backdrop" tabindex="-1"></div>
    <div
      class="rosary-sheet__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rosary-dialog-title"
    >
      <header class="rosary-sheet__header">
        <h2 id="rosary-dialog-title" class="rosary-sheet__title">Rosary</h2>
        <button type="button" class="btn-icon" id="rosary-close" aria-label="Close rosary">
          ×
        </button>
      </header>
      <fieldset class="lang-fieldset">
        <legend class="lang-fieldset__legend">Language</legend>
        <div class="lang-segment" role="group" aria-label="Rosary text language">
          <label class="lang-segment__item">
            <input type="radio" name="rosary-lang" value="en" checked />
            <span>English</span>
          </label>
          <label class="lang-segment__item">
            <input type="radio" name="rosary-lang" value="la" />
            <span>Latin</span>
          </label>
          <label class="lang-segment__item">
            <input type="radio" name="rosary-lang" value="both" />
            <span>English &amp; Latin</span>
          </label>
        </div>
      </fieldset>
      <div class="rosary-pray">
        <div class="rosary-stage" id="rosary-stage"></div>
        <p class="rosary-place" id="rosary-place"></p>
        <div id="rosary-current" class="rosary-current" aria-live="polite"></div>
        <div class="rosary-nav">
          <button type="button" class="btn btn-secondary" id="rosary-prev">Previous</button>
          <p class="rosary-progress" id="rosary-progress"></p>
          <button type="button" class="btn btn-primary" id="rosary-next">Next</button>
        </div>
      </div>
    </div>
  </div>
`

const rosaryActions = document.getElementById('rosary-actions')
if (rosaryActions) {
  for (const rt of orderedRosaryTypes) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'btn btn-primary btn-rosary'
    btn.dataset.rosaryId = rt.id
    const label = mysteryGroups[rt.mysteryGroupId]?.title ?? rt.title
    btn.textContent = `Rosary — ${label}`
    rosaryActions.append(btn)
  }
}

const rosarySheet = document.getElementById('rosary-sheet')
const rosaryClose = document.getElementById('rosary-close')
const rosaryBackdrop = document.getElementById('rosary-backdrop')
const rosaryStage = document.getElementById('rosary-stage')
const rosaryCurrent = document.getElementById('rosary-current')
const rosaryPlace = document.getElementById('rosary-place')
const rosaryProgress = document.getElementById('rosary-progress')
const rosaryPrev = document.getElementById('rosary-prev')
const rosaryNext = document.getElementById('rosary-next')
const rosaryDialogTitle = document.getElementById('rosary-dialog-title')

/** @type {HTMLElement | null} */
let rosaryMap = null

/** @type {NodeListOf<HTMLInputElement>} */
const langRadios = document.querySelectorAll('input[name="rosary-lang"]')

function currentLangMode() {
  for (const r of langRadios) {
    if (r.checked) {
      const v = r.value
      if (v === 'en' || v === 'la' || v === 'both') return v
    }
  }
  return 'en'
}

function pastVisualIds() {
  /** @type {Set<string>} */
  const past = new Set()
  const active = activeRosarySteps[currentIndex]?.visualId
  for (let i = 0; i < currentIndex; i++) {
    const id = activeRosarySteps[i].visualId
    if (id !== active) past.add(id)
  }
  return past
}

function firstIndexForVisual(visualId) {
  return activeRosarySteps.findIndex((s) => s.visualId === visualId)
}

function renderStep() {
  const step = activeRosarySteps[currentIndex]
  if (!step || !rosaryCurrent) return
  renderCurrentPrayer(rosaryCurrent, currentLangMode(), step)
  if (rosaryPlace) rosaryPlace.textContent = visualPlaceLabel(step.visualId)
  if (rosaryProgress) {
    rosaryProgress.textContent = `${currentIndex + 1} / ${activeRosarySteps.length}`
  }
  if (rosaryPrev instanceof HTMLButtonElement) {
    rosaryPrev.disabled = currentIndex <= 0
  }
  if (rosaryNext instanceof HTMLButtonElement) {
    const last = currentIndex >= activeRosarySteps.length - 1
    rosaryNext.textContent = last ? 'Finish' : 'Next'
  }
  if (rosaryMap) {
    highlightRosaryVisual(rosaryMap, step.visualId, pastVisualIds())
  }
  saveStep()
}

function goTo(index) {
  if (!activeRosarySteps.length) return
  currentIndex = Math.max(0, Math.min(index, activeRosarySteps.length - 1))
  renderStep()
}

/**
 * @param {string} rosaryTypeId
 * @param {HTMLButtonElement | null} opener
 */
function openRosary(rosaryTypeId, opener) {
  const rt = rosaryTypes.find((r) => r.id === rosaryTypeId)
  if (!rt || !rosarySheet || !rosaryStage || !rosaryCurrent) return
  lastRosaryButton = opener
  activeRosaryId = rosaryTypeId
  activeRosarySteps = expandRosaryTypeLaidOut(rt)
  currentIndex = loadStep(rosaryTypeId, activeRosarySteps.length)
  if (rosaryDialogTitle) rosaryDialogTitle.textContent = rt.title
  rosaryStage.replaceChildren()
  rosaryMap = mountRosaryMap(rosaryStage)
  setVisible(rosarySheet, true)
  renderStep()
  rosaryClose?.focus()
}

function closeRosary() {
  if (rosarySheet) setVisible(rosarySheet, false)
  lastRosaryButton?.focus()
}

rosaryActions?.addEventListener('click', (e) => {
  const t = e.target
  if (!(t instanceof Element)) return
  const btn = t.closest('[data-rosary-id]')
  if (!(btn instanceof HTMLButtonElement)) return
  const id = btn.dataset.rosaryId
  if (id) openRosary(id, btn)
})

rosaryClose?.addEventListener('click', closeRosary)
rosaryBackdrop?.addEventListener('click', closeRosary)

rosaryPrev?.addEventListener('click', () => goTo(currentIndex - 1))
rosaryNext?.addEventListener('click', () => {
  if (currentIndex >= activeRosarySteps.length - 1) {
    closeRosary()
    return
  }
  goTo(currentIndex + 1)
})

rosaryStage?.addEventListener('click', (e) => {
  const t = e.target
  if (!(t instanceof Element)) return
  const part = t.closest('[data-visual]')
  if (!part) return
  const visualId = part.getAttribute('data-visual')
  if (!visualId) return
  const idx = firstIndexForVisual(visualId)
  if (idx >= 0) goTo(idx)
})

rosaryStage?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  const t = e.target
  if (!(t instanceof Element)) return
  const visualId = t.getAttribute('data-visual')
  if (!visualId) return
  e.preventDefault()
  const idx = firstIndexForVisual(visualId)
  if (idx >= 0) goTo(idx)
})

for (const r of langRadios) {
  r.addEventListener('change', () => {
    if (rosarySheet?.classList.contains('hidden')) return
    renderStep()
  })
}

document.addEventListener('keydown', (e) => {
  if (!rosarySheet || rosarySheet.classList.contains('hidden')) return
  if (e.key === 'Escape') {
    closeRosary()
    return
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (currentIndex < activeRosarySteps.length - 1) goTo(currentIndex + 1)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    goTo(currentIndex - 1)
  }
})
