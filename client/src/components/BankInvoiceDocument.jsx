import React from 'react';
import {
  buildInvoiceRows,
  formatDate,
  getInvoiceDetails,
  itemTotals,
  money
} from '../utils/buyerFormats';

const poundsInWords = (value) => {
  const total = Math.max(0, Math.floor(Number(value) || 0));
  if (!total) return 'ZERO';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const under = (n) => {
    const parts = [];
    if (n >= 100) {
      parts.push(`${ones[Math.floor(n / 100)]} HUNDRED`);
      n %= 100;
    }
    if (n >= 20) parts.push(`${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`);
    else if (n > 0) parts.push(ones[n]);
    return parts.join(' ');
  };
  const parts = [];
  const million = Math.floor(total / 1e6);
  const thousand = Math.floor((total % 1e6) / 1e3);
  const rest = total % 1e3;
  if (million) parts.push(`${under(million)} MILLION`);
  if (thousand) parts.push(`${under(thousand)} THOUSAND`);
  if (rest) parts.push(under(rest));
  return parts.join(' ').trim();
};

/**
 * Bank-style commercial invoice (AQA Apparel format):
 * gradient letterhead, PO/style/carton grid, bank account box.
 */
export default function BankInvoiceDocument({ order, company }) {
  const details = getInvoiceDetails(order, company);
  const seller = details.seller;
  const rows = buildInvoiceRows(order);
  const totals = itemTotals(order);
  const grandTotal = totals.amount || Number(order?.totalAmount) || 0;

  const metaRows = [
    ['INVOICE NO.', details.invoiceNo],
    ['INVOICE DATE:', formatDate(details.invoiceDate)],
    ['CONTRACT NO.', details.contractNo],
    ['DELIVERY TERMS.', details.deliveryTerm],
    ['SHIPMENT FROM.', details.shipFrom],
    ['SHIPMENT TO.', details.shipTo],
    ['INCOTERMS.', details.incoterms],
    ['PAYMENT TERMS.', details.paymentTerms],
    ['L/C#', details.lcNo],
    ['L/C DATE:', details.lcDate],
    ['F.I#', details.fiNo],
    ['PRODUCT:', details.productDesc || rows[0]?.style || '']
  ];

  const parties = [
    ['SHIPPER / EXPORTER', seller.name, seller.address],
    ['CONSIGNEE / IMPORTER', details.consignee, details.consigneeAddress],
    ['NOTIFY', details.notify, details.notifyAddress]
  ];

  const bankRows = [
    ['ACCOUNT TITLE:', details.bankAccountTitle],
    ['BANK NAME:', details.bankName],
    ['ADDRESS:', details.bankAddress],
    ['A/C#', details.bankAccountNo],
    ['IBAN#', details.bankIban],
    ['SWIFT CODE:', details.bankSwift]
  ];

  return (
    <div className="bg-white shadow-2xl rounded-sm border border-slate-400 p-4 text-[8px] leading-tight text-slate-900">
      <div className="bg-gradient-to-r from-[#B8CBD9] via-[#7FA2BA] to-[#2E5B74] text-white px-3 py-1.5 text-right">
        <span className="text-lg font-extrabold tracking-wide">{seller.name}</span>
      </div>
      <div className="border border-slate-800 text-center font-semibold py-[3px]">
        {seller.address}
        {seller.phone ? `, Phone: ${seller.phone}` : ''}
      </div>
      <div className="bg-[#DCE6F1] border border-slate-800 text-center font-extrabold text-[12px] tracking-[0.2em] py-[5px] mt-[3px]">
        COMMERCIAL INVOICE
      </div>

      <div className="grid grid-cols-[43%_1fr] gap-2 mt-2">
        <div>
          {parties.map(([label, name, address]) => (
            <div key={label}>
              <div className="bg-slate-100 border border-slate-800 font-bold px-1 py-[2px]">{label}</div>
              <div className="px-1 py-[3px]">
                <p className="font-bold">{name}</p>
                <p className="text-[7.5px] whitespace-pre-line">{address}</p>
              </div>
            </div>
          ))}
        </div>

        <table className="w-full border-collapse self-start text-[7.5px]">
          <tbody>
            {metaRows.map(([label, value]) => (
              <tr key={label}>
                <td className="bg-slate-50 border border-slate-400 font-bold px-1 py-[2px] w-[38%]">{label}</td>
                <td className="border border-slate-400 px-1 py-[2px]">{value || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <table className="w-full border-collapse table-fixed mt-2 text-[7px]">
        <colgroup>
          <col style={{ width: '5%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '8%' }} />
        </colgroup>
        <thead>
          <tr className="bg-slate-100 font-bold text-center">
            <th className="border border-slate-800 py-[2px]" colSpan={2}>MARKS &amp; NOS.</th>
            <th className="border border-slate-800 py-[2px]" />
            <th className="border border-slate-800 py-[2px]">COMPOSITION</th>
            <th className="border border-slate-800 py-[2px]">COLOR</th>
            <th className="border border-slate-800 py-[2px]">LINE</th>
            <th className="border border-slate-800 py-[2px]">DESCRIPTION</th>
            <th className="border border-slate-800 py-[2px]">H.S.CODE</th>
            <th className="border border-slate-800 py-[2px]">CTNS</th>
            <th className="border border-slate-800 py-[2px]">QTY</th>
            <th className="border border-slate-800 py-[2px]">UNIT</th>
            <th className="border border-slate-800 py-[2px]">GBP / PCS</th>
            <th className="border border-slate-800 py-[2px]">VALUE C&amp;F-GBP</th>
          </tr>
          <tr className="bg-slate-100 font-bold text-center text-[6.5px]">
            <td className="border border-slate-800 py-[1px]">PO#</td>
            <td className="border border-slate-800 py-[1px]">STYLE#</td>
            <td className="border border-slate-800 py-[1px]">CTN #</td>
            <td colSpan={10} className="border-0" />
          </tr>
        </thead>
        <tbody className="text-center">
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="border border-slate-800 px-0.5 align-middle">{row.po}</td>
              <td className="border border-slate-800 px-0.5 align-middle">{row.style}</td>
              <td className="border border-slate-800 align-middle">{row.cartonRange}</td>
              <td className="border border-slate-800 px-0.5 align-middle">{row.composition || details.composition}</td>
              <td className="border border-slate-800 px-0.5 align-middle">{row.color}</td>
              <td className="border border-slate-800 px-0.5 align-middle">{row.line || details.line}</td>
              <td className="border border-slate-800 px-0.5 align-middle">{row.product}</td>
              <td className="border border-slate-800 align-middle">{row.hsCode || details.hsCode}</td>
              <td className="border border-slate-800 align-middle">{row.cartons || ''}</td>
              <td className="border border-slate-800 align-middle">{row.qty}</td>
              <td className="border border-slate-800 align-middle">{row.unit}</td>
              <td className="border border-slate-800 align-middle">{row.rate ? row.rate.toFixed(4) : ''}</td>
              <td className="border border-slate-800 px-0.5 align-middle text-right">{row.amount ? money(row.amount) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="font-bold text-center">
          <tr>
            <td colSpan={8} className="border border-slate-800 py-[2px]" />
            <td className="border border-slate-800 py-[2px]">{totals.cartons}</td>
            <td className="border border-slate-800 py-[2px]">{totals.qty}</td>
            <td colSpan={2} className="border border-slate-800 py-[2px]" />
            <td className="border border-slate-800 py-[2px] text-right pr-0.5">{money(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="text-right font-bold text-[7.5px] mt-[2px] pr-0.5">TOTAL NET PAYBLE AMOUNT&nbsp;&nbsp;&nbsp;{money(grandTotal)}</div>

      <div className="flex justify-between gap-2 mt-1 text-[7.5px] font-bold">
        <span>SAY VALUE : -</span>
        <span>TOTAL POUNDS STERLING {poundsInWords(grandTotal)} ONLY</span>
      </div>

      <div className="bg-slate-100 border border-slate-800 font-bold px-1 py-[2px] mt-1">
        HERE BY WE CERTIFY THAT THE GOODS ARE OF PAKISTAN ORIGIN
      </div>

      <table className="w-full border-collapse mt-[1px] text-[7.5px]">
        <tbody>
          <tr>
            <td className="border border-slate-800 font-bold px-1 py-[2px] w-[53%]">NET WEIGHT&nbsp;&nbsp;{details.netWeight ? `${details.netWeight.toFixed(0)} KGS` : ''}</td>
            <td className="border border-slate-800 font-bold px-1 py-[2px] w-[15%]">CBM</td>
            <td className="border border-slate-800 px-1 py-[2px]">{details.cbm ? details.cbm.toFixed(3) : ''}</td>
          </tr>
          <tr>
            <td className="border border-slate-800 font-bold px-1 py-[2px]">GROSS WEIGHT&nbsp;&nbsp;{details.grossWeight ? `${details.grossWeight.toFixed(0)} KGS` : ''}</td>
            <td className="border border-slate-800 font-bold px-1 py-[2px]">G.D#</td>
            <td className="border border-slate-800 px-1 py-[2px]">{details.gdNo}</td>
          </tr>
          <tr>
            <td className="border border-slate-800 font-bold px-1 py-[2px]">CONTAINER#&nbsp;&nbsp;{details.containerNo}</td>
            <td className="border border-slate-800 font-bold px-1 py-[2px]" colSpan={2}>SEAL#&nbsp;&nbsp;{details.sealNo}</td>
          </tr>
        </tbody>
      </table>

      <div className="bg-slate-100 border border-slate-800 font-bold px-1 py-[2px] mt-1">
        DCTS Declaration of Origin Statement
      </div>
      <div className="border border-slate-800 px-1.5 py-1 text-[7.5px] leading-snug">
        The exporter of the products covered by this document (Customs Identification No. {details.rexNo || '________'}) declares that, except where otherwise clearly indicated, these products are of (P) preferential origin in accordance with the rules of origin of the Developing Countries Trading Scheme of the UK and that the origin criterion met is P'({details.hsCode || '________'})
      </div>

      <div className="grid grid-cols-[68%_1fr] gap-3 mt-2">
        <div>
          <div className="bg-slate-100 border border-slate-800 font-bold px-1 py-[2px]">BANK ACCOUNT DETAILS.</div>
          <table className="w-full border-collapse text-[7.5px]">
            <tbody>
              {bankRows.map(([label, value]) => (
                <tr key={label}>
                  <td className="border border-slate-800 bg-slate-50 font-bold px-1 py-[2px] w-[32%]">{label}</td>
                  <td className="border border-slate-800 px-1 py-[2px]">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center self-end pb-1">
          <p className="font-bold text-[8px]">FOR {seller.name}</p>
          <div className="border-t border-slate-800 mt-8 mb-1" />
          <p className="font-bold text-[8px]">EXPORT MANAGER</p>
        </div>
      </div>
    </div>
  );
}
