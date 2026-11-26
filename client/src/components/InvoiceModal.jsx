import React, { useState } from 'react';
import { Receipt } from 'lucide-react';
import DocumentEditorModal from './DocumentEditorModal';
import DocumentItemsEditor from './DocumentItemsEditor';
import InvoiceDocument from './InvoiceDocument';
import BuyerInvoiceDocument from './BuyerInvoiceDocument';
import BankInvoiceDocument from './BankInvoiceDocument';
import { getInvoiceMeta } from '../utils/invoice';

const money = (value) =>
  `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

const FIELDS = [
  { key: 'invoiceNo', label: 'Invoice #', placeholder: 'INV-001' },
  { key: 'invoiceDate', label: 'Invoice Date (issue ka din)', type: 'date', hint: 'Jis din invoice issue ho raha hai woh date khud set karein.' },
  {
    key: 'invoiceTerms',
    label: 'Payment Terms',
    placeholder: 'Payment due on receipt'
  },
  {
    key: 'invoiceBankDetails',
    label: 'Bank Details',
    type: 'textarea',
    rows: 3,
    placeholder: 'Bank name, account title, IBAN...'
  },
  {
    key: 'invoiceNotes',
    label: 'Notes',
    type: 'textarea',
    rows: 3,
    placeholder: 'e.g. Goods once sold are not returnable'
  }
];

const buildDefaults = (order) => {
  const meta = getInvoiceMeta(order);
  return {
    invoiceNo: meta.no,
    invoiceDate: meta.date,
    invoiceTerms: meta.terms,
    invoiceBankDetails: meta.bankDetails,
    invoiceNotes: order?.invoiceNotes || '',
    ...(order?.isStandalone
      ? {
          customer: order.customer || '',
          orderNumber: order.orderNumber || '',
          invoiceReceived: order.invoiceReceived ?? '',
          items: order.items || [],
          totalAmount: order.totalAmount || 0,
          totalPieces: order.totalPieces || 0
        }
      : {})
  };
};

function InvoicePreview({ order, company, layout }) {
  if (layout !== 'landscape-2up') {
    return <InvoiceDocument order={order} company={company} />;
  }

  return (
    <div
      className="bg-white shadow-2xl rounded-sm border border-slate-400 p-2"
      style={{ aspectRatio: '297 / 210' }}
    >
      <div className="grid grid-cols-2 h-full">
        {[0, 1].map(index => (
          <div
            key={index}
            className={`overflow-hidden h-full ${index === 0 ? 'border-r border-dashed border-slate-400 pr-1' : 'pl-1'}`}
          >
            <div style={{ width: '200%', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
              <InvoiceDocument order={order} company={company} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InvoiceModal(props) {
  const invoice = getInvoiceMeta(props.order);
  const isStandalone = Boolean(props.order?.isStandalone);
  const [layout, setLayout] = useState('form');
  const [format, setFormat] = useState('form');

  const PreviewForFormat = (previewProps) => {
    if (format === 'buyer') return <BuyerInvoiceDocument {...previewProps} />;
    if (format === 'bank') return <BankInvoiceDocument {...previewProps} />;
    return <InvoicePreview {...previewProps} layout={layout} />;
  };

  const fields = isStandalone
    ? [
        { key: 'customer', section: 'Standalone Document', label: 'Customer / Buyer', placeholder: 'Walk-in Customer' },
        { key: 'orderNumber', section: 'Standalone Document', label: 'Order / Reference #', placeholder: 'MANUAL-001' },
        ...FIELDS,
        { key: 'invoiceReceived', label: 'Amount Received (optional)', type: 'number', placeholder: '0.00' }
      ]
    : FIELDS;

  return (
    <DocumentEditorModal
      {...props}
      title="Commercial Invoice"
      subtitle={`${invoice.paymentStatus} • Balance ${money(invoice.balance)}`}
      icon={Receipt}
      fields={fields}
      buildDefaults={buildDefaults}
      Preview={PreviewForFormat}
      pdfEndpoint="/export/pdf/invoice"
      docxEndpoint="/export/docx/invoice"
      pdfQuery={format === 'form' ? `format=form&layout=${layout}` : `format=${format}`}
      pdfLayout={layout}
      pdfLayoutOptions={format === 'form' ? [
        { value: 'form', label: '1 per page', hint: 'A4 portrait — single invoice' },
        { value: 'landscape-2up', label: '2 per page', hint: 'A4 landscape — do chhoti copies ek paper par' }
      ] : []}
      onPdfLayoutChange={setLayout}
      format={format}
      onFormatChange={setFormat}
      formatOptions={[
        { value: 'form', label: 'Our Format', hint: 'Butt Collection commercial invoice' },
        { value: 'buyer', label: 'Buyer Invoice', hint: 'Madina Gloves style buyer commercial invoice' },
        { value: 'bank', label: 'Bank Invoice', hint: 'AQA style bank commercial invoice' }
      ]}
      formatHint={
        format === 'buyer'
          ? 'Buyer invoice: consignee/notify boxes, shipping marks table, statement on origin. Word export sirf Our Format mein milta hai.'
          : format === 'bank'
            ? 'Bank invoice: PO/style/carton grid, say value, bank account details aur export manager signature. Word export sirf Our Format mein milta hai.'
            : 'Our format: Butt Collection commercial invoice. Buyer ya bank ki apni invoice chahiye to upar se format chunein.'
      }
      summaryText={`Total ${money(invoice.total)} • Received ${money(invoice.received)} • Balance ${money(invoice.balance)}`}
      helpText={
        isStandalone
          ? 'Yeh invoice order ke baghair bani hai. Party, items, rate aur received amount yahan se edit karein. Print Layout se ek page par do chhoti copies bhi nikal sakte hain (12 items tak).'
          : 'Amounts Payment Ledger se auto aate hain. Wasool entry karne se invoice update ho jata hai. Print Layout se ek page par do chhoti copies bhi nikal sakte hain (12 items tak).'
      }
      renderExtra={isStandalone ? ({ form, update }) => (
        <DocumentItemsEditor
          mode="invoice"
          items={form.items}
          onChange={items => {
            const total = items.reduce(
              (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0),
              0
            );
            update('items', items);
            update('totalAmount', total);
            update('totalPieces', items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0));
          }}
        />
      ) : undefined}
    />
  );
}
