import { useState, useEffect } from 'react'

export default function EditPlan({ onBack, userName, onNameChange }) {
  const [splits, setSplits] = useState([])
  const [dayMap, setDayMap] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('exercises')
  const [loading, setLoading] = useState(true)
  const [nameInput, setNameInput] = useState(userName)

  const load = async () => {
    const [s, d] = await Promise.all([
      fetch('/api/splits').then(r => r.json()),
      fetch('/api/schedule/daymap').then(r => r.json())
    ])
    setSplits(s)
    setDayMap(d)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteSplit = async (id) => {
    if (!window.confirm('Delete this split and all its exercises?')) return
    await fetch(`/api/splits/${id}`, { method: 'DELETE' })
    load()
  }

  const deleteExercise = async (id) => {
    await fetch(`/api/exercises/${id}`, { method: 'DELETE' })
    load()
  }

  const saveExercise = async (data) => {
    if (data.id) {
      await fetch(`/api/exercises/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } else {
      await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    }
    setModal(null)
    load()
  }

  const saveSplit = async (data) => {
    if (data.id) {
      await fetch(`/api/splits/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name })
      })
    } else {
      await fetch('/api/splits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name })
      })
    }
    setModal(null)
    load()
  }

  const updateDayMap = async (days_trained, split_id) => {
    await fetch('/api/schedule/daymap', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days_trained, split_id })
    })
    load()
  }

  const saveName = () => {
    if (nameInput.trim()) onNameChange(nameInput.trim())
  }

  if (loading) return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p className="muted">Loading…</p>
    </div>
  )

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="screen-title">Edit Plan</div>

      <div className="tabs">
        {['exercises', 'schedule', 'profile'].map(t => (
          <button
            key={t}
            className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'exercises' && (
        <>
          {splits.map(split => (
            <div key={split.id} className="split-card">
              <div className="split-card-hd" onClick={() => setExpanded(expanded === split.id ? null : split.id)}>
                <div className="split-card-nm">{split.name}</div>
                <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); setModal({ type: 'split', data: split }) }}>
                  Rename
                </button>
                <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); deleteSplit(split.id) }}>
                  Delete
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: 18, marginLeft: 4 }}>
                  {expanded === split.id ? '▲' : '▼'}
                </span>
              </div>

              {expanded === split.id && (
                <div className="split-card-bd">
                  {split.exercises?.length === 0 && (
                    <p className="muted" style={{ fontSize: 13, padding: '10px 0' }}>No exercises yet.</p>
                  )}
                  {split.exercises?.map(ex => (
                    <div key={ex.id} className="ex-row">
                      <div className="ex-row-name">
                        {ex.name}
                        {!!ex.is_compound && <span style={{ color: 'var(--rust)', fontSize: 11, marginLeft: 6 }}>compound</span>}
                      </div>
                      <span className="ex-row-wt">{ex.current_weight}{ex.unit} · {ex.sets_target || 3}×{ex.rep_target}</span>
                      <button className="btn btn-sm btn-secondary"
                        onClick={() => setModal({ type: 'exercise', data: ex, splitId: split.id })}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteExercise(ex.id)}>×</button>
                    </div>
                  ))}
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: 12 }}
                    onClick={() => setModal({ type: 'exercise', data: null, splitId: split.id })}
                  >
                    + Add Exercise
                  </button>
                </div>
              )}
            </div>
          ))}
          <button className="btn btn-secondary" onClick={() => setModal({ type: 'split', data: null })}>
            + New Split
          </button>
        </>
      )}

      {tab === 'schedule' && (
        <ScheduleTab dayMap={dayMap} splits={splits} onUpdate={updateDayMap} />
      )}

      {tab === 'profile' && (
        <div>
          <div className="field">
            <label className="field-label">Your name (shown on landing)</label>
            <input
              className="input"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => e.key === 'Enter' && saveName()}
            />
          </div>
          <p className="muted" style={{ fontSize: 13 }}>Changes save when you leave the field or press Enter.</p>
        </div>
      )}

      {modal?.type === 'exercise' && (
        <ExerciseModal
          data={modal.data}
          splitId={modal.splitId}
          onSave={saveExercise}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'split' && (
        <SplitModal data={modal.data} onSave={saveSplit} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

function ScheduleTab({ dayMap, splits, onUpdate }) {
  return (
    <div>
      <p className="muted" style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
        Map "days trained this week" → split. Day 4 currently maps to Upper (Lower is unreachable by default — change it here).
      </p>
      {[0, 1, 2, 3, 4, 5, 6].map(day => {
        const mapping = dayMap.find(d => d.days_trained === day)
        if (!mapping && day > dayMap.length) return null
        return (
          <div key={day} className="sched-row">
            <div className="sched-day">{day}</div>
            <select
              className="input"
              value={mapping?.split_id || ''}
              onChange={e => onUpdate(day, parseInt(e.target.value))}
            >
              <option value="">— rest / unmapped —</option>
              {splits.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )
      })}
    </div>
  )
}

function ExerciseModal({ data, splitId, onSave, onClose }) {
  const [form, setForm] = useState({
    name: data?.name || '',
    current_weight: data?.current_weight ?? 0,
    unit: data?.unit || 'kg',
    rep_target: data?.rep_target ?? 10,
    sets_target: data?.sets_target ?? 3,
    is_compound: !!data?.is_compound,
    split_id: splitId
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({
      ...form,
      current_weight: parseFloat(form.current_weight) || 0,
      rep_target: parseInt(form.rep_target) || 10,
      sets_target: parseInt(form.sets_target) || 3,
      ...(data?.id ? { id: data.id } : {})
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{data ? 'Edit Exercise' : 'Add Exercise'}</div>

        <div className="field">
          <label className="field-label">Name</label>
          <input className="input" value={form.name} autoFocus onChange={e => set('name', e.target.value)} placeholder="e.g. Bench Press" />
        </div>

        <div className="field-row">
          <div className="field" style={{ flex: 2 }}>
            <label className="field-label">Weight</label>
            <input className="input" type="number" step="0.5" inputMode="decimal" value={form.current_weight}
              onChange={e => set('current_weight', e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="field-label">Unit</label>
            <select className="input" value={form.unit} onChange={e => set('unit', e.target.value)}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field" style={{ flex: 1 }}>
            <label className="field-label">Rep Target</label>
            <input className="input" type="number" inputMode="numeric" value={form.rep_target}
              onChange={e => set('rep_target', e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="field-label">Sets Target</label>
            <input className="input" type="number" inputMode="numeric" value={form.sets_target}
              onChange={e => set('sets_target', e.target.value)} />
          </div>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">Compound lift (+5kg on level up, not +2.5)</span>
          <label className="toggle">
            <input type="checkbox" checked={form.is_compound} onChange={e => set('is_compound', e.target.checked)} />
            <span className="toggle-track" />
          </label>
        </div>

        <div className="modal-btns">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

function SplitModal({ data, onSave, onClose }) {
  const [name, setName] = useState(data?.name || '')
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{data ? 'Rename Split' : 'New Split'}</div>
        <div className="field">
          <label className="field-label">Split name</label>
          <input className="input" value={name} autoFocus onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave({ ...(data || {}), name })}
            placeholder="e.g. Push" />
        </div>
        <div className="modal-btns">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => name.trim() && onSave({ ...(data || {}), name })}>Save</button>
        </div>
      </div>
    </div>
  )
}
