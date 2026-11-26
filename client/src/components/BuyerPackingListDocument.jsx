import React from 'react';
import { buildPackingBlocks, packingDateOf, getInvoiceDetails } from '../utils/buyerFormats';

const pct = (value, total) => `${(value / total) * 100}%`;

const styleCodeOf = (style) => {
  const text = String(style || '').trim().toUpperCase();
  return text
    .replace(/\s+\d+\s*GSM$/i, '')
    .replace(/\s+(SET|SUIT|PCS)$/i, '')
    .trim() || text || 'STYLE';
};

/**
 * AQA-style packing / weight list:
 * letterhead + order meta, then one table per carton mix (30 pcs per carton)
 * with size grid, per-colour pcs and carton / total columns.
 */
export default function BuyerPackingListDocument({ order, company }) {
  const { blocks, totalCartons, totalPieces } = buildPackingBlocks(order);
  const details = getInvoiceDetails(order, company);
  const seller = details.seller;
  const city = String(company?.city || 'Faisalabad').trim().toUpperCase();
  const country = String(company?.country || 'Pakistan').trim().toUpperCase();
  const customer = order?.customer || order?.invoiceConsignee || '-';
  const poNumber = order?.orderNumber || '-';

  const gross = Number(order?.packingGrossWeight) > 0
    ? Number(order.packingGrossWeight) * totalCartons
    : (Number(order?.invoiceGrossWeight) || 0);
  const net = Number(order?.packingNetWeight) > 0
    ? Number(order.packingNetWeight) * totalCartons
    : (Number(order?.invoiceNetWeight) || 0);

  const notes = [
    order?.packingSizeNote1,
    order?.packingSizeNote2
  ].map(note => String(note || '').trim()).filter(Boolean);
  if (!notes.length) {
    const l = Number(order?.packingCartonLength) > 0 ? order.packingCartonLength : '__';
    const w = Number(order?.packingCartonWidth) > 0 ? order.packingCartonWidth : '__';
    const h = Number(order?.packingCartonHeight) > 0 ? order.packingCartonHeight : '__';
    notes.push(`CARTON SIZE (L-${l} ,W-${w} ,H-${h} )   ${totalCartons} CARTONS`);
  }

  const baseCols = [26, 16, 24, 28, 40, 44, 96, 56];
  const tailCols = [30, 32, 32];
  const mixBlock = blocks.find(block => block.rows.length > 1);

  return (
    <div className="bg-white shadow-2xl rounded-sm border-2 border-slate-900 p-4 text-[9px] leading-tight text-slate-900">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-wide">{seller.name}</h1>
        <p className="text-[8px] font-bold mt-0.5">{seller.tagline.toUpperCase()}</p>
        <p className="text-[8px] font-bold mt-0.5">{city} - {country}</p>
        <div className="border-t-[1.5px] border-slate-900 mt-1.5" />
        <div className="border-t border-slate-900 mt-0.5" />
      </div>

      <table className="w-full border-collapse mt-2">
        <tbody>
          {[
            ['ORDER #', poNumber],
            ['CUSTOMER', customer],
            ['DATED', packingDateOf(order)],
            ['TOTAL CARTONS', String(totalCartons)],
            ['TOTAL PCS', String(totalPieces)]
          ].map(([label, value]) => (
            <tr key={label}>
              <td className="border border-slate-900 px-2 py-[2px] font-bold w-[30%]">{label}</td>
              <td className="border border-slate-900 px-2 py-[2px] font-bold">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bg-[#DCE6F1] border border-slate-900 text-center font-extrabold text-[15px] tracking-[0.16em] py-1 mt-1.5">
        PACKING / WEIGHT LIST
      </div>

      {blocks.map((block, blockIndex) => {
        const sizeKeys = block.sizeKeys.length ? block.sizeKeys : ['xs', 's', 'm', 'l', 'xl'];
        const cols = [...baseCols, ...sizeKeys.map(() => 26), ...tailCols];
        const total = cols.reduce((sum, value) => sum + value, 0);
        const styleCode = styleCodeOf(block.style);
        const productName = block.gsmLabel
          ? `${String(block.style).trim().toUpperCase()} (${block.gsmLabel})`
          : String(block.style).trim().toUpperCase();
        return (
          <table key={block.key || blockIndex} className="w-full border-collapse table-fixed mt-2 text-[8px]">
            <colgroup>
              {cols.map((value, index) => <col key={index} style={{ width: pct(value, total) }} />)}
            </colgroup>
            <thead className="font-bold text-center">
              <tr>
                <th rowSpan={2} className="border border-slate-900 py-[2px]">Ctn.<br />No.</th>
                <th rowSpan={2} className="border border-slate-900 py-[2px]">TO</th>
                <th rowSpan={2} className="border border-slate-900 py-[2px]">Ctn.<br />No.</th>
                <th rowSpan={2} className="border border-slate-900 py-[2px]">Total<br />Ctns.</th>
                <th rowSpan={2} className="border border-slate-900 py-[2px]">STYLE NO</th>
                <th rowSpan={2} className="border border-slate-900 py-[2px]">PO NUMBER</th>
                <th rowSpan={2} className="border border-slate-900 py-[2px]">PRODUCT NAME</th>
                <th className="border border-slate-900 py-[1px]">BODY</th>
                <th colSpan={sizeKeys.length} className="border border-slate-900" />
                <th rowSpan={2} className="border border-slate-900 py-[2px]">Pcs /<br />Colour</th>
                <th rowSpan={2} className="border border-slate-900 py-[2px]">Total Pcs<br />/ Carton</th>
                <th rowSpan={2} className="border border-slate-900 py-[2px]">Total PCS</th>
              </tr>
              <tr>
                <th className="border border-slate-900 py-[1px]">COLOR</th>
                {sizeKeys.map(size => (
                  <th key={size} className="border border-slate-900 bg-slate-900 text-white py-[2px] uppercase">{size}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-center">
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {rowIndex === 0 && (
                    <>
                      <td rowSpan={block.rows.length} className="border border-slate-900 align-middle">{block.start}</td>
                      <td rowSpan={block.rows.length} className="border border-slate-900 align-middle">TO</td>
                      <td rowSpan={block.rows.length} className="border border-slate-900 align-middle">{block.end}</td>
                      <td rowSpan={block.rows.length} className="border border-slate-900 align-middle font-bold">{block.cartons}</td>
                      <td rowSpan={block.rows.length} className="border border-slate-900 align-middle px-1">{styleCode}</td>
                      <td rowSpan={block.rows.length} className="border border-slate-900 align-middle px-1">{poNumber}</td>
                      <td rowSpan={block.rows.length} className="border border-slate-900 align-middle px-1">{productName}</td>
                    </>
                  )}
                  <td className="border border-slate-900 align-middle px-1 font-bold">{row.color}</td>
                  {sizeKeys.map(size => (
                    <td key={size} className="border border-slate-900 align-middle">{row.sizes[size] || 0}</td>
                  ))}
                  {rowIndex === 0 && (
                    <td rowSpan={block.rows.length} className="border border-slate-900 align-middle">{block.perCartonTotal}</td>
                  )}
                  <td className="border border-slate-900 align-middle">{row.pcsPerCarton}</td>
                  <td className="border border-slate-900 align-middle">{row.totalPcs}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-bold text-center">
              <tr>
                <td colSpan={3} className="border border-slate-900 py-[2px]">TOTAL</td>
                <td className="border border-slate-900 py-[2px]">{block.cartons}</td>
                <td colSpan={2} className="border border-slate-900 py-[2px]" />
                <td className="border border-slate-900 py-[2px]">.</td>
                <td className="border border-slate-900 py-[2px]" />
                <td colSpan={sizeKeys.length + 2} className="border border-slate-900 py-[2px]" />
                <td className="border border-slate-900 py-[2px]">{block.qty}</td>
              </tr>
            </tfoot>
          </table>
        );
      })}

      <div className="flex items-start justify-between gap-4 mt-3">
        <div className="space-y-0.5 font-bold text-[10px]">
          <div className="grid grid-cols-[110px_80px]"><span>TOTAL CARTON</span><span>{totalCartons}</span></div>
          <div className="grid grid-cols-[110px_80px]"><span>TOTAL PCS</span><span>{totalPieces}</span></div>
          <div className="grid grid-cols-[110px_80px]"><span>GROSS WEIGHT</span><span>{gross ? `${Number(gross.toFixed(1))} KGS` : '- KGS'}</span></div>
          <div className="grid grid-cols-[110px_80px]"><span>NET WEIGHT</span><span>{net ? `${Number(net.toFixed(1))} KGS` : '- KGS'}</span></div>
        </div>
        {notes.length > 0 && (
          <div className="space-y-1 text-[8px] font-bold">
            {notes.slice(0, 2).map((note, index) => (
              <div key={index} className="bg-yellow-300 border border-yellow-400 px-2 py-1 text-center">{note}</div>
            ))}
          </div>
        )}
      </div>

      {mixBlock && (
        <p className="mt-3 text-[7px] text-slate-700">
          Cartons are assorted: every carton holds {mixBlock.rows[0]?.pcsPerCarton || 0} pcs of each colour ({mixBlock.perCartonTotal} pcs).
          Size mix per carton is shown in each block above.
        </p>
      )}
    </div>
  );
}
