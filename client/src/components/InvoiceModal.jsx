import React from 'react';
import { Receipt } from 'lucide-react';
import DocumentEditorModal from './DocumentEditorModal';
import InvoiceDocument from './InvoiceDocument';
import { getInvoiceMeta } from '../utils/invoice';

const money = (value) =>
  `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

const FIELDS = [
  { key: 'invoiceNo', label: 'Invoice #', placeholder: 'INV-001' },
  { key: 'invoiceDate', label: 'Invoice Date', type: 'date' },
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
    invoiceNotes: order?.invoiceNotes || ''
  };
};

export default function InvoiceModal(props) {
  const invoice = getInvoiceMeta(props.order);

  return (
    <DocumentEditorModal
      {...props}
      title="Commercial Invoice"
      subtitle={`${invoice.paymentStatus} • Balance ${money(invoice.balance)}`}
      icon={Receipt}
      fields={FIELDS}
      buildDefaults={buildDefaults}
      Preview={InvoiceDocument}
      pdfEndpoint="/export/pdf/invoice"
      docxEndpoint="/export/docx/invoice"
      summaryText={`Total ${money(invoice.total)} • Received ${money(invoice.received)} • Balance ${money(invoice.balance)}`}
      helpText="Amounts Payment Ledger se auto aate hain. Wasool entry karne se invoice update ho jata hai."
    />
  );
}
