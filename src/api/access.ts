import type { Permission, User } from '../types/auth'
import type { PaginatedResponse } from '../types/hr'
import { apiClient } from './client'

export async function fetchUsers(params?: {
  page?: number
  page_size?: number
}) {
  const { data } = await apiClient.get<PaginatedResponse<User>>(
    '/accounts/users/',
    { params },
  )
  return data
}

export async function fetchAllUsers() {
  const pageSize = 100
  const firstPage = await fetchUsers({ page: 1, page_size: pageSize })
  const users = [...firstPage.results]
  const pageCount = Math.ceil(firstPage.count / pageSize)
  if (pageCount > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) =>
        fetchUsers({ page: index + 2, page_size: pageSize }),
      ),
    )
    remainingPages.forEach((page) => users.push(...page.results))
  }
  return users
}

export async function createUser(payload: {
  username: string
  email?: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
  employee_id?: string | null
  permission_ids?: string[]
}) {
  const { data } = await apiClient.post<User>('/accounts/users/', payload)
  return data
}

export async function updateUser(
  id: string,
  payload: {
    email?: string
    first_name?: string
    last_name?: string
    phone?: string
    is_active?: boolean
    employee_id?: string | null
    permission_ids?: string[]
  },
) {
  const { data } = await apiClient.patch<User>(
    `/accounts/users/${id}/`,
    payload,
  )
  return data
}

export async function deactivateUser(id: string) {
  await apiClient.delete(`/accounts/users/${id}/`)
}

export async function fetchPermissions() {
  const { data } = await apiClient.get<Permission[]>('/roles/permissions/')
  return data
}
