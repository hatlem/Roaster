/**
 * Audit trail logger for security-relevant events (ISO 27001 A.8.15)
 * Outputs structured JSON for log aggregation. No database dependency.
 */

import { headers } from 'next/headers'
import { createHash } from 'crypto'

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PERMISSION_CHANGE'
  | 'API_KEY_CREATE'
  | 'API_KEY_REVOKE'
  | 'SETTINGS_CHANGE'

interface AuditEntry {
  userId?: string
  userEmail?: string
  action: AuditAction
  resource: string
  resourceId?: string
  metadata?: Record<string, unknown>
}

function hashPII(data: string): string {
  return createHash('sha256').update(data).digest('hex').substring(0, 16)
}

async function getClientInfo() {
  try {
    const h = await headers()
    return {
      ip: h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || null,
      userAgent: h.get('user-agent'),
      country: h.get('cf-ipcountry') || null,
    }
  } catch {
    return { ip: null, userAgent: null, country: null }
  }
}

const SENSITIVE_FIELDS = ['password', 'secret', 'token', 'apiKey', 'accessToken', 'refreshToken', 'creditCard']

function sanitize(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const obj = { ...(value as Record<string, unknown>) }
  for (const field of SENSITIVE_FIELDS) {
    if (field in obj) obj[field] = '[REDACTED]'
  }
  return obj
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    const client = await getClientInfo()
    const event = {
      type: 'audit',
      timestamp: new Date().toISOString(),
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId || null,
      userId: entry.userId || null,
      userEmailHash: entry.userEmail ? hashPII(entry.userEmail) : null,
      metadata: entry.metadata ? sanitize(entry.metadata) : null,
      ip: client.ip,
      userAgent: client.userAgent,
      country: client.country,
    }

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(event))
    } else {
      console.log(`[AUDIT] ${event.action} ${event.resource}${event.resourceId ? ':' + event.resourceId : ''} by ${event.userId || 'anonymous'}`)
    }
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}

export const audit = {
  login: (userId: string, email: string) =>
    logAuditEvent({ userId, userEmail: email, action: 'LOGIN', resource: 'session' }),
  logout: (userId: string) =>
    logAuditEvent({ userId, action: 'LOGOUT', resource: 'session' }),
  create: (userId: string, resource: string, resourceId: string, metadata?: Record<string, unknown>) =>
    logAuditEvent({ userId, action: 'CREATE', resource, resourceId, metadata }),
  update: (userId: string, resource: string, resourceId: string, metadata?: Record<string, unknown>) =>
    logAuditEvent({ userId, action: 'UPDATE', resource, resourceId, metadata }),
  delete: (userId: string, resource: string, resourceId: string) =>
    logAuditEvent({ userId, action: 'DELETE', resource, resourceId }),
  export: (userId: string, resource: string, metadata?: Record<string, unknown>) =>
    logAuditEvent({ userId, action: 'EXPORT', resource, metadata }),
  permissionChange: (userId: string, targetId: string, metadata: Record<string, unknown>) =>
    logAuditEvent({ userId, action: 'PERMISSION_CHANGE', resource: 'user', resourceId: targetId, metadata }),
}
