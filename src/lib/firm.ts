import { cookies } from 'next/headers';

export async function setFirmId(firmId: string) {
  const cookieStore = await cookies();
  cookieStore.set('firmId', firmId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function getFirmId() {
  const cookieStore = await cookies();
  const firmId = cookieStore.get('firmId')?.value;
  return firmId || null;
}

export async function clearFirmId() {
  const cookieStore = await cookies();
  cookieStore.delete('firmId');
}
