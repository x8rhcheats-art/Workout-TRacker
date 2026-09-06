import { useState } from 'react'

export default function ExerciseCard({ exercise, onLog, onLevelUp, setsDone = 0 }) {
  const [reps, setReps] = useState('')
  const [pending, setPending] = useState(null) // last log result
  const [busy, setBusy] = useState(false)

  // Derive level-up state: use live API result if we just logged, otherwise fall back to last_set in DB
  const lastSet = exercise.last_set
  const isLvFromDB = lastSet && lastSet.reps > exercise.rep_target
  const showLv = pending !== null ? pending.readyToLevelUp : isLvFromDB

  const handleLog = async () => {
    const r = parseInt(reps)
    if (!r || r < 1) return
    setBusy(true)
    const result = await onLog(exercise.id, r)
    setPending(result)
    setReps('')
    setBusy(false)
  }

  const handleLevelUp = async () => {
    setBusy(true)
    await onLevelUp(exercise.id)
    setPending(null)
    setBusy(false)
  }

  const displayLastReps = pending ? pending.reps : lastSet?.reps
  const displayLastWt   = pending ? pending.weight : lastSet?.weight

  return (
    <div className={`ex-card${showLv ? ' lv' : ''}`}>
      <div className="ex-header">
        <div className="ex-name">{exercise.name}</div>
        {showLv && <span className="badge badge-gold">Level Up ↑</span>}
        {!!exercise.is_compound && <span className="badge badge-rust">+5</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className={`ex-weight${showLv ? ' lv' : ''}`}>{exercise.current_weight}</span>
        <span className="ex-unit">{exercise.unit}</span>
        <span className="ex-unit" style={{ marginLeft: 6 }}>× {exercise.rep_target}</span>
        {setsDone > 0 && (
          <span className="ex-unit" style={{ marginLeft: 'auto', fontSize: '1rem', color: 'var(--gold)' }}>
            {setsDone} set{setsDone !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {displayLastReps !== undefined && displayLastReps !== null && (
        <div className="ex-last">
          Last: <strong>{displayLastReps} reps</strong> @ {displayLastWt}{exercise.unit}
          <span style={{ marginLeft: 8, opacity: 0.6 }}>· target {exercise.rep_target}</span>
        </div>
      )}

      {showLv && (
        <button
          className="btn btn-gold"
          style={{ marginTop: 12 }}
          onClick={handleLevelUp}
          disabled={busy}
        >
          ↑ Level Up (+{exercise.is_compound ? 5 : 2.5}{exercise.unit})
        </button>
      )}

      <div className="rep-row">
        <input
          className="input rep-input"
          type="number"
          inputMode="numeric"
          placeholder={String(exercise.rep_target)}
          value={reps}
          onChange={e => setReps(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLog()}
        />
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={handleLog}
          disabled={!reps || busy}
        >
          Log Set
        </button>
      </div>
    </div>
  )
}
