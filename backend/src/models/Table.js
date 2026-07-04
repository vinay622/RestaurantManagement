const mongoose = require('mongoose')

const tableSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1, max: 20 },
    location: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

tableSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    label: this.label,
    capacity: this.capacity,
    location: this.location || undefined,
    active: this.active,
    created_at: this.createdAt,
  }
}

module.exports = mongoose.model('Table', tableSchema)
