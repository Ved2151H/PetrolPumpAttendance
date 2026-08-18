import { SignJWT, jwtVerify } from 'jose'
import { cookies, headers } from 'next/headers'

const secretKey = process.env.JWT_SECRET || 'fallback-secret-key-for-dev-only'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function setSession(adminId: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const session = await encrypt({ adminId, expires })

  const cookieStore = await cookies()
  cookieStore.set('session', session, { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production' })
  
  return session
}

export async function getSession() {
  const cookieStore = await cookies()
  let session = cookieStore.get('session')?.value
  
  if (!session) {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      session = authHeader.substring(7)
    }
  }

  if (!session) return null
  try {
    return await decrypt(session)
  } catch (error) {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.set('session', '', { expires: new Date(0) })
}
