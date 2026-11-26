export const FACTORY_ADDRESS = 'Ayub Colony, Fsd, Street No 9, Center Mill Road';

export function getCompanyAddress(company) {
  return String(company?.address || FACTORY_ADDRESS).trim();
}
