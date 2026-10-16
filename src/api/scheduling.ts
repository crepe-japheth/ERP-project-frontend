import type { PaginatedResponse } from '../types/hr'
import type {
  EmployeeAvailability,
  Schedule,
  ScheduleGeneration,
  ScheduleRevision,
  ScheduleValidation,
  SchedulableEmployee,
  SchedulingPolicy,
  Shift,
  ShiftAssignment,
  ShiftPayload,
  ShiftTemplate,
  ShiftTemplatePayload,
} from '../types/scheduling'
import { apiClient } from './client'

const BASE = '/hr/scheduling'

async function fetchAllPages<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
) {
  const pageSize = 100
  const { data: first } = await apiClient.get<PaginatedResponse<T>>(path, {
    params: { ...params, page: 1, page_size: pageSize },
  })
  const items = [...first.results]
  const pageCount = Math.max(Math.ceil(first.count / pageSize), 1)
  if (pageCount > 1) {
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) =>
        apiClient.get<PaginatedResponse<T>>(path, {
          params: { ...params, page: index + 2, page_size: pageSize },
        }),
      ),
    )
    rest.forEach(({ data }) => items.push(...data.results))
  }
  return items
}

export function fetchSchedulingEmployees(params?: {
  search?: string
  department?: string
  start?: string
  end?: string
}) {
  return fetchAllPages<SchedulableEmployee>(`${BASE}/employees/`, params)
}

export function fetchShiftTemplates(params?: {
  search?: string
  department?: string
}) {
  return fetchAllPages<ShiftTemplate>(`${BASE}/templates/`, params)
}

export async function createShiftTemplate(payload: ShiftTemplatePayload) {
  const { data } = await apiClient.post<ShiftTemplate>(`${BASE}/templates/`, payload)
  return data
}

export async function updateShiftTemplate(id: string, payload: Partial<ShiftTemplatePayload>) {
  const { data } = await apiClient.patch<ShiftTemplate>(`${BASE}/templates/${id}/`, payload)
  return data
}

export async function deleteShiftTemplate(id: string) {
  await apiClient.delete(`${BASE}/templates/${id}/`)
}

export function fetchSchedules(params?: {
  department?: string
  status?: string
  search?: string
}) {
  return fetchAllPages<Schedule>(`${BASE}/schedules/`, params)
}

export async function createSchedule(payload: {
  name: string
  department: string
  start_date: string
  end_date: string
  notes?: string
}) {
  const { data } = await apiClient.post<Schedule>(`${BASE}/schedules/`, payload)
  return data
}

export function fetchShifts(params?: {
  schedule?: string
  department?: string
  employee?: string
  start?: string
  end?: string
}) {
  return fetchAllPages<Shift>(`${BASE}/shifts/`, params)
}

export async function createShift(payload: ShiftPayload) {
  const { data } = await apiClient.post<Shift>(`${BASE}/shifts/`, payload)
  return data
}

export async function updateShift(id: string, payload: Partial<ShiftPayload>) {
  const { data } = await apiClient.patch<Shift>(`${BASE}/shifts/${id}/`, payload)
  return data
}

export async function deleteShift(id: string) {
  await apiClient.delete(`${BASE}/shifts/${id}/`)
}

export async function assignShiftEmployee(shiftId: string, employee: string) {
  const { data } = await apiClient.post<ShiftAssignment>(
    `${BASE}/shifts/${shiftId}/assignments/`,
    { employee },
  )
  return data
}

export async function unassignShiftEmployee(assignmentId: string) {
  await apiClient.delete(`${BASE}/assignments/${assignmentId}/`)
}

export async function validateSchedule(id: string) {
  const { data } = await apiClient.get<ScheduleValidation>(`${BASE}/schedules/${id}/validate/`)
  return data
}

export async function generateSchedule(id: string, payload?: { replace_existing?: boolean }) {
  const { data } = await apiClient.post<ScheduleGeneration>(
    `${BASE}/schedules/${id}/generate/`,
    payload ?? { replace_existing: true },
  )
  return data
}

export async function publishSchedule(id: string) {
  const { data } = await apiClient.post<Schedule>(`${BASE}/schedules/${id}/publish/`)
  return data
}

export async function reviseSchedule(id: string) {
  const { data } = await apiClient.post<Schedule>(`${BASE}/schedules/${id}/revise/`)
  return data
}

export function fetchScheduleRevisions(id: string) {
  return fetchAllPages<ScheduleRevision>(`${BASE}/schedules/${id}/revisions/`)
}

export function fetchMyShifts(params?: { start?: string; end?: string }) {
  return fetchAllPages<Shift>('/hr/self/schedule/', params)
}

export function fetchMyAvailability() {
  return fetchAllPages<EmployeeAvailability>('/hr/self/availability/')
}

export async function createMyAvailability(payload: {
  kind: 'unavailable' | 'preferred'
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  notes?: string
}) {
  const { data } = await apiClient.post<EmployeeAvailability>('/hr/self/availability/', payload)
  return data
}

export async function deleteMyAvailability(id: string) {
  await apiClient.delete(`/hr/self/availability/${id}/`)
}

export async function fetchSchedulingPolicy() {
  const { data } = await apiClient.get<SchedulingPolicy>('/hr/settings/scheduling-policy/')
  return data
}

export async function updateSchedulingPolicy(payload: Partial<SchedulingPolicy>) {
  const { data } = await apiClient.patch<SchedulingPolicy>(
    '/hr/settings/scheduling-policy/',
    payload,
  )
  return data
}
