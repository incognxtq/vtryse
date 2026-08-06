import type { RepeatConfig } from './RepeatPopover'

const WEEKDAYS = [
  { key: 'sun', label: 'S' }, { key: 'mon', label: 'M' }, { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' }, { key: 'thu', label: 'T' }, { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
]

interface Props {
  open: boolean
  config: RepeatConfig
  onChange: (config: RepeatConfig) => void
  onClose: () => void
}

function RepeatModal({ open, config, onChange, onClose }: Props) {
  if (!open) return null

  const toggleDay = (day: string) => {
    const days = config.days.includes(day)
      ? config.days.filter((d) => d !== day)
      : [...config.days, day]
    onChange({ ...config, days })
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border-subtle rounded-xl p-5 max-w-xs w-full"
      >
        <p className="text-sm font-medium text-text-primary mb-4">Repeat</p>

        <select
          value={config.type}
          onChange={(e) => onChange({ ...config, type: e.target.value as RepeatConfig['type'] })}
          className="w-full bg-void border border-border-subtle p-2 rounded text-text-primary text-xs mb-3"
        >
          <option value="none">Does not repeat</option>
          <option value="daily">Every day</option>
          <option value="weekly">Every week</option>
          <option value="monthly">Every month</option>
          <option value="yearly">Every year</option>
          <option value="custom">Custom...</option>
        </select>

        {config.type === 'custom' && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-text-muted">Every</span>
              <input
                type="number"
                min={1}
                value={config.interval}
                onChange={(e) => onChange({ ...config, interval: Number(e.target.value) })}
                className="w-14 bg-void border border-border-subtle rounded p-1.5 text-xs text-text-primary"
              />
              <select
                value={config.unit}
                onChange={(e) => onChange({ ...config, unit: e.target.value as RepeatConfig['unit'] })}
                className="flex-1 bg-void border border-border-subtle rounded p-1.5 text-xs text-text-primary"
              >
                <option value="day">Day(s)</option>
                <option value="week">Week(s)</option>
                <option value="month">Month(s)</option>
                <option value="year">Year(s)</option>
              </select>
            </div>

            {config.unit === 'week' && (
              <div className="mb-3">
                <p className="text-xs text-text-muted mb-1.5">Repeat on</p>
                <div className="flex gap-1">
                  {WEEKDAYS.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      className={`w-7 h-7 rounded-full text-[11px] font-medium transition-colors ${
                        config.days.includes(d.key)
                          ? 'bg-trace text-white'
                          : 'bg-void border border-border-subtle text-text-muted hover:bg-surface-hover'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {config.type !== 'none' && (
          <div className="border-t border-border-subtle pt-3 mb-4">
            <p className="text-xs text-text-muted mb-2">Ends</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs text-text-primary">
                <input
                  type="radio"
                  checked={config.ends === 'never'}
                  onChange={() => onChange({ ...config, ends: 'never' })}
                />
                Never
              </label>
              <label className="flex items-center gap-2 text-xs text-text-primary">
                <input
                  type="radio"
                  checked={config.ends === 'on'}
                  onChange={() => onChange({ ...config, ends: 'on' })}
                />
                On
                <input
                  type="date"
                  value={config.endDate}
                  onChange={(e) => onChange({ ...config, ends: 'on', endDate: e.target.value })}
                  disabled={config.ends !== 'on'}
                  className="bg-void border border-border-subtle rounded p-1 text-[11px] text-text-primary disabled:opacity-40"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-text-primary">
                <input
                  type="radio"
                  checked={config.ends === 'after'}
                  onChange={() => onChange({ ...config, ends: 'after' })}
                />
                After
                <input
                  type="number"
                  min={1}
                  value={config.occurrences}
                  onChange={(e) =>
                    onChange({ ...config, ends: 'after', occurrences: Number(e.target.value) })
                  }
                  disabled={config.ends !== 'after'}
                  className="w-14 bg-void border border-border-subtle rounded p-1 text-[11px] text-text-primary disabled:opacity-40"
                />
                occurrences
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs border border-border-subtle text-text-primary hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs bg-trace text-white hover:bg-trace-dim transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default RepeatModal