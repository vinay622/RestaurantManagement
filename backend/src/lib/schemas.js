const { z } = require('zod')
const { isValidDate, isValidSlot } = require('./time')

const email = z.string().trim().toLowerCase().email('Enter a valid email address.')
const dateStr = z.string().refine(isValidDate, 'Use a valid date (YYYY-MM-DD).')
const timeStr = z.string().refine(isValidSlot, 'Choose a valid seating time.')

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name.'),
  email,
  password: z.string().min(6, 'At least 6 characters.'),
  accessCode: z.string().trim().optional(),
})

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.'),
})

const createTableSchema = z.object({
  label: z.string().trim().min(1, 'Give the table a label.'),
  capacity: z.coerce.number().int().min(1, 'At least 1 seat.').max(20, 'At most 20 seats.'),
  location: z.string().trim().optional(),
  active: z.boolean().optional(),
})

const updateTableSchema = z.object({
  label: z.string().trim().min(1).optional(),
  capacity: z.coerce.number().int().min(1).max(20).optional(),
  location: z.string().trim().optional(),
  active: z.boolean().optional(),
})

const createReservationSchema = z.object({
  tableId: z.string().trim().min(1, 'Choose a table.'),
  date: dateStr,
  time: timeStr,
  guests: z.coerce.number().int().min(1, 'At least one guest.'),
  notes: z.string().trim().max(280).optional(),
})

const updateReservationSchema = z.object({
  tableId: z.string().trim().min(1).optional(),
  date: dateStr.optional(),
  time: timeStr.optional(),
  guests: z.coerce.number().int().min(1).optional(),
  status: z.enum(['confirmed', 'cancelled']).optional(),
  notes: z.string().trim().max(280).optional(),
})

module.exports = {
  registerSchema,
  loginSchema,
  createTableSchema,
  updateTableSchema,
  createReservationSchema,
  updateReservationSchema,
}
