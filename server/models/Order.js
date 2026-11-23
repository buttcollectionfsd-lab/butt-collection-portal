const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  style: { type: String, required: true },
  gsm: { type: String, default: '' },
  color: { type: String, default: 'Assorted' },
  sizeBreakdown: {
    xs: { type: Number, default: 0 },
    s: { type: Number, default: 0 },
    m: { type: Number, default: 0 },
    l: { type: Number, default: 0 },
    xl: { type: Number, default: 0 }
  },
  cartons: { type: Number, default: 0 },
  setsPerCarton: { type: Number, default: 0 },
  qty: { type: Number, required: true, default: 0 },
  rate: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 }
});

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, trim: true },
  customer: { type: String, required: true, trim: true },
  manufacturer: { type: String, default: 'Butt Collection' },
  dispatchCity: { type: String, default: 'Faisalabad' },
  orderDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  deadline: { type: String, default: '' },
  shippedOn: { type: String, default: '' },
  status: {
    type: String,
    enum: ['In Progress', 'Shipped'],
    default: 'In Progress'
  },
  totalPieces: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  amountReceived: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  items: [OrderItemSchema]
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

module.exports = mongoose.model('Order', OrderSchema);
