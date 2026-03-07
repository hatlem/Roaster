/**
 * AES-256-GCM encryption for sensitive data at rest (ISO 27001 A.8.24)
 * Uses Node.js built-in crypto — no external dependencies.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const KEY_LENGTH = 32
const PBKDF2_ITERATIONS = 100_000

function getKey(): Buffer {
  const masterKey = process.env.ENCRYPTION_KEY
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required for encryption')
  }
  if (masterKey.length === 64) {
    return Buffer.from(masterKey, 'hex')
  }
  const salt = process.env.ENCRYPTION_SALT || 'roaster-default-salt'
  return crypto.pbkdf2Sync(masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Format: base64(iv + authTag + ciphertext)
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decrypt(encoded: string): string {
  const key = getKey()
  const data = Buffer.from(encoded, 'base64')
  const iv = data.subarray(0, IV_LENGTH)
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)
  return decipher.update(ciphertext) + decipher.final('utf8')
}

export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}
