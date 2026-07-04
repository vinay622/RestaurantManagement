import axios, { AxiosError } from 'axios'
import { keysToCamel, keysToSnake } from './caseConvert'

export const TOKEN_KEY = 'ml.token'

/** A user-facing error carrying the backend's message when present. */
export class ApiError extends Error {
  status?: number
  code?: string
  fields?: Record<string, string>
  constructor(message: string, opts?: { status?: number; code?: string; fields?: Record<string, string> }) {
    super(message)
    this.name = 'ApiError'
    this.status = opts?.status
    this.code = opts?.code
    this.fields = opts?.fields
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT + convert outgoing bodies to snake_case.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data && typeof config.data === 'object') {
    config.data = keysToSnake(config.data)
  }
  return config
})

// Convert responses to camelCase; translate errors to ApiError.
http.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      response.data = keysToCamel(response.data)
    }
    return response
  },
  (error: AxiosError) => {
    const data = error.response?.data as
      | { error?: { message?: string; code?: string; details?: Array<{ field: string; message: string }> } }
      | undefined
    const err = data?.error
    const fields = err?.details?.reduce<Record<string, string>>((acc, d) => {
      acc[d.field] = d.message
      return acc
    }, {})
    throw new ApiError(err?.message || error.message || 'Something went wrong.', {
      status: error.response?.status,
      code: err?.code,
      fields,
    })
  },
)
