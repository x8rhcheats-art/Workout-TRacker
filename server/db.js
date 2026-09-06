import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
})

export const all = (sql, p = []) => pool.query(sql, p).then(r => r.rows)
export const one = (sql, p = []) => pool.query(sql, p).then(r => r.rows[0] ?? null)
export const run = (sql, p = []) => pool.query(sql, p)

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS splits (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    split_id INTEGER NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    current_weight REAL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    rep_target INTEGER DEFAULT 10,
    sort_order INTEGER DEFAULT 0,
    is_compound BOOLEAN DEFAULT FALSE,
    sets_target INTEGER DEFAULT 3
  );
  CREATE TABLE IF NOT EXISTS logged_sets (
    id SERIAL PRIMARY KEY,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    logged_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS day_split_map (
    days_trained INTEGER PRIMARY KEY,
    split_id INTEGER NOT NULL REFERENCES splits(id)
  );
  CREATE TABLE IF NOT EXISTS weekday_schedule (
    weekday TEXT PRIMARY KEY,
    split_id INTEGER REFERENCES splits(id)
  );
  CREATE TABLE IF NOT EXISTS user_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`

export async function initDB() {
  await pool.query(SCHEMA)
  await pool.query(`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS sets_target INTEGER DEFAULT 3`)
  const { rows } = await pool.query('SELECT COUNT(*) AS c FROM splits')
  if (parseInt(rows[0].c) === 0) await seed()
}

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const ins = name => client.query('INSERT INTO splits (name) VALUES ($1) RETURNING id', [name]).then(r => r.rows[0].id)
    const push  = await ins('Push')
    const pull  = await ins('Pull')
    const legs  = await ins('Legs')
    const upper = await ins('Upper')
    const lower = await ins('Lower')

    const ex = (sid, name, wt, unit, reps, ord, comp) =>
      client.query(
        'INSERT INTO exercises (split_id, name, current_weight, unit, rep_target, sort_order, is_compound) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [sid, name, wt, unit, reps, ord, comp]
      )

    await ex(push, 'Bench Press',      60, 'kg',  8, 1, true)
    await ex(push, 'Overhead Press',   40, 'kg', 10, 2, true)
    await ex(push, 'Incline DB Press', 24, 'kg', 10, 3, false)
    await ex(push, 'Tricep Pushdown',  25, 'kg', 12, 4, false)
    await ex(push, 'Lateral Raise',    10, 'kg', 15, 5, false)

    await ex(pull, 'Deadlift',    100, 'kg',  5, 1, true)
    await ex(pull, 'Barbell Row',  60, 'kg',  8, 2, true)
    await ex(pull, 'Pull-ups',      0, 'kg',  8, 3, true)
    await ex(pull, 'Face Pull',    15, 'kg', 15, 4, false)
    await ex(pull, 'Bicep Curl',   14, 'kg', 12, 5, false)

    await ex(legs, 'Squat',             80, 'kg',  8, 1, true)
    await ex(legs, 'Romanian Deadlift', 60, 'kg', 10, 2, true)
    await ex(legs, 'Leg Press',        120, 'kg', 12, 3, false)
    await ex(legs, 'Leg Curl',          45, 'kg', 12, 4, false)
    await ex(legs, 'Calf Raise',        60, 'kg', 15, 5, false)

    await ex(upper, 'Bench Press',     60, 'kg',  8, 1, true)
    await ex(upper, 'Barbell Row',     60, 'kg',  8, 2, true)
    await ex(upper, 'Overhead Press',  40, 'kg', 10, 3, true)
    await ex(upper, 'Pull-ups',         0, 'kg',  8, 4, true)
    await ex(upper, 'Lateral Raise',   10, 'kg', 15, 5, false)

    await ex(lower, 'Squat',      80, 'kg',  8, 1, true)
    await ex(lower, 'Deadlift',  100, 'kg',  5, 2, true)
    await ex(lower, 'Leg Press', 120, 'kg', 12, 3, false)
    await ex(lower, 'Leg Curl',   45, 'kg', 12, 4, false)
    await ex(lower, 'Calf Raise', 60, 'kg', 15, 5, false)

    const dm = (d, s) => client.query('INSERT INTO day_split_map (days_trained, split_id) VALUES ($1,$2)', [d, s])
    await dm(0, push); await dm(1, pull); await dm(2, legs); await dm(3, upper); await dm(4, upper)

    const ws = (day, s) => client.query('INSERT INTO weekday_schedule (weekday, split_id) VALUES ($1,$2)', [day, s])
    await ws('Mon', push); await ws('Tue', pull); await ws('Wed', legs)
    await ws('Thu', upper); await ws('Fri', lower)
    await client.query('INSERT INTO weekday_schedule (weekday) VALUES ($1),($2)', ['Sat', 'Sun'])

    await client.query("INSERT INTO user_config (key, value) VALUES ('name', 'John') ON CONFLICT (key) DO NOTHING")

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
