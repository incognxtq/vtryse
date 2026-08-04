export const ALL_TIMEZONES: string[] =
  typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf
    ? (Intl as any).supportedValuesOf('timeZone')
    : [
        'UTC', 'Asia/Manila', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
        'Asia/Shanghai', 'Asia/Dubai', 'Europe/London', 'Europe/Paris',
        'Europe/Berlin', 'America/New_York', 'America/Chicago',
        'America/Denver', 'America/Los_Angeles', 'Australia/Sydney',
        'Pacific/Auckland',
      ]

export function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute))

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const parts = fmt.formatToParts(utcGuess)
  const map: Record<string, string> = {}
  parts.forEach((p) => (map[p.type] = p.value))

  const asIfUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) === 24 ? 0 : Number(map.hour),
    Number(map.minute)
  )

  const diff = asIfUtc - utcGuess.getTime()
  return new Date(utcGuess.getTime() - diff)
}

export function formatInTimezone(utcDate: Date, timeZone: string) {
  const dateFmt = new Intl.DateTimeFormat('en-US', {
    timeZone, month: 'short', day: 'numeric', year: 'numeric',
  }).format(utcDate)

  const timeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone, hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(utcDate)

  return { date: dateFmt, time: timeFmt }
}

export function convertEventTimeForViewer(
  eventDate: string,
  eventTime: string | null,
  eventTimezone: string,
  viewerTimezone: string
) {
  if (!eventTime) return null
  const utc = zonedTimeToUtc(eventDate, eventTime, eventTimezone || 'UTC')
  return formatInTimezone(utc, viewerTimezone || 'UTC')
}

export function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}