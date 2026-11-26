/**
 * Bank / payment details jo client ko bheje jate hain.
 * Server ke company.bank se aate hain; agar missing ho to ye defaults.
 */

export const DEFAULT_BANK_DETAILS = {
  accountTitle: 'FARHAN FAISAL',
  bankName: 'Meezan Bank',
  accountNo: '04060106360449',
  iban: 'PK20MEZN0004060106360449',
  branch: 'Dijkot Road',
  city: 'Faisalabad',
  swift: ''
};

const pick = (value, fallback) => {
  const text = value === undefined || value === null ? '' : String(value).trim();
  return text || fallback;
};

export function getBankDetails(company) {
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

export function bankDetailsRows(bank) {
  const b = bank || getBankDetails();
  const rows = [
    { key: 'accountTitle', label: 'Account Title', value: b.accountTitle },
    { key: 'bankName', label: 'Bank Name', value: b.bankName },
    { key: 'accountNo', label: 'Account Number', value: b.accountNo, mono: true },
    { key: 'iban', label: 'IBAN', value: b.iban, mono: true, wide: true },
    { key: 'branch', label: 'Branch / City', value: [b.branch, b.city].filter(Boolean).join(', ') }
  ];
  if (b.swift) {
    rows.push({ key: 'swift', label: 'SWIFT Code', value: b.swift, mono: true });
  }
  return rows;
}

export function getCompanyPhone(company) {
  const phone = String((company && company.phone) || '').trim();
  // Seeded demo number client ko nahi bhejna chahiye.
  if (!phone || phone.replace(/[\s-]/g, '') === '+923001234567') return '';
  return phone;
}

export function buildBankDetailsText(company) {
  const b = getBankDetails(company);
  const name = String((company && company.name) || 'Butt Collection').trim();
  const phone = getCompanyPhone(company);
  return [
    `${name} — Bank Payment Details`,
    '',
    `Account Title: ${b.accountTitle}`,
    `Bank: ${b.bankName}`,
    `Account No: ${b.accountNo}`,
    `IBAN: ${b.iban}`,
    `Branch: ${[b.branch, b.city].filter(Boolean).join(', ')}`,
    ...(b.swift ? [`SWIFT: ${b.swift}`] : []),
    '',
    'Please mention your Invoice / Order No. in the payment reference.',
    'After payment, kindly share the transfer receipt. Thank you!',
    ...(phone ? ['', `Contact: ${phone}`] : [])
  ].join('\n');
}
