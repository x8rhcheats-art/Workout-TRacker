import { useState } from 'react'
import ExerciseCard from './ExerciseCard.jsx'

export default function WorkoutSession({ split, onEnd }) {
  const [exercises, setExercises] = useState(split.exercises || [])

  const handleLog = async (exerciseId, reps) => {
    const res = await fetch(`/api/exercises/${exerciseId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reps })
    })
    const data = await res.json()
    // Update last_set in local state so the card shows the latest rep count
    setExercises(prev => prev.map(e =>
      e.id !== exerciseId ? e : {
        ...e,
        last_set: { reps, weight: e.current_weight, logged_at: new Date().toISOString() }
      }
    ))
    return data
  }

  const handleLevelUp = async (exerciseId) => {
    const res = await fetch(`/api/exercises/${exerciseId}/level-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    setExercises(prev => prev.map(e =>
      e.id !== exerciseId ? e : {
        ...e,
        current_weight: data.new_weight,
        // Reset last_set reps to target so the card stops showing level-up state
        last_set: e.last_set ? { ...e.last_set, reps: e.rep_target } : null
      }
    ))
  }

  return (
    <div className="screen">
      <button className="back-btn" onClick={onEnd}>← End Session</button>
      <div className="split-header">
        <div className="split-name">{split.split_name}</div>
        <div className="split-meta">{exercises.length} exercises</div>
      </div>
      {exercises.map(ex => (
        <ExerciseCard
          key={ex.id}
          exercise={ex}
          onLog={handleLog}
          onLevelUp={handleLevelUp}
        />
      ))}
    </div>
  )
}
