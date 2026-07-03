const vnDate = (offsetDays = 0) => {
  const d = new Date(Date.now() + 7 * 3600 * 1000 + offsetDays * 86400000)
  return d.toISOString().slice(0, 10)
}

const fmtDateVN = (d) => {
  const s = String(d).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : s
}

const fmtTimeVN = (t) => {
  if (t instanceof Date) {
    return `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`
  }
  const m = String(t).match(/(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : '--:--'
}

const timeToMinutes = (t) => {
  if (t instanceof Date) return t.getUTCHours() * 60 + t.getUTCMinutes()
  const m = String(t).match(/(\d{2}):(\d{2})/)
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0
}

const minutesToTimeStr = (mins) => {
  const total = ((mins % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`
}

const addMinutesToTime = (t, addMin) => minutesToTimeStr(timeToMinutes(t) + parseInt(addMin))

const calcDelayedTime = (gioKhoiHanh, delayPhut) => {
  const orig = fmtTimeVN(gioKhoiHanh)
  const [h, m] = orig.split(':').map(Number)
  const total = (h * 60 + m + parseInt(delayPhut) + 1440) % 1440
  const adjusted = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  return { orig, adjusted }
}

module.exports = { vnDate, fmtDateVN, fmtTimeVN, timeToMinutes, minutesToTimeStr, addMinutesToTime, calcDelayedTime }
