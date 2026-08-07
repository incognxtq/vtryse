import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ConfirmDialog from './ConfirmDialog'

interface Goal {
  id: string
  user_id: string
  title: string
  target_date: string
}

interface GoalUpdate {
  id: string
  goal_id: string
  note: string
  created_at: string
}

function getDaysRemaining(targetDate: string) {
  const today = new Date()
  const target = new Date(targetDate)
  const diffTime = target.getTime() - today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function GoalPlannerSection() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [updates, setUpdates] = useState<GoalUpdate[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [noteInputs, setNoteInputs] = useState<{ [goalId: string]: string }>({})
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const notifyDataChanged = () => {
    window.dispatchEvent(new Event('calendar-data-changed'))
  }

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('target_date', { ascending: true })

    if (error) setErrorMsg(error.message)
    else setGoals(data || [])
  }

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from('goal_updates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setErrorMsg(error.message)
    else setUpdates(data || [])
  }

  const fetchProfileNames = async () => {
    const { data } = await supabase.from('profiles').select('id, name')
    if (data) {
      const map: Record<string, string> = {}
      data.forEach((p) => {
        map[p.id] = p.name || 'Someone'
      })
      setProfileNames(map)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      fetchGoals()
      fetchUpdates()
      fetchProfileNames()
    }
    init()
  }, [])

  const resetForm = () => {
    setTitle('')
    setTargetDate('')
    setEditingId(null)
    setErrorMsg('')
  }

  const startEditing = (goal: Goal) => {
    setEditingId(goal.id)
    setTitle(goal.title)
    setTargetDate(goal.target_date)
  }

  const handleAddGoal = async () => {
    if (!title || !targetDate) {
      setErrorMsg('Title and target date are required')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('You must be logged in')
      return
    }

    if (editingId) {
      const { error } = await supabase
        .from('goals')
        .update({ title, target_date: targetDate })
        .eq('id', editingId)

      if (error) {
        setErrorMsg(error.message)
      } else {
        resetForm()
        fetchGoals()
        notifyDataChanged()
      }
    } else {
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        title,
        target_date: targetDate,
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        resetForm()
        fetchGoals()
        notifyDataChanged()
      }
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (error) {
      setErrorMsg(error.message)
    } else {
      fetchGoals()
      notifyDataChanged()
    }
    setConfirmDeleteId(null)
  }

  const handleAddUpdate = async (goalId: string) => {
    const note = noteInputs[goalId]
    if (!note) return

    const { error } = await supabase.from('goal_updates').insert({
      goal_id: goalId,
      note,
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setNoteInputs({ ...noteInputs, [goalId]: '' })
      fetchUpdates()
      notifyDataChanged()
    }
  }

  return (
    <div>
      <h2 className="text-trace text-xl font-bold mb-3 text-header">GOAL PLANNER</h2>

      <div className="flex flex-col gap-2 mb-4">
        {editingId && (
          <p className="text-[11px]">Editing - Save to update, or Cancel below</p>
        )}
        <input
          type="text"
          placeholder="Goal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-void border border-border-subtle p-2 rounded text-text-primary placeholder:text-text-muted text-sm"
        />
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="bg-void border border-border-subtle p-2 rounded text-text-primary text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={handleAddGoal}
            className="bg-trace px-4 py-2 rounded-lg hover:bg-surface transition-colors text-sm flex-1"
          >
            {editingId ? 'Save Changes' : 'Add Goal'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="bg-surface text-text-muted px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          )}
        </div>
        {errorMsg && <p className="text-[#E02626] text-sm">{errorMsg}</p>}
      </div>

      <ul className="space-y-3">
        {goals.map((goal) => {
          const daysLeft = getDaysRemaining(goal.target_date)
          const goalUpdates = updates.filter((u) => u.goal_id === goal.id)
          const isOwner = goal.user_id === currentUserId

          return (
            <li key={goal.id} className="bg-void border border-border-subtle p-4 rounded-lg text-lg">
              <div className="flex justify-between items-start gap-2">
                <p className="font-bold text-[#C49D8B]">{goal.title}</p>
                {isOwner && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEditing(goal)}
                      className="hover:text-text-muted text-[12px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(goal.id)}
                      className="hover:text-[#e0262665] text-[#E02626] text-[12px]"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[13px] text-text-primary">
                Target: {goal.target_date} —{' '}
                {daysLeft >= 0 ? `${daysLeft} days left` : 'Overdue'}
              </p>
              <p className="text-[12px] text-text-muted">
                Added by {profileNames[goal.user_id] || 'Someone'}
              </p>

              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Add progress note"
                  value={noteInputs[goal.id] || ''}
                  onChange={(e) =>
                    setNoteInputs({ ...noteInputs, [goal.id]: e.target.value })
                  }
                  className="border border-border-subtle p-1 rounded w-full mb-1 text-text-primary placeholder:text-text-muted text-xs"
                />
                <button
                  onClick={() => handleAddUpdate(goal.id)}
                  className="bg-surface px-3 py-1 rounded text-xs hover:bg-void transition-colors"
                >
                  Log Update
                </button>
              </div>

              {goalUpdates.length > 0 && (
                <ul className="mt-2 text-[14px] text-text-primary list-disc list-inside">
                  {goalUpdates.map((u) => (
                    <li key={u.id}>{u.note}</li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this goal?"
        message="This will also remove all its progress notes. This action cannot be undone."
        onConfirm={() => confirmDeleteId && handleDeleteGoal(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}

export default GoalPlannerSection