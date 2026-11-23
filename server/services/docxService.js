/**
 * Microsoft Word (.docx) Export Service using 'docx' library
 * Generates official Merchandiser Work Orders, Packing Lists & Factory Dispatch Notes
 */
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType
} = require('docx');

async function generateOrderDocx(order, company) {
  const tableRows = [
    // Header Row
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Style / Item", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
          width: { size: 35, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "GSM", bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
          shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
          width: { size: 12, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Color", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
          width: { size: 18, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Qty (Pcs)", bold: true, color: "FFFFFF" })], alignment: AlignmentType.RIGHT })],
          shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
          width: { size: 15, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Rate (£)", bold: true, color: "FFFFFF" })], alignment: AlignmentType.RIGHT })],
          shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
          width: { size: 10, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Amount (£)", bold: true, color: "FFFFFF" })], alignment: AlignmentType.RIGHT })],
          shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
          width: { size: 10, type: WidthType.PERCENTAGE }
        })
      ]
    })
  ];

  let totalQty = 0;
  let totalAmount = 0;
  (order.items || []).forEach((item, index) => {
    const isEven = index % 2 === 0;
    const bgFill = isEven ? "F8FAFC" : "FFFFFF";
    totalQty += Number(item.qty) || 0;
    totalAmount += Number(item.amount) || 0;

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: item.style || '', bold: true })] })],
            shading: { fill: bgFill, type: ShadingType.CLEAR }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun(item.gsm || '-')], alignment: AlignmentType.CENTER })],
            shading: { fill: bgFill, type: ShadingType.CLEAR }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun(item.color || 'Assorted')] })],
            shading: { fill: bgFill, type: ShadingType.CLEAR }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun(String(item.qty || 0))], alignment: AlignmentType.RIGHT })],
            shading: { fill: bgFill, type: ShadingType.CLEAR }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun(`£${Number(item.rate || 0).toFixed(2)}`)], alignment: AlignmentType.RIGHT })],
            shading: { fill: bgFill, type: ShadingType.CLEAR }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun(`£${Number(item.amount || 0).toFixed(2)}`)], alignment: AlignmentType.RIGHT })],
            shading: { fill: bgFill, type: ShadingType.CLEAR }
          })
        ]
      })
    );
  });

  // Total summary row
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "TOTAL ORDER SUMMARY:", bold: true })] })],
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          columnSpan: 3
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(totalQty), bold: true })], alignment: AlignmentType.RIGHT })],
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "-" })], alignment: AlignmentType.CENTER })],
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `£${totalAmount.toFixed(2)}`, bold: true })], alignment: AlignmentType.RIGHT })],
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR }
        })
      ]
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header Company Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: company?.name || "BUTT COLLECTION",
                bold: true,
                size: 32,
                color: "1E3A8A"
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${company?.tagline || 'Garment Manufacturing & Merchandising'} | Faisalabad, Pakistan`,
                size: 20,
                color: "64748B"
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "MERCHANDISER PRODUCTION WORK ORDER",
                bold: true,
                size: 24,
                color: "0F172A"
              })
            ]
          }),

          // Order Meta Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Order Number: ", bold: true }),
                          new TextRun(order.orderNumber),
                          new TextRun("\nCustomer: "),
                          new TextRun({ text: order.customer, bold: true }),
                          new TextRun("\nManufacturer: "),
                          new TextRun(order.manufacturer || "Butt Collection"),
                          new TextRun("\nDispatch Location: "),
                          new TextRun(order.dispatchCity || "Faisalabad")
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Order Date: ", bold: true }),
                          new TextRun(order.orderDate || "N/A"),
                          new TextRun("\nDelivery Deadline: "),
                          new TextRun({ text: order.deadline || "N/A", bold: true }),
                          new TextRun("\nStatus: "),
                          new TextRun({ text: order.status, bold: true, color: order.status === "Shipped" ? "16A34A" : "D97706" }),
                          new TextRun("\nShipped On: "),
                          new TextRun(order.shippedOn || "-")
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Items Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          }),

          new Paragraph({ text: "", spacing: { after: 250 } }),

          // Financial Ledger Box
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
              new TextRun({
                text: "PAYMENT & ACCOUNT DETAILS (WASOOL / BAKAYA):",
                bold: true,
                color: "1E3A8A"
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Total Billed Amount: £${Number(order.totalAmount || totalAmount).toFixed(2)}\n`, bold: true }),
              new TextRun({ text: `• Amount Received (Wasool): £${Number(order.amountReceived || 0).toFixed(2)}\n`, color: "16A34A" }),
              new TextRun({ text: `• Current Balance Due (Bakaya): £${Number(order.balance || (totalAmount - (order.amountReceived || 0))).toFixed(2)}\n`, bold: true, color: "DC2626" }),
              new TextRun({ text: `• Merchandiser Notes: ${order.notes || "None"}\n`, italic: true })
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Signature Block
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" } },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Prepared by Merchandiser", size: 18, color: "64748B" })]
                      })
                    ]
                  }),
                  new TableCell({
                    borders: { top: { style: BorderStyle.NONE } },
                    children: [new Paragraph({ text: "" })]
                  }),
                  new TableCell({
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" } },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Factory Authorized Sign & Stamp", size: 18, color: "64748B" })]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

module.exports = {
  generateOrderDocx
};
