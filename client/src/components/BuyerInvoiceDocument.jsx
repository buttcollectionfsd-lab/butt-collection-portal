import React from 'react';
import {
  buildInvoiceRows,
  formatDate,
  getInvoiceDetails,
  itemTotals,
  money
} from '../utils/buyerFormats';

/**
 * Buyer-style commercial invoice (MG format):
 * rounded consignee / notify boxes, yellow bank highlight,
 * shipping-marks table, statement on origin.
 */
export default function BuyerInvoiceDocument({ order, company }) {
  const details = getInvoiceDetails(order, company);
  const seller = details.seller;
  const rows = buildInvoiceRows(order);
  const totals = itemTotals(order);
  const grandTotal = totals.amount || Number(order?.totalAmount) || 0;

  const metaRows = [
    ['INVOICE NO', details.invoiceNo, false],
    ['DATE', formatDate(details.invoiceDate), false],
    ['SHIPMENT FROM', details.shipFrom, false],
    ['SHIPMENT TO', details.shipTo, false],
    ['BY SEA / AIR', details.transport, false],
    ['AWB / B.L', details.awbBl, false],
    ['BANK NAME', details.bankName, true],
    ['F.I NUMBER', details.fiNo, true],
    ['DELIVERY TERM', details.deliveryTerm, false],
    ['PAYMENT', details.paymentCurrency, false],
    ['TERM OF SHIPMENT', details.termOfShipment, false],
    ['GROSS WEIGHT', details.grossWeight ? `${details.grossWeight.toFixed(2)} KGS.` : '', false],
    ['NET WEIGHT', details.netWeight ? `${details.netWeight.toFixed(2)} KGS.` : '', false]
  ];

  const statement = details.originStatement ||
    `The Exporter ${seller.name} [REX NO. ${details.rexNo || '________'}] of the product covered by this document declares that, except where otherwise clearly indicated, these products are of Pakistan preferential origin according to rules of the Generalized System of Preferences of the United Kingdom and that the origin criterion met is ${details.hsCode || '________'}.`;

  const groups = [];
  rows.forEach(row => {
    const last = groups[groups.length - 1];
    if (last && last.key === row.groupKey) {
      last.rows.push(row);
      last.cartons = row.cartons;
    } else {
      groups.push({ key: row.groupKey, rows: [row], cartons: row.cartons });
    }
  });

  return (
    <div className="bg-white shadow-2xl rounded-sm border border-slate-400 p-4 text-[9px] leading-tight text-slate-900">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-wide">{seller.name}</h1>
        <p className="text-[8px] font-bold mt-0.5">{seller.tagline.toUpperCase()}</p>
        <p className="text-[8px] font-bold italic mt-0.5">
          {seller.address}
          {seller.phone ? `, Phone: ${seller.phone}` : ''}
        </p>
        <div className="border-t-[1.5px] border-slate-900 mt-1.5" />
      </div>

      <div className="text-center mt-2">
        <span className="text-[11px] font-bold border-b border-slate-900 pb-0.5">COMMERCIAL INVOICE</span>
      </div>

      <div className="grid grid-cols-[45%_1fr] gap-3 mt-3">
        <div className="space-y-2">
          {[
            ['CONSIGNEE:', details.consignee, details.consigneeAddress],
            ['NOTIFY :', details.notify, details.notifyAddress]
          ].map(([label, name, address]) => (
            <div key={label} className="border border-slate-800 rounded-lg px-2 py-1.5 min-h-[52px]">
              <p className="font-bold text-[8px]">{label}</p>
              <p className="font-bold mt-0.5 leading-snug">{name}</p>
              <p className="text-[8px] leading-snug whitespace-pre-line">{address}</p>
            </div>
          ))}
        </div>

        <table className="w-full border-collapse self-start text-[8px]">
          <tbody>
            {metaRows.map(([label, value, highlight]) => (
              <tr key={label}>
                <td className="py-[2px] font-bold w-[38%] align-middle">{label}</td>
                <td className="py-[2px]">
                  <div className={`border-b border-slate-700 pb-[2px] font-bold ${highlight ? 'bg-yellow-300' : ''}`}>
                    {value || ''}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <table className="w-full border-collapse table-fixed mt-3 text-[8px]">
        <colgroup>
          <col style={{ width: '9%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '33%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr className="font-bold text-center bg-slate-50">
            <th className="border border-slate-800 py-[2px]">SHIPPING<br />MARKS</th>
            <th className="border border-slate-800 py-[2px]">STYLE #</th>
            <th className="border border-slate-800 py-[2px]">ORDER #</th>
            <th className="border border-slate-800 py-[2px]">PRODUCT NAME</th>
            <th className="border border-slate-800 py-[2px]">CARTON</th>
            <th className="border border-slate-800 py-[2px]">QUANTITY</th>
            <th className="border border-slate-800 py-[2px]">UNIT PRICE</th>
            <th className="border border-slate-800 py-[2px]">TOTAL VALUE</th>
          </tr>
          <tr className="font-bold text-center bg-slate-50 text-[7px]">
            <td className="border border-slate-800 py-[1px]">ORDER NO.</td>
            <td className="border-0" colSpan={7} />
          </tr>
        </thead>
        <tbody>
          {groups.map((group, groupIndex) => (
            group.rows.map((row, rowIndex) => (
              <tr key={`${groupIndex}-${rowIndex}`}>
                {rowIndex === 0 && (
                  <>
                    <td rowSpan={group.rows.length} className="border border-slate-800 text-center align-middle px-1">{row.po}</td>
                    <td rowSpan={group.rows.length} className="border border-slate-800 text-center align-middle px-1">
                      {order?.manufacturer || 'Butt Collection'}
                    </td>
                    <td rowSpan={group.rows.length} className="border border-slate-800 text-center align-middle px-1">{row.po}</td>
                    <td rowSpan={group.rows.length} className="border border-slate-800 px-1 align-middle">{row.product}</td>
                    <td rowSpan={group.rows.length} className="border border-slate-800 text-center align-middle">{group.cartons}</td>
                  </>
                )}
                <td className="border border-slate-800 text-center">{row.qty}</td>
                <td className="border border-slate-800 text-right px-1">{money(row.rate)}</td>
                <td className="border border-slate-800 text-right px-1">{money(row.amount)}</td>
              </tr>
            ))
          ))}
        </tbody>
        <tfoot className="font-bold bg-slate-100">
          <tr>
            <td colSpan={4} className="border border-slate-800 py-[3px] text-right pr-2">TOTAL:</td>
            <td colSpan={2} className="border border-slate-800 py-[3px] text-center">
              {totals.cartons} CTNS&nbsp;&nbsp;{totals.qty} SET
            </td>
            <td className="border border-slate-800 py-[3px]" />
            <td className="border border-slate-800 py-[3px] text-right pr-1">{money(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-3">
        <span className="inline-block border border-slate-800 border-b-0 px-3 py-[2px] text-[8px] font-bold">
          Statement on Origin
        </span>
        <div className="border border-slate-800 px-2 py-1.5 text-[8px] leading-snug">{statement}</div>
      </div>

      <div className="mt-2">
        <p className="font-bold text-[8px]">NATIONAL TAX #</p>
        <p className="font-bold italic text-[8px]">IT IS CERTIFIED THAT THE GOODS ARE OF PAKISTAN ORIGIN</p>
      </div>
    </div>
  );
}
