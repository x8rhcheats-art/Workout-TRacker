import { useState, useEffect } from 'react'
import Landing from './components/Landing.jsx'
import CheckIn from './components/CheckIn.jsx'
import WorkoutSession from './components/WorkoutSession.jsx'
import EditPlan from './components/EditPlan.jsx'

export default function App() {
  const [view, setView] = useState('landing')
  const [activeSplit, setActiveSplit] = useState(null)
  const [userName, setUserName] = useState('John')

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => { if (cfg.name) setUserName(cfg.name) })
      .catch(() => {})
  }, [])

  if (view === 'landing') return (
    <Landing
      name={userName}
      onStart={() => setView('checkin')}
      onEdit={() => setView('edit')}
    />
  )

  if (view === 'checkin') return (
    <CheckIn
      onCheckin={split => { setActiveSplit(split); setView('session') }}
      onBack={() => setView('landing')}
    />
  )

  if (view === 'session') return (
    <WorkoutSession
      split={activeSplit}
      onEnd={() => { setActiveSplit(null); setView('landing') }}
    />
  )

  if (view === 'edit') return (
    <EditPlan
      onBack={() => setView('landing')}
      userName={userName}
      onNameChange={name => {
        setUserName(name)
        fetch('/api/config', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'name', value: name })
        })
      }}
    />
  )

  return null
}
