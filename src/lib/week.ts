export function toIsoDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfWeekMonday(value = new Date()) {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const weekday = date.getDay()
  const offset = weekday === 0 ? -6 : 1 - weekday
  date.setDate(date.getDate() + offset)
  return date
}

export function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

export function weekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
}

export function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  const startLabel = weekStart.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const endLabel = weekEnd.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${startLabel} – ${endLabel}`
}

export function formatDayHeading(value: Date) {
  return {
    weekday: value.toLocaleDateString('en-GB', { weekday: 'short' }),
    date: value.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    iso: toIsoDate(value),
    isToday: toIsoDate(value) === toIsoDate(new Date()),
  }
}

export function formatShiftTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(':00', '')
}

export function shiftHours(startsAt: string, endsAt: string, breakMinutes: number) {
  const minutes =
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000 - breakMinutes
  return Math.max(minutes / 60, 0)
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'shift'
}
