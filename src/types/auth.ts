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
  permissions?: string[]
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse {
  tokens: AuthTokens
  user: User
}
