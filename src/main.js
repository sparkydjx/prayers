import './style.css'
import { registerSW } from 'virtual:pwa-register'
import {
  devotions,
  expandDevotion,
  rosaryTypes,
  expandRosaryType,
  rosaryTypeToPrayerIds,
  getAudioUrl,
  expandRosaryTypeBilingual,
  mysteryGroups
} from './data/index.js'

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

const angelus = devotions.find((d) => d.id === 'angelus')
const angelusSteps = angelus ? expandDevotion(angelus) : []

const firstRosary = orderedRosaryTypes[0]
const rosaryIds = firstRosary ? rosaryTypeToPrayerIds(firstRosary) : []
const sampleAudio = rosaryIds.length ? getAudioUrl(rosaryIds[0]) : undefined

const rosarySmokeHtml = orderedRosaryTypes
  .map((rt) => {
    const n = expandRosaryType(rt).length
    const label = mysteryGroups[rt.mysteryGroupId]?.title ?? rt.title
    return `<p><strong>${label}</strong> — ${n} steps.</p>`
  })
  .join('')

/** @type {{ id: string, english: { title: string, text: string }, latin: { title: string, text: string } }[]} */
let activeRosarySteps = []

/** @type {HTMLButtonElement | null} */
let lastRosaryButton = null

/** @param {HTMLElement} el */
function setVisible(el, visible) {
  el.classList.toggle('hidden', !visible)
  el.setAttribute('aria-hidden', visible ? 'false' : 'true')
}

/**
 * @param {HTMLElement} container
 * @param {'en' | 'la' | 'both'} mode
 * @param {typeof activeRosarySteps} steps
 */
function renderRosarySteps(container, mode, steps) {
  container.replaceChildren()
  for (const step of steps) {
    const article = document.createElement('article')
    article.className = 'rosary-step'

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
}

document.querySelector('#app').innerHTML = `
  <main class="app">
    <img src="./icon.svg" width="84" height="84" alt="Prayers app icon" />
    <h1>Prayers</h1>
    <p class="lede">
      Content follows a single source of truth: <strong>prayers</strong> by id,
      then <strong>devotions</strong> and <strong>mystery groups</strong> as ordered id lists,
      <strong>audio</strong> keyed by the same ids, and the PWA service worker for offline use.
    </p>
    <section class="actions actions--rosary" id="rosary-actions" aria-label="Rosary by mystery set"></section>
    <section class="panel">
      <h2>Data layout</h2>
      <ul class="file-list">
        <li><code>src/data/prayers.json</code> — atomic prayers (id → title + text)</li>
        <li><code>src/data/prayers-latin.json</code> — Latin text for the same ids</li>
        <li><code>src/data/devotions/*.json</code> — <code>prayerIds[]</code></li>
        <li><code>src/data/mystery-groups/*.json</code> — reusable decades for rosaries</li>
        <li><code>src/data/rosary-types/*.json</code> — opening / <code>mysteryGroupId</code> / closing</li>
        <li><code>src/data/audio.json</code> — prayer id → URL (e.g. <code>/audio/…</code>)</li>
        <li><code>src/data/index.js</code> — load, resolve, expand</li>
      </ul>
    </section>
    <section class="panel">
      <h2>Smoke check</h2>
      <p><strong>Angelus</strong> — ${angelusSteps.length} steps (each step is one prayer id resolved from <code>prayers.json</code>).</p>
      ${rosarySmokeHtml || '<p>No rosary types loaded.</p>'}
      <p>Audio for first prayer id of the first rosary: <code>${sampleAudio ?? 'not set — add paths in audio.json'}</code></p>
    </section>
    <p class="hint">Add MP3s under <code>public/audio/</code> and map them in <code>audio.json</code>.</p>
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
      <div id="rosary-steps" class="rosary-steps"></div>
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
const rosaryStepsEl = document.getElementById('rosary-steps')
const rosaryDialogTitle = document.getElementById('rosary-dialog-title')

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

/**
 * @param {string} rosaryTypeId
 * @param {HTMLButtonElement | null} opener
 */
function openRosary(rosaryTypeId, opener) {
  const rt = rosaryTypes.find((r) => r.id === rosaryTypeId)
  if (!rt || !rosarySheet || !rosaryStepsEl) return
  lastRosaryButton = opener
  activeRosarySteps = expandRosaryTypeBilingual(rt)
  if (rosaryDialogTitle) rosaryDialogTitle.textContent = rt.title
  setVisible(rosarySheet, true)
  renderRosarySteps(rosaryStepsEl, currentLangMode(), activeRosarySteps)
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

for (const r of langRadios) {
  r.addEventListener('change', () => {
    if (rosarySheet?.classList.contains('hidden')) return
    renderRosarySteps(rosaryStepsEl, currentLangMode(), activeRosarySteps)
  })
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && rosarySheet && !rosarySheet.classList.contains('hidden')) {
    closeRosary()
  }
})
