import type { LoginResponse, User } from '../types/auth'
import { apiClient } from './client'

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/accounts/auth/login/', {
    username,
    password,
  })
  return data
}

export async function logout(refresh: string): Promise<void> {
  await apiClient.post('/accounts/auth/logout/', { refresh })
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/accounts/auth/me/')
  return data
}
