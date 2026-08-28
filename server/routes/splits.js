import { Router } from 'express'
import { all, one, run } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const splits = await all('SELECT * FROM splits ORDER BY id')
  const exercises = await all('SELECT * FROM exercises ORDER BY split_id, sort_order')
  res.json(splits.map(s => ({ ...s, exercises: exercises.filter(e => e.split_id === s.id) })))
})

router.get('/:id', async (req, res) => {
  const split = await one('SELECT * FROM splits WHERE id = $1', [req.params.id])
  if (!split) return res.status(404).json({ error: 'Not found' })
  const exercises = await all('SELECT * FROM exercises WHERE split_id = $1 ORDER BY sort_order', [req.params.id])
  const withHistory = await Promise.all(exercises.map(async e => ({
    ...e,
    last_set: await one('SELECT * FROM logged_sets WHERE exercise_id = $1 ORDER BY logged_at DESC LIMIT 1', [e.id])
  })))
  res.json({ ...split, exercises: withHistory })
})

router.post('/', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const row = await one('INSERT INTO splits (name) VALUES ($1) RETURNING id', [name.trim()])
  res.json({ id: row.id, name: name.trim() })
})

router.patch('/:id', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  await run('UPDATE splits SET name = $1 WHERE id = $2', [name.trim(), req.params.id])
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM splits WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

export default router
