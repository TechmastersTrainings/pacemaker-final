import apiClient from '@/api/client';
import type { User } from '@/types/api';

/** Fetch all users (admin). */
export async function getAllUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users');
  return data;
}

/** Fetch a single user by ID. */
export async function getUserById(id: number): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
}
