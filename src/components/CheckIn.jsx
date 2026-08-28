import { useState, useEffect } from 'react'

export default function CheckIn({ onCheckin, onBack }) {
  const [days, setDays] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/schedule/daymap')
      .then(r => r.json())
      .then(data => setDays(data.map(d => d.days_trained)))
      .catch(() => setDays([0, 1, 2, 3, 4]))
  }, [])

  const pick = async (day) => {
    setSelected(day)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/checkin?days=${day}`)
      if (!res.ok) throw new Error((await res.json()).error || 'No split found')
      onCheckin(await res.json())
    } catch (e) {
      setError(e.message)
      setSelected(null)
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="screen-title">Check In</div>
      <p className="hint-text">How many days have you trained this week?</p>
      <div className="day-grid">
        {days.map(d => (
          <button
            key={d}
            className={`day-btn${selected === d ? ' sel' : ''}`}
            onClick={() => !loading && pick(d)}
          >
            {d}
          </button>
        ))}
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted" style={{ fontSize: 14 }}>Loading…</p>}
    </div>
  )
}
