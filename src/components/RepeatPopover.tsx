export interface RepeatConfig {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval: number
  unit: 'day' | 'week' | 'month' | 'year'
  days: string[]
  ends: 'never' | 'on' | 'after'
  endDate: string
  occurrences: number
}

export function summarizeRepeat(config: RepeatConfig): string {
  if (config.type === 'none') return 'Does not repeat'
  if (config.type !== 'custom') {
    const map = { daily: 'Every day', weekly: 'Every week', monthly: 'Every month', yearly: 'Every year' }
    return map[config.type as 'daily' | 'weekly' | 'monthly' | 'yearly']
  }
  const unitLabel = config.interval === 1 ? config.unit : `${config.unit}s`
  let base = `Every ${config.interval} ${unitLabel}`
  if (config.unit === 'week' && config.days.length > 0) {
    base += ` on ${config.days.map((d) => d[0].toUpperCase() + d.slice(1)).join(', ')}`
  }
  return base
}

export function generateOccurrenceDates(startDate: string, config: RepeatConfig): string[] {
  if (config.type === 'none') return [startDate]

  const MAX_OCCURRENCES = 104
  const dates: string[] = []
  const start = new Date(startDate + 'T00:00:00')

  let unit: 'day' | 'week' | 'month' | 'year' = 'week'
  let interval = 1
  let days: string[] = []

  if (config.type === 'daily') unit = 'day'
  else if (config.type === 'weekly') unit = 'week'
  else if (config.type === 'monthly') unit = 'month'
  else if (config.type === 'yearly') unit = 'year'
  else {
    unit = config.unit
    interval = config.interval
    days = config.days
  }

  const dayIndexMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
  const endDate = config.ends === 'on' && config.endDate ? new Date(config.endDate + 'T23:59:59') : null
  const maxCount = config.ends === 'after' ? config.occurrences : MAX_OCCURRENCES

  if (unit === 'week' && days.length > 0) {
    let weekStart = new Date(start)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    while (dates.length < maxCount) {
      for (const d of days) {
        const candidate = new Date(weekStart)
        candidate.setDate(candidate.getDate() + dayIndexMap[d])
        if (candidate >= start) {
          if (endDate && candidate > endDate) break
          dates.push(candidate.toISOString().split('T')[0])
        }
        if (dates.length >= maxCount) break
      }
      weekStart.setDate(weekStart.getDate() + 7 * interval)
      if (endDate && weekStart > endDate) break
      if (dates.length >= maxCount) break
    }
  } else {
    let current = new Date(start)
    while (dates.length < maxCount) {
      if (endDate && current > endDate) break
      dates.push(current.toISOString().split('T')[0])
      if (unit === 'day') current.setDate(current.getDate() + interval)
      else if (unit === 'week') current.setDate(current.getDate() + 7 * interval)
      else if (unit === 'month') current.setMonth(current.getMonth() + interval)
      else if (unit === 'year') current.setFullYear(current.getFullYear() + interval)
    }
  }

  return dates.length > 0 ? dates : [startDate]
}