import { cookies } from 'next/headers';
import { getTrainerByUsername } from './db';

const ADMIN_COOKIE_NAME = 'sap_admin_session';
const ADMIN_SECRET_TOKEN = process.env.ADMIN_SESSION_SECRET || 'sap_admin_secret_token_2026_abap';

export interface AdminUserConfig {
  username: string;
  displayName: string;
  panelTitle: string;
  initials: string;
  themeColor: string;
}

export const DEFAULT_ADMIN_ACCOUNTS: Record<string, AdminUserConfig> = {
  nani: {
    username: 'nani',
    displayName: 'Nani',
    panelTitle: "Nani's Admin Panel",
    initials: 'NA',
    themeColor: 'from-blue-600 to-indigo-600',
  },
  nokaraju: {
    username: 'nokaraju',
    displayName: 'Nokaraju',
    panelTitle: "Nokaraju's Admin Panel",
    initials: 'NO',
    themeColor: 'from-emerald-600 to-teal-600',
  },
  dakshiyani: {
    username: 'dakshiyani',
    displayName: 'Dakshiyani',
    panelTitle: "Dakshiyani's Admin Panel",
    initials: 'DA',
    themeColor: 'from-purple-600 to-pink-600',
  },
  apparaju: {
    username: 'apparaju',
    displayName: 'Apparaju',
    panelTitle: "Apparaju's Admin Panel",
    initials: 'AP',
    themeColor: 'from-amber-600 to-orange-600',
  },
  admin: {
    username: 'admin',
    displayName: 'Super Admin',
    panelTitle: 'Super Admin Master Control',
    initials: 'SA',
    themeColor: 'from-blue-600 to-sky-600',
  },
};

export interface AdminSession {
  role: 'super_admin' | 'admin';
  username: string;
  displayName: string;
  panelTitle: string;
  initials: string;
  isSuperAdmin: boolean;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionVal) return null;

  // 1. Check direct admin_token_<username>
  if (sessionVal.startsWith('admin_token_')) {
    const rawUser = sessionVal.replace('admin_token_', '').toLowerCase();
    const isMaster = rawUser === 'admin';
    const adminConfig = DEFAULT_ADMIN_ACCOUNTS[rawUser] || {
      username: rawUser,
      displayName: rawUser.charAt(0).toUpperCase() + rawUser.slice(1),
      panelTitle: `${rawUser.charAt(0).toUpperCase() + rawUser.slice(1)}'s Admin Panel`,
      initials: rawUser.slice(0, 2).toUpperCase(),
      themeColor: 'from-blue-600 to-indigo-600',
    };

    return {
      role: isMaster ? 'super_admin' : 'admin',
      username: adminConfig.username,
      displayName: adminConfig.displayName,
      panelTitle: adminConfig.panelTitle,
      initials: adminConfig.initials,
      isSuperAdmin: isMaster,
    };
  }

  // 2. Backward compatibility with ADMIN_SECRET_TOKEN
  if (sessionVal === ADMIN_SECRET_TOKEN) {
    return {
      role: 'super_admin',
      username: 'admin',
      displayName: 'Super Admin',
      panelTitle: 'Super Admin Master Control',
      initials: 'SA',
      isSuperAdmin: true,
    };
  }

  // 3. Backward compatibility with legacy trainer_token_
  if (sessionVal.startsWith('trainer_token_')) {
    const rawUsername = sessionVal.replace('trainer_token_', '').toLowerCase();
    const adminConfig = DEFAULT_ADMIN_ACCOUNTS[rawUsername] || {
      username: rawUsername,
      displayName: rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1),
      panelTitle: `${rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1)}'s Admin Panel`,
      initials: rawUsername.slice(0, 2).toUpperCase(),
      themeColor: 'from-blue-600 to-indigo-600',
    };
    return {
      role: 'admin',
      username: adminConfig.username,
      displayName: adminConfig.displayName,
      panelTitle: adminConfig.panelTitle,
      initials: adminConfig.initials,
      isSuperAdmin: false,
    };
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
