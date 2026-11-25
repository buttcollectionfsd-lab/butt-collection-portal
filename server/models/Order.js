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

const GatePassItemSchema = new mongoose.Schema({
  id: { type: String, default: '' },
  style: { type: String, default: '' },
  gsm: { type: String, default: '' },
  color: { type: String, default: '' },
  cartons: { type: Number, default: 0 },
  qty: { type: Number, default: 0 },
  remarks: { type: String, default: '' }
}, { _id: false });

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
  isStandalone: { type: Boolean, default: false },
  standaloneType: { type: String, default: '' },
  totalPieces: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  amountReceived: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  docTitle: { type: String, default: 'MERCHANDISER WORK ORDER' },
  docStatus: { type: String, default: '' },
  footerLeft: { type: String, default: 'Prepared by Merchandiser' },
  footerRight: { type: String, default: 'Authorized Signature / Factory' },
  gatePassNo: { type: String, default: '' },
  gatePassDate: { type: String, default: '' },
  gatePassVehicle: { type: String, default: '' },
  gatePassDriver: { type: String, default: '' },
  gatePassDriverCell: { type: String, default: '' },
  gatePassThrough: { type: String, default: '' },
  gatePassDestination: { type: String, default: '' },
  gatePassPurpose: { type: String, default: 'Dispatch of finished goods' },
  gatePassRemarks: { type: String, default: '' },
  gatePassTitle: { type: String, default: '' },
  gatePassGeneratedOn: { type: String, default: '' },
  gatePassCustomer: { type: String, default: '' },
  gatePassOrderNo: { type: String, default: '' },
  gatePassCompanyName: { type: String, default: '' },
  gatePassCompanyTagline: { type: String, default: '' },
  gatePassCompanyAddress: { type: String, default: '' },
  gatePassPreparedBy: { type: String, default: '' },
  gatePassGateKeeper: { type: String, default: '' },
  gatePassReceivedBy: { type: String, default: '' },
  gatePassAuthorizedBy: { type: String, default: '' },
  gatePassFooterNote: { type: String, default: '' },
  gatePassItems: { type: [GatePassItemSchema], default: undefined },
  packingListNo: { type: String, default: '' },
  packingDate: { type: String, default: '' },
  packingNetWeight: { type: String, default: '' },
  packingGrossWeight: { type: String, default: '' },
  packingCartonLength: { type: String, default: '' },
  packingCartonWidth: { type: String, default: '' },
  packingCartonHeight: { type: String, default: '' },
  packingCbm: { type: String, default: '' },
  packingNotes: { type: String, default: '' },
  invoiceNo: { type: String, default: '' },
  invoiceDate: { type: String, default: '' },
  invoiceTerms: { type: String, default: 'Payment due on receipt' },
  invoiceBankDetails: { type: String, default: '' },
  invoiceNotes: { type: String, default: '' },
  invoiceReceived: { type: Number, default: null },
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
