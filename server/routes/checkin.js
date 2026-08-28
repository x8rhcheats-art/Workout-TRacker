import { Router } from 'express'
import { all, one } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const days = parseInt(req.query.days)
  if (isNaN(days)) return res.status(400).json({ error: 'days param required' })

  const mapping = await one(`
    SELECT d.days_trained, d.split_id, s.name AS split_name
    FROM day_split_map d JOIN splits s ON s.id = d.split_id
    WHERE d.days_trained = $1
  `, [days])

  if (!mapping) return res.status(404).json({ error: `No split mapped for ${days} days trained` })

  const exercises = await all('SELECT * FROM exercises WHERE split_id = $1 ORDER BY sort_order', [mapping.split_id])
  const withHistory = await Promise.all(exercises.map(async e => ({
    ...e,
    last_set: await one('SELECT * FROM logged_sets WHERE exercise_id = $1 ORDER BY logged_at DESC LIMIT 1', [e.id])
  })))

  res.json({
    days_trained: days,
    split_id: mapping.split_id,
    split_name: mapping.split_name,
    exercises: withHistory
  })
})

export default router
