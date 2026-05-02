import './style.css'
import { registerSW } from 'virtual:pwa-register'
import {
  devotions,
  expandDevotion,
  rosaryTypes,
  expandRosaryType,
  rosaryTypeToPrayerIds,
  getAudioUrl
} from './data/index.js'

registerSW({ immediate: true })

const angelus = devotions.find((d) => d.id === 'angelus')
const rosaryJoyful = rosaryTypes.find((r) => r.id === 'rosary-joyful')
const angelusSteps = angelus ? expandDevotion(angelus) : []
const rosarySteps = rosaryJoyful ? expandRosaryType(rosaryJoyful) : []
const rosaryIds = rosaryJoyful ? rosaryTypeToPrayerIds(rosaryJoyful) : []
const sampleAudio = rosaryIds.length ? getAudioUrl(rosaryIds[0]) : undefined

document.querySelector('#app').innerHTML = `
  <main class="app">
    <img src="/icon.svg" width="84" height="84" alt="Prayers app icon" />
    <h1>Prayers</h1>
    <p class="lede">
      Content follows a single source of truth: <strong>prayers</strong> by id,
      then <strong>devotions</strong> and <strong>mystery groups</strong> as ordered id lists,
      <strong>audio</strong> keyed by the same ids, and the PWA service worker for offline use.
    </p>
    <section class="panel">
      <h2>Data layout</h2>
      <ul class="file-list">
        <li><code>src/data/prayers.json</code> — atomic prayers (id → title + text)</li>
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
      <p><strong>Rosary (joyful)</strong> — ${rosarySteps.length} steps; audio for first id: <code>${sampleAudio ?? 'not set — add paths in audio.json'}</code></p>
    </section>
    <p class="hint">Add MP3s under <code>public/audio/</code> and map them in <code>audio.json</code>.</p>
  </main>
`
