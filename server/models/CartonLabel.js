const mongoose = require('mongoose');

const LabelRowSchema = new mongoose.Schema({
  color: { type: String, required: true },
  xs: { type: Number, default: 0 },
  s: { type: Number, default: 0 },
  m: { type: Number, default: 0 },
  l: { type: Number, default: 0 },
  xl: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
});

const CartonLabelSchema = new mongoose.Schema({
  buyer: { type: String, required: true, trim: true },
  style: { type: String, required: true, trim: true },
  description: { type: String, default: 'PREMIUM GARMENT SET' },
  cartonNo: { type: String, default: '1 OF 4' },
  totalCartons: { type: Number, default: 4 },
  masterCartons: { type: Number, default: 4 },
  setsPerCarton: { type: Number, default: 8 },
  totalSets: { type: Number, default: 32 },
  countryOfOrigin: { type: String, default: 'MADE IN PAKISTAN' },
  manufacturer: { type: String, default: 'BUTT COLLECTION FAISALABAD' },
  rows: [LabelRowSchema],
  notes: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('CartonLabel', CartonLabelSchema);
