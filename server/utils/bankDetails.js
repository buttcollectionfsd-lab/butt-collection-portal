/**
 * Bank / payment details jo client ko bheje jate hain.
 * company.bank se aate hain; agar company mein bank object na ho to
 * neeche diye gaye defaults use hote hain (current account details).
 */

const DEFAULT_BANK_DETAILS = {
  accountTitle: 'FARHAN FAISAL',
  bankName: 'Meezan Bank',
  accountNo: '04060106360449',
  iban: 'PK20MEZN0004060106360449',
  branch: 'Dijkot Road',
  city: 'Faisalabad',
  swift: ''
};

function pick(value, fallback) {
  const text = value === undefined || value === null ? '' : String(value).trim();
  return text || fallback;
}

function getBankDetails(company) {
  const bank = (company && company.bank) || {};
  return {
    accountTitle: pick(bank.accountTitle, DEFAULT_BANK_DETAILS.accountTitle),
    bankName: pick(bank.bankName, DEFAULT_BANK_DETAILS.bankName),
    accountNo: pick(bank.accountNo, DEFAULT_BANK_DETAILS.accountNo),
    iban: pick(bank.iban, DEFAULT_BANK_DETAILS.iban),
    branch: pick(bank.branch, DEFAULT_BANK_DETAILS.branch),
    city: pick(bank.city, DEFAULT_BANK_DETAILS.city),
    swift: pick(bank.swift, DEFAULT_BANK_DETAILS.swift)
  };
}

module.exports = {
  DEFAULT_BANK_DETAILS,
  getBankDetails
};
