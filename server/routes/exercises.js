import { Router } from 'express'
import { one, run } from '../db.js'

const router = Router()

router.post('/', async (req, res) => {
  const { split_id, name, current_weight = 0, unit = 'kg', rep_target = 10, is_compound = false } = req.body
  if (!split_id || !name?.trim()) return res.status(400).json({ error: 'split_id and name required' })
  const maxOrder = await one('SELECT MAX(sort_order) AS m FROM exercises WHERE split_id = $1', [split_id])
  const sort_order = (maxOrder?.m || 0) + 1
  const row = await one(
    'INSERT INTO exercises (split_id, name, current_weight, unit, rep_target, sort_order, is_compound) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [split_id, name.trim(), current_weight, unit, rep_target, sort_order, !!is_compound]
  )
  res.json({ id: row.id, split_id, name: name.trim(), current_weight, unit, rep_target, sort_order, is_compound: !!is_compound })
})

router.patch('/:id', async (req, res) => {
  const ex = await one('SELECT * FROM exercises WHERE id = $1', [req.params.id])
  if (!ex) return res.status(404).json({ error: 'Not found' })
  const { name, current_weight, unit, rep_target, is_compound } = req.body
  await run(
    'UPDATE exercises SET name=$1, current_weight=$2, unit=$3, rep_target=$4, is_compound=$5 WHERE id=$6',
    [
      name ?? ex.name,
      current_weight ?? ex.current_weight,
      unit ?? ex.unit,
      rep_target ?? ex.rep_target,
      is_compound !== undefined ? !!is_compound : ex.is_compound,
      req.params.id
    ]
  )
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM exercises WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

router.post('/:id/log', async (req, res) => {
  const { reps } = req.body
  if (!reps || reps < 1) return res.status(400).json({ error: 'reps required' })
  const ex = await one('SELECT * FROM exercises WHERE id = $1', [req.params.id])
  if (!ex) return res.status(404).json({ error: 'Not found' })
  await run('INSERT INTO logged_sets (exercise_id, weight, reps) VALUES ($1,$2,$3)', [ex.id, ex.current_weight, reps])
  res.json({ readyToLevelUp: reps > ex.rep_target, weight: ex.current_weight, reps })
})

router.post('/:id/level-up', async (req, res) => {
  const ex = await one('SELECT * FROM exercises WHERE id = $1', [req.params.id])
  if (!ex) return res.status(404).json({ error: 'Not found' })
  const increment = ex.is_compound ? 5 : 2.5
  const newWeight = ex.current_weight + increment
  await run('UPDATE exercises SET current_weight = $1 WHERE id = $2', [newWeight, ex.id])
  res.json({ new_weight: newWeight, increment })
})

export default router
