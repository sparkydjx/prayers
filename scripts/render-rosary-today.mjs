/**
 * Prints a full rosary text for today's weekday (mystery set per USCCB-style schedule).
 * Run from repo root: node scripts/render-rosary-today.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const read = (rel) =>
  JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))

const prayers = read('src/data/prayers.json')
const rosary = read('src/data/rosary-types/rosary-joyful.json')
const joyfulGroup = read('src/data/mystery-groups/joyful.json')

const DECADE_TEMPLATE = [
  'our-father',
  ...Array(10).fill('hail-mary'),
  'glory-be',
  'fatima-decade-prayer',
]

const SCHEDULE = [
  { days: [0], name: 'Glorious Mysteries', key: 'glorious' },
  { days: [1, 6], name: 'Joyful Mysteries', key: 'joyful' },
  { days: [2, 5], name: 'Sorrowful Mysteries', key: 'sorrowful' },
  { days: [3], name: 'Glorious Mysteries', key: 'glorious' },
  { days: [4], name: 'Luminous Mysteries', key: 'luminous' },
]

const BUILTIN = {
  luminous: [
    {
      title: 'First Luminous Mystery — The Baptism of the Lord',
      text: 'Christ is baptized by John in the Jordan; the Father proclaims Him beloved Son.',
    },
    {
      title: 'Second Luminous Mystery — The Wedding at Cana',
      text: 'Jesus performs His first sign at Mary’s request, manifesting His glory.',
    },
    {
      title: 'Third Luminous Mystery — The Proclamation of the Kingdom',
      text: 'Jesus calls to conversion and announces the good news of the Kingdom.',
    },
    {
      title: 'Fourth Luminous Mystery — The Transfiguration',
      text: 'Jesus is revealed in glory to Peter, James, and John on the holy mountain.',
    },
    {
      title: 'Fifth Luminous Mystery — The Institution of the Eucharist',
      text: 'Jesus offers His Body and Blood at the Last Supper as the memorial of His sacrifice.',
    },
  ],
  sorrowful: [
    {
      title: 'First Sorrowful Mystery — The Agony in the Garden',
      text: 'Jesus prays in Gethsemane, accepting the Father’s will in His suffering.',
    },
    {
      title: 'Second Sorrowful Mystery — The Scourging at the Pillar',
      text: 'Jesus is cruelly whipped at the order of Pilate.',
    },
    {
      title: 'Third Sorrowful Mystery — The Crowning with Thorns',
      text: 'Jesus is mocked as King with a crown of thorns.',
    },
    {
      title: 'Fourth Sorrowful Mystery — The Carrying of the Cross',
      text: 'Jesus carries the Cross to Calvary for our salvation.',
    },
    {
      title: 'Fifth Sorrowful Mystery — The Crucifixion',
      text: 'Jesus dies on the Cross, offering His life for the world.',
    },
  ],
  glorious: [
    {
      title: 'First Glorious Mystery — The Resurrection',
      text: 'Christ rises triumphant from the dead on the third day.',
    },
    {
      title: 'Second Glorious Mystery — The Ascension',
      text: 'Jesus ascends into heaven and is seated at the right hand of the Father.',
    },
    {
      title: 'Third Glorious Mystery — The Descent of the Holy Spirit',
      text: 'The Holy Spirit comes upon Mary and the Apostles at Pentecost.',
    },
    {
      title: 'Fourth Glorious Mystery — The Assumption',
      text: 'The Blessed Virgin Mary is taken body and soul into heavenly glory.',
    },
    {
      title: 'Fifth Glorious Mystery — The Coronation of Mary',
      text: 'Mary is crowned Queen of heaven and earth as Mother of the King of kings.',
    },
  ],
}

function todaySchedule() {
  const d = new Date()
  const dow = d.getDay()
  const row = SCHEDULE.find((s) => s.days.includes(dow))
  return { date: d, dow, ...row }
}

function resolveMysteries(key) {
  if (key === 'joyful') {
    return joyfulGroup.mysteries.map((m) => {
      const p = prayers[m.announcementPrayerId]
      return { title: p.title, text: p.text, decadePrayerIds: m.decadePrayerIds }
    })
  }
  const list = BUILTIN[key]
  return list.map((m, i) => ({
    title: m.title,
    text: m.text,
    decadePrayerIds: DECADE_TEMPLATE,
  }))
}

function printPrayer(id, note) {
  const p = prayers[id]
  if (!p) throw new Error(`Missing prayer: ${id}`)
  console.log(`\n── ${p.title}${note ? ` ${note}` : ''} ──`)
  console.log(p.text)
}

function main() {
  const { date, name, key } = todaySchedule()
  console.log('='.repeat(72))
  console.log(
    `Holy Rosary — ${name}\n${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
  )
  console.log('='.repeat(72))

  const mysteries = resolveMysteries(key)
  console.log('\n## All decade titles (verify schedule → mysteries)')
  mysteries.forEach((m, idx) => {
    console.log(`  Decade ${idx + 1} of 5 — ${m.title}`)
  })
  console.log('')

  console.log('\n## Opening')
  for (const id of rosary.openingPrayerIds) printPrayer(id)

  console.log('\n## After the Creed (traditional)')
  printPrayer('our-father')
  printPrayer('hail-mary', '(repeat this same prayer 3×)')
  printPrayer('glory-be')

  mysteries.forEach((m, idx) => {
    console.log(`\n## Decade ${idx + 1} of 5 — ${m.title}`)
    console.log(`\n(Meditation: ${m.text})\n`)
    const ids = m.decadePrayerIds
    printPrayer(ids[0])
    printPrayer('hail-mary', '(repeat this same prayer 10×)')
    for (const id of ids.slice(11)) printPrayer(id)
  })

  console.log('\n## Closing')
  for (const id of rosary.closingPrayerIds) printPrayer(id)

  console.log('\n' + '='.repeat(72))
  console.log('End of rosary')
  console.log('='.repeat(72))
}

main()
