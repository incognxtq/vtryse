import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function AnalyticsSection() {
  const [ongoing, setOngoing] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [cancelled, setCancelled] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [goalCount, setGoalCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchStats = async () => {
    const { data: events, error: eventsError } = await supabase
      .from("calendar_events")
      .select("status, event_date");

    if (eventsError) {
      setErrorMsg(eventsError.message);
      return;
    }

    if (events) {
      setOngoing(events.filter((e) => e.status === "ongoing").length);
      setCompleted(events.filter((e) => e.status === "completed").length);
      setCancelled(events.filter((e) => e.status === "cancelled").length);

      const today = new Date().toISOString().split("T")[0];
      setTodayCount(events.filter((e) => e.event_date === today).length);
    }

    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select("id");

    if (goalsError) {
      setErrorMsg(goalsError.message);
      return;
    }

    setGoalCount(goals?.length || 0);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-text-primary">
        Analytics
      </h2>

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      <div className="space-y-3 text-sm">
        <div className="bg-void border border-border-subtle p-3 rounded-lg">
          <p className="text-text-muted text-xs mb-1">Progress</p>
          <p className="text-text-primary">
            <span className="text-trace font-medium">{ongoing}</span> ongoing,{" "}
            <span className="text-green-400 font-medium">{completed}</span>{" "}
            completed,{" "}
            <span className="text-red-400 font-medium">{cancelled}</span>{" "}
            cancelled
          </p>
        </div>

        <div className="bg-void border border-border-subtle p-3 rounded-lg">
          <p className="text-text-muted text-xs mb-1">Today's activity</p>
          <p className="text-text-primary">{todayCount} item(s)</p>
        </div>

        <div className="bg-void border border-border-subtle p-3 rounded-lg">
          <p className="text-text-muted text-xs mb-1">Active goals</p>
          <p className="text-text-primary">{goalCount}</p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsSection;
