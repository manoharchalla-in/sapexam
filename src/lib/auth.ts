import { cookies } from 'next/headers';
import { getTrainerByUsername } from './db';

const ADMIN_COOKIE_NAME = 'sap_admin_session';
const ADMIN_SECRET_TOKEN = process.env.ADMIN_SESSION_SECRET || 'sap_admin_secret_token_2026_abap';

export interface AdminSession {
  role: 'super_admin' | 'trainer';
  username: string;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionVal) return null;

  if (sessionVal === ADMIN_SECRET_TOKEN) {
    return { role: 'super_admin', username: 'admin' };
  }

  if (sessionVal.startsWith('trainer_token_')) {
    const rawUsername = sessionVal.replace('trainer_token_', '');
    const trainer = getTrainerByUsername(rawUsername);
    if (trainer) {
      return { role: 'trainer', username: trainer.username };
    }
  }

  return null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}

export function getAdminCookieHeader(token: string | null) {
  if (token) {
    return `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`;
  }
  return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export { ADMIN_SECRET_TOKEN, ADMIN_COOKIE_NAME };
