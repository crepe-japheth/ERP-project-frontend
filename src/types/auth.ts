export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  is_active: boolean
  date_joined: string
  organization_id: string | null
  is_superuser: boolean
  permissions: string[]
  direct_permission_ids: string[]
  employee_id: string | null
}

export interface Permission {
  id: string
  code: string
  name: string
  module: string
  action: string
  description: string
  is_active: boolean
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse {
  tokens: AuthTokens
  user: User
}
