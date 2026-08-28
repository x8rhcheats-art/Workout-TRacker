import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import os from 'os'
import { initDB, all, run } from './db.js'
import splitsRouter from './routes/splits.js'
import exercisesRouter from './routes/exercises.js'
import checkinRouter from './routes/checkin.js'
import scheduleRouter from './routes/schedule.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(express.json())
app.use('/api/splits', splitsRouter)
app.use('/api/exercises', exercisesRouter)
app.use('/api/checkin', checkinRouter)
app.use('/api/schedule', scheduleRouter)

app.get('/api/config', async (req, res) => {
  const rows = await all('SELECT key, value FROM user_config')
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])))
})

app.patch('/api/config', async (req, res) => {
  const { key, value } = req.body
  await run(
    'INSERT INTO user_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
    [key, String(value)]
  )
  res.json({ ok: true })
})

const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

await initDB()

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  const iface = Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal)
  console.log(`\n  Server:  http://localhost:${PORT}`)
  if (iface) console.log(`  Phone:   http://${iface.address}:${PORT}  (same wifi)\n`)
})
