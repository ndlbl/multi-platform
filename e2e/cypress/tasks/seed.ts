// Node-side DB helpers exposed to specs as cy.task('db:*').
// These run in Cypress's Node process (see cypress.config.ts setupNodeEvents),
// connecting to the SAME MongoDB the API uses so seeded data is real end-to-end.
//
// We deliberately reuse the API's own .env (Mongo host/creds/db) and replicate
// its hashing (bcryptjs for passwords, sha256 for OTP codes) so seeded users and
// codes are indistinguishable from ones the API itself would create.
//
// Framework-agnostic: the same seeding backs the Angular and React suites.
import path from 'node:path'
import crypto from 'node:crypto'

import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { Db, MongoClient } from 'mongodb'

// Load the API's .env (we run from e2e/, the API sits alongside at ../api).
dotenv.config({ path: path.resolve(process.cwd(), '../api/.env') })

const DB_NAME = process.env.MONGO_DB ?? 'taskmanager'

// Mirror api/src/db.js buildConnection() so we authenticate identically.
function buildConnection(): { uri: string; options: ConstructorParameters<typeof MongoClient>[1] } {
  if (process.env.MONGO_URI) return { uri: process.env.MONGO_URI, options: {} }

  const host = process.env.MONGO_HOST ?? '127.0.0.1'
  const port = process.env.MONGO_PORT ?? '27017'
  const uri = `mongodb://${host}:${port}/${DB_NAME}`
  const user = process.env.MONGO_USER
  const pass = process.env.MONGO_PASS

  if (user && pass) {
    return {
      uri,
      options: {
        auth: { username: user, password: pass },
        authSource: process.env.MONGO_AUTH_SOURCE ?? DB_NAME,
      },
    }
  }
  return { uri, options: {} }
}

let clientPromise: Promise<MongoClient> | null = null
async function getDb(): Promise<Db> {
  if (!clientPromise) {
    const { uri, options } = buildConnection()
    clientPromise = new MongoClient(uri, options).connect()
  }
  return (await clientPromise).db(DB_NAME)
}

const lc = (email: string) => email.toLowerCase().trim()
const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex')

async function upsertUser(email: string, password: string, emailVerified: boolean, role: 'user' | 'admin') {
  const db = await getDb()
  const lower = lc(email)
  const passwordHash = await bcrypt.hash(password, 12)
  const now = new Date()
  await db.collection('users').updateOne(
    { email: lower },
    {
      $set: { email: lower, passwordHash, emailVerified, role, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  )
  const user = await db.collection('users').findOne({ email: lower })
  return { id: user!._id.toString(), email: lower }
}

export function seedVerifiedUser(args: { email: string; password: string; role?: 'user' | 'admin' }) {
  return upsertUser(args.email, args.password, true, args.role ?? 'user')
}

export function seedUnverifiedUser(args: { email: string; password: string }) {
  return upsertUser(args.email, args.password, false, 'user')
}

// Insert an OTP with a code WE choose (the API stores only a sha256 hash, so the
// emailed code is unrecoverable — but we own the DB, so we plant a known one).
export async function seedOtp(args: { email: string; code: string; purpose: 'register' | 'login'; ttlMs?: number }) {
  const db = await getDb()
  const email = lc(args.email)
  const code = args.code.toUpperCase()
  const now = new Date()
  // Match the API: invalidate prior un-consumed codes, then insert ours as newest.
  await db.collection('otps').updateMany({ email, purpose: args.purpose, consumed: false }, { $set: { consumed: true } })
  await db.collection('otps').insertOne({
    email,
    purpose: args.purpose,
    codeHash: sha256(code),
    expiresAt: new Date(Date.now() + (args.ttlMs ?? 10 * 60 * 1000)),
    consumed: false,
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  })
  return { email, code }
}

export async function seedTask(args: { email: string; title: string; done?: boolean }) {
  const db = await getDb()
  const user = await db.collection('users').findOne({ email: lc(args.email) })
  if (!user) throw new Error(`seedTask: no user for ${args.email} — seed the user first`)
  const now = new Date()
  const res = await db
    .collection('tasks')
    .insertOne({ title: args.title, done: args.done ?? false, userId: user._id, createdAt: now, updatedAt: now })
  return { id: res.insertedId.toString() }
}

export async function seedLibraryItem(args: { email: string; item: Record<string, unknown> }) {
  const db = await getDb()
  const user = await db.collection('users').findOne({ email: lc(args.email) })
  if (!user) throw new Error(`seedLibraryItem: no user for ${args.email} — seed the user first`)
  const now = new Date()
  const res = await db
    .collection('libraryitems')
    .insertOne({ consumed: false, tags: [], ...args.item, userId: user._id, addedAt: now, updatedAt: now })
  return { id: res.insertedId.toString() }
}

// Remove the given e2e accounts and everything they own. Safe to call before and
// after each spec — it only ever touches the explicitly-named emails.
export async function cleanup(args: { emails: string[] }) {
  const db = await getDb()
  const emails = args.emails.map(lc)
  const users = await db.collection('users').find({ email: { $in: emails } }).toArray()
  const ids = users.map((u) => u._id)
  if (ids.length) {
    await db.collection('tasks').deleteMany({ userId: { $in: ids } })
    await db.collection('libraryitems').deleteMany({ userId: { $in: ids } })
  }
  await db.collection('users').deleteMany({ email: { $in: emails } })
  await db.collection('otps').deleteMany({ email: { $in: emails } })
  return { deletedUsers: ids.length }
}
