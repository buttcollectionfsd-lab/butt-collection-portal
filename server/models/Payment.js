const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: { type: String, default: '' },
  orderNumber: { type: String, default: 'General' },
  customer: { type: String, required: true, trim: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  amount: { type: Number, required: true },
  method: { type: String, default: 'Bank Transfer' },
  reference: { type: String, default: 'Wasool' },
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

module.exports = mongoose.model('Payment', PaymentSchema);
