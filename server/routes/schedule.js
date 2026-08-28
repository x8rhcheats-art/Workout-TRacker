import { Router } from 'express'
import { all, run } from '../db.js'

const router = Router()
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

router.get('/', async (req, res) => {
  const rows = await all(`
    SELECT w.weekday, w.split_id, s.name AS split_name
    FROM weekday_schedule w LEFT JOIN splits s ON s.id = w.split_id
  `)
  res.json(WEEKDAYS.map(day => rows.find(r => r.weekday === day) || { weekday: day, split_id: null, split_name: null }))
})

router.patch('/', async (req, res) => {
  const { weekday, split_id } = req.body
  await run(
    'INSERT INTO weekday_schedule (weekday, split_id) VALUES ($1,$2) ON CONFLICT (weekday) DO UPDATE SET split_id = EXCLUDED.split_id',
    [weekday, split_id || null]
  )
  res.json({ ok: true })
})

router.get('/daymap', async (req, res) => {
  res.json(await all(`
    SELECT d.days_trained, d.split_id, s.name AS split_name
    FROM day_split_map d JOIN splits s ON s.id = d.split_id ORDER BY d.days_trained
  `))
})

router.patch('/daymap', async (req, res) => {
  const { days_trained, split_id } = req.body
  if (days_trained === undefined || !split_id) return res.status(400).json({ error: 'days_trained and split_id required' })
  await run(
    'INSERT INTO day_split_map (days_trained, split_id) VALUES ($1,$2) ON CONFLICT (days_trained) DO UPDATE SET split_id = EXCLUDED.split_id',
    [days_trained, split_id]
  )
  res.json({ ok: true })
})

export default router
