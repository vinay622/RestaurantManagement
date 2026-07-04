const { Router } = require('express')

const { requireAuth, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const {
  registerSchema,
  loginSchema,
  createTableSchema,
  updateTableSchema,
  createReservationSchema,
  updateReservationSchema,
} = require('../lib/schemas')

const authController = require('../controllers/authController')
const tableController = require('../controllers/tableController')
const availabilityController = require('../controllers/availabilityController')
const reservationController = require('../controllers/reservationController')
const adminReservationController = require('../controllers/adminReservationController')

const router = Router()

// ── Auth ────────────────────────────────────────────────
router.post('/auth/register', validate(registerSchema), authController.register)
router.post('/auth/login', validate(loginSchema), authController.login)
router.get('/auth/me', requireAuth, authController.me)

// ── Tables ──────────────────────────────────────────────
router.get('/tables', requireAuth, tableController.list)
router.post('/tables', requireAuth, requireAdmin, validate(createTableSchema), tableController.create)
router.post('/tables/update', requireAuth, requireAdmin, validate(updateTableSchema), tableController.update)
router.post('/tables/delete', requireAuth, requireAdmin, tableController.remove)

// ── Availability ────────────────────────────────────────
router.get('/availability', requireAuth, availabilityController.availability)

// ── Customer reservations ───────────────────────────────
router.post('/reservations', requireAuth, validate(createReservationSchema), reservationController.create)
router.get('/reservations/mine', requireAuth, reservationController.mine)
router.post('/reservations/cancel', requireAuth, reservationController.cancel)

// ── Admin reservations ──────────────────────────────────
router.get('/admin/reservations', requireAuth, requireAdmin, adminReservationController.list)
router.post(
  '/admin/reservations/update',
  requireAuth,
  requireAdmin,
  validate(updateReservationSchema),
  adminReservationController.update,
)

module.exports = router
