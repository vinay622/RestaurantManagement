const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
    time: { type: String, required: true }, // 'HH:mm'
    durationMinutes: { type: Number, required: true },
    guests: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed', index: true },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

// Backstop against identical-slot double bookings at the DB level.
// (Overlapping tails are handled in the service layer; see reservationService.)
reservationSchema.index(
  { tableId: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } },
)

/** Serialize to the wire shape. Optionally embeds hydrated table/user. */
reservationSchema.methods.toPublic = function toPublic({ table, user } = {}) {
  return {
    id: this._id.toString(),
    table_id: this.tableId.toString(),
    user_id: this.userId.toString(),
    date: this.date,
    time: this.time,
    duration_minutes: this.durationMinutes,
    guests: this.guests,
    status: this.status,
    notes: this.notes || undefined,
    created_at: this.createdAt,
    table: table ? table.toPublic() : undefined,
    user: user ? { id: user._id.toString(), name: user.name, email: user.email } : undefined,
  }
}

module.exports = mongoose.model('Reservation', reservationSchema)
