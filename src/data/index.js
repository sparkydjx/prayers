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
