/**
 * Live quiz schedule from DB: `start_date` (calendar day) + `start_time` (HTML time, local intent).
 * Never parse the time with `Z` (UTC) — that shifts the clock by the user's timezone offset.
 */
function parseClockParts(timeValue) {
    if (timeValue == null || timeValue === "") return { h: 0, m: 0, s: 0 }
    const raw = String(timeValue).trim()
    const isoTail = raw.includes("T") ? raw.split("T")[1] : raw
    const noZone = isoTail.split(/[Z+-]/)[0]?.split(".")[0] ?? raw
    const mch = noZone.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (!mch) return { h: 0, m: 0, s: 0 }
    return { h: Number(mch[1]) || 0, m: Number(mch[2]) || 0, s: Number(mch[3]) || 0 }
}

export function parseQuizLocalStart(startDate, startTime) {
    if (!startDate) return null
    const dateOnly = String(startDate).split("T")[0]
    const ymd = dateOnly.split("-").map(Number)
    if (ymd.length < 3 || ymd.some((n) => Number.isNaN(n))) return null
    const [y, mo, d] = ymd
    const { h, m, s } = parseClockParts(startTime)
    return new Date(y, mo - 1, d, h, m, s)
}

export function formatQuizLiveStart(startDate, startTime) {
    const dt = parseQuizLocalStart(startDate, startTime)
    if (!dt || Number.isNaN(dt.getTime())) return "Not scheduled"
    return dt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

/** End of scheduled live window (start + duration), or null if not applicable. */
export function getLiveWindowEndMs(form) {
    if (!form || form.quiz_type !== "live") return null
    const start = parseQuizLocalStart(form.start_date, form.start_time)
    if (!start || Number.isNaN(start.getTime())) return null
    return start.getTime() + (Number(form.duration_minutes) || 0) * 60000
}
