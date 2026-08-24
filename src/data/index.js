/**
 * @typedef {{ title: string, text: string }} Prayer
 * @typedef {{ id: string, title: string, prayerIds: string[] }} Devotion
 * @typedef {{ id: string, title: string, announcementPrayerId: string, decadePrayerIds: string[] }} Mystery
 * @typedef {{ id: string, title: string, mysteries: Mystery[] }} MysteryGroup
 * @typedef {{ id: string, title: string, mysteryGroupId: string, openingPrayerIds: string[], closingPrayerIds: string[] }} RosaryType
 */

import prayers from './prayers.json'
import prayersLatin from './prayers-latin.json'
import audioByPrayerId from './audio.json'

const devotionModules = import.meta.glob('./devotions/*.json', { eager: true })
const mysteryGroupModules = import.meta.glob('./mystery-groups/*.json', {
  eager: true
})
const rosaryTypeModules = import.meta.glob('./rosary-types/*.json', {
  eager: true
})

/** @type {Devotion[]} */
export const devotions = Object.values(devotionModules).map((m) => m.default)

/** @type {Record<string, MysteryGroup>} */
export const mysteryGroups = Object.fromEntries(
  Object.values(mysteryGroupModules).map((m) => {
    const g = m.default
    return [g.id, g]
  })
)

/** @type {RosaryType[]} */
export const rosaryTypes = Object.values(rosaryTypeModules).map((m) => m.default)

export { prayers, prayersLatin, audioByPrayerId }

/**
 * @param {string} prayerId
 * @returns {Prayer | undefined}
 */
export function getPrayer(prayerId) {
  return prayers[prayerId]
}

/**
 * Audio URL/path for a prayer id, if configured (one asset reused everywhere that id appears).
 * @param {string} prayerId
 * @returns {string | undefined}
 */
export function getAudioUrl(prayerId) {
  const url = audioByPrayerId[prayerId]
  return typeof url === 'string' && url.length > 0 ? url : undefined
}

/**
 * Ordered list of full prayers for a devotion (resolves prayerIds).
 * @param {Devotion} devotion
 */
export function expandDevotion(devotion) {
  return devotion.prayerIds.map((id) => {
    const p = getPrayer(id)
    if (!p) throw new Error(`Unknown prayer id: ${id} (devotion ${devotion.id})`)
    return { id, ...p }
  })
}

/**
 * Flat sequence of prayer ids for a rosary type (opening, 5 decades from mystery group, closing).
 * @param {RosaryType} rt
 * @returns {string[]}
 */
export function rosaryTypeToPrayerIds(rt) {
  const group = mysteryGroups[rt.mysteryGroupId]
  if (!group)
    throw new Error(`Unknown mystery group: ${rt.mysteryGroupId} (${rt.id})`)

  const ids = [...rt.openingPrayerIds]
  for (const m of group.mysteries) {
    ids.push(m.announcementPrayerId)
    ids.push(...m.decadePrayerIds)
  }
  ids.push(...rt.closingPrayerIds)
  return ids
}

/**
 * @param {RosaryType} rt
 */
export function expandRosaryType(rt) {
  return rosaryTypeToPrayerIds(rt).map((id) => {
    const p = getPrayer(id)
    if (!p) throw new Error(`Unknown prayer id: ${id} (rosary ${rt.id})`)
    return { id, ...p }
  })
}

/**
 * Latin prayer text when present in prayers-latin.json; otherwise English (same id).
 * @param {string} prayerId
 * @returns {Prayer}
 */
export function getRosaryPrayerLatin(prayerId) {
  const en = getPrayer(prayerId)
  if (!en) throw new Error(`Unknown prayer id: ${prayerId}`)
  const la = prayersLatin[prayerId]
  return la ?? en
}

/**
 * @typedef {{ visualId: string, id: string, english: Prayer, latin: Prayer }} RosaryLaidOutStep
 */

/**
 * Each rosary step with English and Latin (Latin falls back to English if missing).
 * @param {RosaryType} rt
 * @returns {{ id: string, english: Prayer, latin: Prayer }[]}
 */
