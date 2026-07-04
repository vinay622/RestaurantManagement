// Convert object keys between the frontend's camelCase and the
// backend's snake_case at the API boundary. Leaves values alone.

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())

function convertKeys(input: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(input)) return input.map((v) => convertKeys(v, fn))
  if (input && typeof input === 'object' && !(input instanceof Date)) {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([k, v]) => [
        fn(k),
        convertKeys(v, fn),
      ]),
    )
  }
  return input
}

export const keysToSnake = <T>(obj: T): T => convertKeys(obj, toSnake) as T
export const keysToCamel = <T>(obj: T): T => convertKeys(obj, toCamel) as T
