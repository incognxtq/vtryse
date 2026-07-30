import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

interface Goal {
  id: string;
  title: string;
  target_date: string;
}

interface GoalUpdate {
  id: string;
  goal_id: string;
  note: string;
  created_at: string;
}

function getDaysRemaining(targetDate: string) {
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function GoalPlannerSection() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [updates, setUpdates] = useState<GoalUpdate[]>([]);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [noteInputs, setNoteInputs] = useState<{ [goalId: string]: string }>(
    {},
  );
  const [errorMsg, setErrorMsg] = useState("");

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("target_date", { ascending: true });

    if (error) setErrorMsg(error.message);
    else setGoals(data || []);
  };

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from("goal_updates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setErrorMsg(error.message);
    else setUpdates(data || []);
  };

  useEffect(() => {
    fetchGoals();
    fetchUpdates();
  }, []);

  const handleAddGoal = async () => {
    if (!title || !targetDate) {
      setErrorMsg("Title and target date are required");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg("You must be logged in");
      return;
    }

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      title,
      target_date: targetDate,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setTitle("");
      setTargetDate("");
      setErrorMsg("");
      fetchGoals();
    }
  };

  const handleAddUpdate = async (goalId: string) => {
    const note = noteInputs[goalId];
    if (!note) return;

    const { error } = await supabase.from("goal_updates").insert({
      goal_id: goalId,
      note,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setNoteInputs({ ...noteInputs, [goalId]: "" });
      fetchUpdates();
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3" style={{ color: '#5a6141' }}>Goal Planner</h2>

      <div className="flex flex-col gap-2 mb-4">
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
        <button
          onClick={handleAddGoal}
          className="bg-trace-dim text-white px-4 py-2 rounded-lg hover:bg-trace-dim transition-colors text-sm"
        >
          Add Goal
        </button>
        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
      </div>

      <ul className="space-y-3">
        {goals.map((goal) => {
          const daysLeft = getDaysRemaining(goal.target_date);
          const goalUpdates = updates.filter((u) => u.goal_id === goal.id);

          return (
            <li
              key={goal.id}
              className="bg-void border border-border-subtle p-3 rounded-lg text-sm"
            >
              <p className="font-medium text-text-primary">{goal.title}</p>
              <p className="text-xs text-text-muted">
                Target: {goal.target_date} —{" "}
                {daysLeft >= 0 ? `${daysLeft} days left` : "Overdue"}
              </p>

              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Add progress note"
                  value={noteInputs[goal.id] || ""}
                  onChange={(e) =>
                    setNoteInputs({ ...noteInputs, [goal.id]: e.target.value })
                  }
                  className="bg-surface border border-border-subtle p-1 rounded w-full mb-1 text-text-primary placeholder:text-text-muted text-xs"
                />
                <button
                  onClick={() => handleAddUpdate(goal.id)}
                  className="bg-surface-hover text-text-primary px-3 py-1 rounded text-xs hover:bg-border-subtle transition-colors"
                >
                  Log Update
                </button>
              </div>

              {goalUpdates.length > 0 && (
                <ul className="mt-2 text-xs text-text-muted list-disc list-inside">
                  {goalUpdates.map((u) => (
                    <li key={u.id}>{u.note}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default GoalPlannerSection;
