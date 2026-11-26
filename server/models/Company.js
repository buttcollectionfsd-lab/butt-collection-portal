const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, default: 'Butt Collection' },
  city: { type: String, default: 'Faisalabad' },
  country: { type: String, default: 'Pakistan' },
  phone: { type: String, default: '+92 300 1234567' },
  address: { type: String, default: 'Ayub Colony, Fsd, Street No 9, Center Mill Road' },
  currency: { type: String, default: '£' },
  currencyCode: { type: String, default: 'GBP' },
  tagline: { type: String, default: 'Quality Apparel Manufacturing & Export' }
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

module.exports = mongoose.model('Company', CompanySchema);
