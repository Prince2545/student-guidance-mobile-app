import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, User, AuthState } from './schema';
import { simpleHash } from '../utils/hash';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

async function getUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.users);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

async function getAuthState(): Promise<AuthState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.auth);
  if (!raw) return { currentUserId: null };
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return { currentUserId: null };
  }
}

async function saveAuthState(state: AuthState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(state));
}

export async function signUp(params: {
  name: string;
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}): Promise<User> {
  const users = await getUsers();
  const existing = users.find(
    (u) => u.email.trim().toLowerCase() === params.email.trim().toLowerCase(),
  );
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const user: User = {
    id: uuidv4(),
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    passwordHash: simpleHash(params.password),
    securityQuestion: params.securityQuestion.trim(),
    securityAnswerHash: simpleHash(params.securityAnswer),
    avatarHue: Math.floor(Math.random() * 360),
    createdAt: new Date().toISOString(),
  };

  const nextUsers = [...users, user];
  await saveUsers(nextUsers);
  await saveAuthState({ currentUserId: user.id });
  return user;
}

export async function logIn(email: string, password: string): Promise<User> {
  const users = await getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email === normalizedEmail);
  if (!user) {
    throw new Error('No account found for this email.');
  }
  if (user.passwordHash !== simpleHash(password)) {
    throw new Error('Incorrect password. Please try again.');
  }
  await saveAuthState({ currentUserId: user.id });
  return user;
}

export async function logOut(): Promise<void> {
  await saveAuthState({ currentUserId: null });
}

export async function getCurrentUser(): Promise<User | null> {
  const [authState, users] = await Promise.all([getAuthState(), getUsers()]);
  if (!authState.currentUserId) return null;
  return users.find((u) => u.id === authState.currentUserId) ?? null;
}

export async function updateUserProfile(
  userId: string,
  update: Partial<Pick<User, 'name' | 'avatarHue' | 'securityQuestion' | 'securityAnswerHash'>>,
): Promise<User> {
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    throw new Error('User not found.');
  }
  const next: User = {
    ...users[idx],
    ...update,
  };
  const nextUsers = [...users];
  nextUsers[idx] = next;
  await saveUsers(nextUsers);
  return next;
}

