// User types and simple file-based storage
// In production, replace this with a proper database (PostgreSQL, MongoDB, etc.)

import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  google?: {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
}

interface UsersData {
  users: User[];
}

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory and file exist
function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function readUsers(): UsersData {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { users: [] };
  }
}

function writeUsers(data: UsersData): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const data = readUsers();
  const user = data.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  return user || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const data = readUsers();
  const user = data.users.find((u) => u.id === id);
  return user || null;
}

export async function createUser(userData: {
  email: string;
  name: string;
}): Promise<User> {
  const data = readUsers();
  
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: userData.email.toLowerCase(),
    name: userData.name,
    createdAt: new Date().toISOString(),
  };
  
  data.users.push(newUser);
  writeUsers(data);
  
  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User | null> {
  const data = readUsers();
  const userIndex = data.users.findIndex((u) => u.id === id);
  
  if (userIndex === -1) {
    return null;
  }
  
  data.users[userIndex] = {
    ...data.users[userIndex],
    ...updates,
  };
  
  writeUsers(data);
  return data.users[userIndex];
}

export async function deleteUser(id: string): Promise<boolean> {
  const data = readUsers();
  const initialLength = data.users.length;
  data.users = data.users.filter((u) => u.id !== id);
  
  if (data.users.length < initialLength) {
    writeUsers(data);
    return true;
  }
  
  return false;
}
