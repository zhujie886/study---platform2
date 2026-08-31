export interface DemoUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

interface DemoAccount extends DemoUser {
  passwordHash: string;
  salt: string;
}

const ACCOUNTS_KEY = 'study-platform-demo-accounts-v1';
const DEMO_TOKEN_PREFIX = 'demo:';

const isLoopbackUrl = (value: string) => {
  try {
    const url = new URL(value, window.location.origin);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
};

export const isDemoAuthEnabled = () => {
  const configuredMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase();
  if (configuredMode === 'true') return true;
  if (configuredMode === 'false') return false;

  const apiUrl = String(import.meta.env.VITE_API_URL || '').trim();
  return import.meta.env.PROD && (!apiUrl || isLoopbackUrl(apiUrl));
};

export const isDemoToken = (token: string | null) => Boolean(token?.startsWith(DEMO_TOKEN_PREFIX));

const readAccounts = (): DemoAccount[] => {
  try {
    const value = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const saveAccounts = (accounts: DemoAccount[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const randomId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const hashPassword = async (password: string, salt: string) => {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const authResult = (account: DemoAccount) => {
  const { passwordHash: _passwordHash, salt: _salt, ...user } = account;
  return { user, token: `${DEMO_TOKEN_PREFIX}${randomId()}` };
};

export class DemoAuthError extends Error {
  response: { status: number; data: { error: string } };

  constructor(message: string, status: number) {
    super(message);
    this.name = 'DemoAuthError';
    this.response = { status, data: { error: message } };
  }
}

export const registerDemoAccount = async (email: string, username: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();
  const accounts = readAccounts();
  const alreadyExists = accounts.some(
    (account) =>
      account.email.toLowerCase() === normalizedEmail ||
      account.username.toLowerCase() === normalizedUsername.toLowerCase()
  );

  if (alreadyExists) throw new DemoAuthError('User already exists', 409);

  const salt = randomId();
  const account: DemoAccount = {
    id: randomId(),
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash: await hashPassword(password, salt),
    salt,
  };

  saveAccounts([...accounts, account]);
  return authResult(account);
};

export const loginDemoAccount = async (identifier: string, password: string) => {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const account = readAccounts().find(
    (candidate) =>
      candidate.email.toLowerCase() === normalizedIdentifier ||
      candidate.username.toLowerCase() === normalizedIdentifier
  );

  if (!account || (await hashPassword(password, account.salt)) !== account.passwordHash) {
    throw new DemoAuthError('Invalid credentials', 401);
  }

  return authResult(account);
};

export const updateDemoAccount = (user: DemoUser, data: { username?: string; avatar?: string }) => {
  const accounts = readAccounts();
  const index = accounts.findIndex((account) => account.id === user.id);
  const updatedUser = { ...user, ...data };

  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...data };
    saveAccounts(accounts);
  }

  return updatedUser;
};