export function expandRosaryTypeBilingual(rt) {
  return rosaryTypeToPrayerIds(rt).map((id) => {
    const english = getPrayer(id)
    if (!english) throw new Error(`Unknown prayer id: ${id} (rosary ${rt.id})`)
    return { id, english, latin: getRosaryPrayerLatin(id) }
  })
}

/**
 * Same prayer order as expandRosaryTypeBilingual, with a visualId for the rosary image:
 * crucifix, gold/purple beads, chain gaps, and the image of Mary.
 * @param {RosaryType} rt
 * @returns {RosaryLaidOutStep[]}
 */
export function expandRosaryTypeLaidOut(rt) {
  const group = mysteryGroups[rt.mysteryGroupId]
  if (!group) {
    throw new Error(`Unknown mystery group: ${rt.mysteryGroupId} (${rt.id})`)
  }
  if (group.mysteries.length !== 5) {
    throw new Error(`Rosary ${rt.id} must have 5 mysteries`)
  }

  const opening = rt.openingPrayerIds
  if (opening.length !== 8) {
    throw new Error(
      `Rosary ${rt.id} opening must be 8 prayers (crucifix through Fatima)`
    )
  }

  /** @type {RosaryLaidOutStep[]} */
  const steps = []

  /**
   * @param {string} visualId
   * @param {string} prayerId
   */
  const push = (visualId, prayerId) => {
    const english = getPrayer(prayerId)
    if (!english) throw new Error(`Unknown prayer id: ${prayerId} (${rt.id})`)
    steps.push({
      visualId,
      id: prayerId,
      english,
      latin: getRosaryPrayerLatin(prayerId)
    })
  }

  push('crucifix', opening[0])
  push('crucifix', opening[1])
  push('gold-opening', opening[2])
  push('purple-opening-1', opening[3])
  push('purple-opening-2', opening[4])
  push('purple-opening-3', opening[5])
  push('gap-opening', opening[6])
  push('gap-opening', opening[7])

  group.mysteries.forEach((m, di) => {
    const d = di + 1
    const ids = m.decadePrayerIds
    if (ids.length !== 13) {
      throw new Error(`Mystery ${m.id} decade must have 13 prayers`)
    }
    push(`gold-mystery-${d}`, m.announcementPrayerId)
    push(`gap-of-${d}`, ids[0])
    for (let i = 0; i < 10; i++) {
      push(`purple-d${d}-${i + 1}`, ids[1 + i])
    }
    const chainVisual = d < 5 ? `gap-gb-${d}` : 'mary'
    push(chainVisual, ids[11])
    push(chainVisual, ids[12])
  })

  for (const id of rt.closingPrayerIds) {
    push('mary', id)
  }

  return steps
}

/**
 * Where on the rosary image the current step is prayed.
 * @param {string} visualId
 */
export function visualPlaceLabel(visualId) {
  if (visualId === 'crucifix') return 'Crucifix'
  if (visualId === 'gold-opening') return 'First gold bead'
  const openingPurple = /^purple-opening-(\d)$/.exec(visualId)
  if (openingPurple) {
    return `Purple bead (${openingPurple[1]} of 3)`
  }
  if (visualId === 'gap-opening') {
    return 'Between the third purple bead and the gold bead'
  }
  if (/^gold-mystery-\d$/.test(visualId)) return 'Gold bead'
  if (visualId === 'gap-of-1') {
    return 'Between the gold bead and the image of Mary'
  }
  if (/^gap-of-\d$/.test(visualId)) {
    return 'Between the gold bead and the purple beads'
  }
  const decadePurple = /^purple-d(\d)-(\d+)$/.exec(visualId)
  if (decadePurple) {
    return `Purple bead (${decadePurple[2]} of 10)`
  }
  if (/^gap-gb-\d$/.test(visualId)) {
    return 'Between the last purple bead and the gold bead'
  }
  if (visualId === 'mary') return 'Image of Mary'
  return ''
}
