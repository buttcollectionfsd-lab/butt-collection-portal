const FACTORY_ADDRESS = 'Ayub Colony, Fsd, Nazamabad Street No 9, Center Mill Road';

function getCompanyAddress(company) {
  return String(company?.address || FACTORY_ADDRESS).trim();
}

module.exports = {
  FACTORY_ADDRESS,
  getCompanyAddress
};
