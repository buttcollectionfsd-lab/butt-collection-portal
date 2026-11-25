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
const { getGatePassMeta } = require('../utils/gatePass');
const { getPackingTotals } = require('../utils/packingList');
const { getInvoiceMeta } = require('../utils/invoice');
const { getCompanyAddress } = require('../utils/companyInfo');

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
            children: [
              new TextRun({
                text: getCompanyAddress(company),
                size: 14,
                color: "64748B"
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: order.docStatus && order.docStatus.trim() ? 100 : 300 },
            children: [
              new TextRun({
                text: order.docTitle ?? "MERCHANDISER WORK ORDER",
                bold: true,
                size: 24,
                color: "0F172A"
              })
            ]
          }),
          ...(order.docStatus && order.docStatus.trim()
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 },
                  children: [
                    new TextRun({
                      text: order.docStatus.trim().toUpperCase(),
                      bold: true,
                      size: 20,
                      color: "DC2626"
                    })
                  ]
                })
              ]
            : []),

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
                        children: [new TextRun({ text: order.footerLeft ?? "Prepared by Merchandiser", size: 18, color: "64748B" })]
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
                        children: [new TextRun({ text: order.footerRight ?? "Authorized Signature / Factory", size: 18, color: "64748B" })]
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

/**
 * Editable Word version of the dispatch gate pass.
 */
async function generateGatePassDocx(order, company) {
  const meta = getGatePassMeta(order);

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const thin = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const medium = { style: BorderStyle.SINGLE, size: 14, color: '000000' };
  const allNo = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  const cell = (text, { width, bold = false, size = 18, align = AlignmentType.LEFT, borders = allNo, color = '000000', spacing = {} } = {}) => new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders,
    children: [new Paragraph({
      alignment: align,
      spacing: { before: 20, after: 20, ...spacing },
      children: [new TextRun({ text: text ?? '', bold, size, color })]
    })]
  });

  const companyName = String(meta.companyName || company?.name || 'BUTT COLLECTION').toUpperCase();
  const taglineParts = String(
    meta.companyTagline
      || `${company?.tagline || 'Quality Apparel Manufacturing & Export'} | ${company?.city || 'Faisalabad'}, ${company?.country || 'Pakistan'}`
  ).split('|').map(part => part.trim());
  const tagline = taglineParts[0] || '';
  const cityLine = taglineParts.slice(1).join(', ')
    || `${company?.city || 'Faisalabad'}, ${company?.country || 'Pakistan'}`;
  const companyAddress = meta.companyAddress || getCompanyAddress(company);

  // ---- Header: company block + GATE PASS box ----
  const gateBox = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: medium, bottom: thin, left: medium, right: medium },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 20, after: 20 },
              children: [new TextRun({ text: (meta.title || 'GATE PASS').toUpperCase(), bold: true, size: 22 })]
            })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: { top: noBorder, bottom: thin, left: medium, right: medium },
            children: [
              new Paragraph({
                spacing: { before: 20, after: 0 },
                children: [
                  new TextRun({ text: 'OUTWARD', bold: true, size: 18 }),
                  new TextRun({ text: '\t☒', size: 18 })
                ],
                tabStops: [{ type: 'right', position: 2500 }]
              }),
              new Paragraph({
                spacing: { before: 0, after: 20 },
                children: [
                  new TextRun({ text: 'RETURNABLE', bold: true, size: 18 }),
                  new TextRun({ text: '\t☐', size: 18 })
                ],
                tabStops: [{ type: 'right', position: 2500 }]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: { top: noBorder, bottom: medium, left: medium, right: medium },
            children: [new Paragraph({
              spacing: { before: 20, after: 20 },
              children: [
                new TextRun({ text: 'SR. NO.', bold: true, size: 18 }),
                new TextRun({ text: `\t${meta.no}`, size: 18, bold: true })
              ],
              tabStops: [{ type: 'right', position: 2500 }]
            })]
          })
        ]
      })
    ]
  });

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: allNo,
            width: { size: 63, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [new TextRun({ text: companyName, bold: true, size: 40 })]
              }),
              new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: tagline, size: 18 })] }),
              new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: cityLine, size: 18 })] }),
              new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: companyAddress, size: 13 })] })
            ]
          }),
          new TableCell({
            borders: allNo,
            width: { size: 37, type: WidthType.PERCENTAGE },
            children: [gateBox]
          })
        ]
      })
    ]
  });

  // Thick rule under the header
  const headerRule = new Paragraph({
    spacing: { before: 80, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 22, color: '000000' } },
    children: [new TextRun({ text: '' })]
  });

  // ---- Party / transport fields with underlines ----
  const fieldRow = (leftLabel, leftValue, rightLabel, rightValue) => new TableRow({
    children: [
      cell(leftLabel, { width: 13, bold: true, size: 18 }),
      new TableCell({
        width: { size: 37, type: WidthType.PERCENTAGE },
        borders: { top: noBorder, bottom: thin, left: noBorder, right: noBorder },
        children: [new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text: leftValue || '', bold: true, size: 18 })]
        })]
      }),
      cell(rightLabel, { width: 16, bold: true, size: 18 }),
      new TableCell({
        width: { size: 34, type: WidthType.PERCENTAGE },
        borders: { top: noBorder, bottom: thin, left: noBorder, right: noBorder },
        children: [new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text: rightValue || '', bold: true, size: 18 })]
        })]
      })
    ]
  });

  const fieldsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      fieldRow('Party Name:', meta.customer, 'Date:', meta.date),
      fieldRow('Through Mr.:', meta.through, 'Vehicle #:', meta.vehicleNo),
      fieldRow('Driver Name:', meta.driverName, 'Driver Cell No.:', meta.driverCell)
    ]
  });

  // ---- 12-row dispatch table ----
  const colWidths = [6, 50, 11, 14, 19];

  const headerCell = (text, index) => new TableCell({
    width: { size: colWidths[index], type: WidthType.PERCENTAGE },
    borders: {
      top: medium,
      bottom: medium,
      left: index === 0 ? medium : thin,
      right: index === 4 ? medium : thin
    },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 30, after: 30 },
      children: [new TextRun({ text, bold: true, size: 18 })]
    })]
  });

  const itemRows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('SR', 0),
        headerCell('DESCRIPTION', 1),
        headerCell('UNIT', 2),
        headerCell('QUANTITY', 3),
        headerCell('REMARKS', 4)
      ]
    })
  ];

  const items = Array.isArray(meta.items) ? meta.items : [];
  const rowCount = Math.max(12, items.length);

  for (let index = 0; index < rowCount; index += 1) {
    const item = items[index];
    const description = item
      ? [
        item.style || '',
        item.gsm && !String(item.style || '').includes(String(item.gsm)) ? `${item.gsm} GSM` : '',
        item.color || ''
      ].filter(Boolean).join(' - ')
      : '';
    const remarks = item
      ? [
        Number(item.cartons) ? `${Number(item.cartons)} CTN` : '',
        item.remarks || ''
      ].filter(Boolean).join(' | ')
      : '';

    const bodyCell = (text, colIndex, alignment = AlignmentType.LEFT, bold = false, size = 16) => new TableCell({
      width: { size: colWidths[colIndex], type: WidthType.PERCENTAGE },
      borders: {
        top: noBorder,
        bottom: index === rowCount - 1 ? medium : thin,
        left: colIndex === 0 ? medium : thin,
        right: colIndex === 4 ? medium : thin
      },
      children: [new Paragraph({
        alignment,
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, bold, size })]
      })]
    });

    itemRows.push(new TableRow({
      children: [
        bodyCell(String(index + 1), 0, AlignmentType.CENTER),
        bodyCell(description, 1),
        bodyCell(item ? 'PCS' : '', 2, AlignmentType.CENTER),
        bodyCell(item ? Number(item.qty || 0).toLocaleString() : '', 3, AlignmentType.RIGHT, true),
        bodyCell(remarks, 4, AlignmentType.LEFT, false, 14)
      ]
    }));
  }

  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  itemRows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: { top: medium, bottom: medium, left: medium, right: thin },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: 'Total', bold: true, size: 20 })]
        })]
      }),
      new TableCell({
        width: { size: colWidths[3], type: WidthType.PERCENTAGE },
        borders: { top: medium, bottom: medium, left: thin, right: thin },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: totalQty.toLocaleString(), bold: true, size: 18 })]
        })]
      }),
      new TableCell({
        width: { size: colWidths[4], type: WidthType.PERCENTAGE },
        borders: { top: medium, bottom: medium, left: thin, right: medium },
        children: [new Paragraph({ children: [new TextRun({ text: '' })] })]
      })
    ]
  }));

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: itemRows
  });

  const refs = [
    meta.orderNo ? `Order #: ${meta.orderNo}` : '',
    meta.destination ? `Destination: ${meta.destination}` : '',
    meta.purpose ? `Purpose: ${meta.purpose}` : '',
    meta.remarks ? `Remarks: ${meta.remarks}` : '',
    meta.generatedOn ? `Generated: ${meta.generatedOn}` : ''
  ].filter(Boolean).join('   •   ');

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [meta.preparedBy, meta.authorizedBy, meta.receivedBy].map(label => new TableCell({
          borders: { top: thin, bottom: noBorder, left: noBorder, right: noBorder },
          width: { size: 33, type: WidthType.PERCENTAGE },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 0 },
            children: [new TextRun({ text: label || '', bold: true, size: 18 })]
          })]
        }))
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
        },
        children: [
          headerTable,
          headerRule,
          fieldsTable,
          new Paragraph({ spacing: { before: 120, after: 0 }, children: [new TextRun({ text: '' })] }),
          itemsTable,
          new Paragraph({
            spacing: { before: 60, after: 0 },
            children: [new TextRun({ text: refs, size: 14, color: '333333' })]
          }),
          new Paragraph({ spacing: { before: 500 }, children: [new TextRun({ text: '' })] }),
          signatureTable,
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160 },
            children: [new TextRun({ text: meta.footerNote || '', size: 14, color: '777777' })]
          })
        ]
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

/**
 * Editable Word packing list (colour/size breakdown + carton details).
 */
async function generatePackingListDocx(order, company) {
  const data = getPackingTotals(order);

  const labelCell = (text, width = 20) => new TableCell({
    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 16, color: '334155' })]
    })]
  });

  const valueCell = (text, width = 30) => new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      children: [new TextRun({ text: text || '-', size: 16, color: '0F172A' })]
    })]
  });

  const metaRow = (l1, v1, l2, v2) => new TableRow({
    children: [labelCell(l1), valueCell(v1), labelCell(l2), valueCell(v2)]
  });

  const headerCell = (text, alignment, width) => new TableCell({
    shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      alignment,
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 15 })]
    })]
  });

  const bodyCell = (children, alignment, width, fill = 'FFFFFF') => new TableCell({
    shading: { fill, type: ShadingType.CLEAR },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ alignment, children })]
  });

  const breakdownRows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Colour / Style', AlignmentType.LEFT, 40),
        headerCell('XS', AlignmentType.CENTER, 10),
        headerCell('S', AlignmentType.CENTER, 10),
        headerCell('M', AlignmentType.CENTER, 10),
        headerCell('L', AlignmentType.CENTER, 10),
        headerCell('XL', AlignmentType.CENTER, 10),
        headerCell('Total', AlignmentType.RIGHT, 10)
      ]
    })
  ];

  data.rows.forEach((row, index) => {
    const fill = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
    breakdownRows.push(new TableRow({
      children: [
        bodyCell([new TextRun({ text: row.label, bold: true, size: 16 })], AlignmentType.LEFT, 40, fill),
        ...row.sizes.map((value, sizeIndex) =>
          bodyCell([new TextRun({ text: String(value || 0), size: 16 })], AlignmentType.CENTER, 10, fill)
        ),
        bodyCell([new TextRun({ text: String(row.total || 0), bold: true, size: 16 })], AlignmentType.RIGHT, 10, fill)
      ]
    }));
  });

  breakdownRows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 1,
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true, size: 16 })] })]
      }),
      ...data.sizeTotals.map(value => new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: String(value || 0), bold: true, size: 16 })]
        })]
      })),
      new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: data.totalPieces.toLocaleString(), bold: true, size: 16 })]
        })]
      })
    ]
  }));

  const cartonRows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Carton No.', AlignmentType.CENTER, 16),
        headerCell('Description', AlignmentType.LEFT, 38),
        headerCell('Pcs / Carton', AlignmentType.RIGHT, 16),
        headerCell('No. of Cartons', AlignmentType.RIGHT, 16),
        headerCell('Total Pcs', AlignmentType.RIGHT, 14)
      ]
    })
  ];

  data.groups.forEach((group, index) => {
    const fill = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
    cartonRows.push(new TableRow({
      children: [
        bodyCell([new TextRun({ text: group.cartonRange, bold: true, size: 16 })], AlignmentType.CENTER, 16, fill),
        bodyCell([new TextRun({ text: group.description, size: 15 })], AlignmentType.LEFT, 38, fill),
        bodyCell([new TextRun({ text: String(group.pcsPerCarton || 0), size: 16 })], AlignmentType.RIGHT, 16, fill),
        bodyCell([new TextRun({ text: String(group.cartons || 0), size: 16 })], AlignmentType.RIGHT, 16, fill),
        bodyCell([new TextRun({ text: group.totalPcs.toLocaleString(), bold: true, size: 16 })], AlignmentType.RIGHT, 14, fill)
      ]
    }));
  });

  cartonRows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true, size: 16 })] })]
      }),
      new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: String(data.totalCartons), bold: true, size: 16 })]
        })]
      }),
      new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: data.totalPieces.toLocaleString(), bold: true, size: 16 })]
        })]
      })
    ]
  }));

  const weightTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          labelCell('Net Weight / Carton', 22),
          valueCell(data.netWeight ? `${data.netWeight} kg` : '________ kg', 28),
          labelCell('Total Net Weight', 22),
          valueCell(data.totalNetWeight ? `${data.totalNetWeight.toFixed(2)} kg` : '________ kg', 28)
        ]
      }),
      new TableRow({
        children: [
          labelCell('Gross Weight / Carton', 22),
          valueCell(data.grossWeight ? `${data.grossWeight} kg` : '________ kg', 28),
          labelCell('Total Gross Weight', 22),
          valueCell(data.totalGrossWeight ? `${data.totalGrossWeight.toFixed(2)} kg` : '________ kg', 28)
        ]
      }),
      new TableRow({
        children: [
          labelCell('Carton Size (L x W x H)', 22),
          valueCell(
            data.cartonLength && data.cartonWidth && data.cartonHeight
              ? `${data.cartonLength} x ${data.cartonWidth} x ${data.cartonHeight} cm`
              : '__ x __ x __ cm',
            28
          ),
          labelCell('Total CBM', 22),
          valueCell(data.totalCbm ? data.totalCbm.toFixed(3) : '________', 28)
        ]
      })
    ]
  });

  const signatureBorders = {
    top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: company?.name || 'BUTT COLLECTION',
              bold: true,
              size: 32,
              color: '1E3A8A'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: `${company?.tagline || 'Quality Apparel Manufacturing & Export'} | Faisalabad, Pakistan`,
              size: 18,
              color: '64748B'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: getCompanyAddress(company),
              size: 14,
              color: '64748B'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 40 },
            children: [new TextRun({
              text: 'PACKING LIST',
              bold: true,
              size: 30,
              color: '1E3A8A'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [new TextRun({
              text: `Generated: ${new Date().toLocaleDateString('en-GB')}`,
              size: 16,
              color: '64748B'
            })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              metaRow('Packing List #', data.no, 'Manufacturer', order.manufacturer || 'Butt Collection'),
              metaRow('Customer / Buyer', order.customer || '-', 'Dispatch City', order.dispatchCity || 'Faisalabad'),
              metaRow('Order #', order.orderNumber || '-', 'Deadline', order.deadline || '-'),
              metaRow('Order Date', order.orderDate || '-', 'Packing Date', data.date || '-')
            ]
          }),

          new Paragraph({
            spacing: { before: 240, after: 80 },
            children: [new TextRun({
              text: 'PACKING BREAKDOWN BY COLOUR & SIZE (PCS)',
              bold: true,
              size: 20,
              color: '1E3A8A'
            })]
          }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: breakdownRows }),

          new Paragraph({
            spacing: { before: 240, after: 80 },
            children: [new TextRun({
              text: 'CARTON DETAILS',
              bold: true,
              size: 20,
              color: '1E3A8A'
            })]
          }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: cartonRows }),

          new Paragraph({
            spacing: { before: 240, after: 80 },
            children: [new TextRun({
              text: 'WEIGHT & VOLUME (fill after packing)',
              bold: true,
              size: 20,
              color: '1E3A8A'
            })]
          }),
          weightTable,

          new Paragraph({
            spacing: { before: 160 },
            children: [new TextRun({ text: `Notes: ${data.notes}`, size: 16, color: '475569' })]
          }),

          new Paragraph({ spacing: { before: 500 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: signatureBorders,
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 120 },
                      children: [new TextRun({ text: 'Prepared by Merchandiser', size: 16, color: '475569' })]
                    })]
                  }),
                  new TableCell({
                    borders: signatureBorders,
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 120 },
                      children: [new TextRun({ text: 'Authorized Signature / Factory', size: 16, color: '475569' })]
                    })]
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

/**
 * Editable Word commercial invoice.
 */
async function generateInvoiceDocx(order, company) {
  const invoice = getInvoiceMeta(order);

  const labelCell = (text, width = 20) => new TableCell({
    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 16, color: '334155' })]
    })]
  });

  const valueCell = (text, width = 30) => new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      children: [new TextRun({ text: text || '-', size: 16, color: '0F172A' })]
    })]
  });

  const metaRow = (l1, v1, l2, v2) => new TableRow({
    children: [labelCell(l1), valueCell(v1), labelCell(l2), valueCell(v2)]
  });

  const headerCell = (text, alignment, width) => new TableCell({
    shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      alignment,
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 15 })]
    })]
  });

  const bodyCell = (children, alignment, width, fill = 'FFFFFF') => new TableCell({
    shading: { fill, type: ShadingType.CLEAR },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ alignment, children })]
  });

  const itemRows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Style / Description', AlignmentType.LEFT, 30),
        headerCell('GSM', AlignmentType.CENTER, 10),
        headerCell('Color', AlignmentType.LEFT, 15),
        headerCell('Qty (Pcs)', AlignmentType.RIGHT, 12),
        headerCell('Rate (£)', AlignmentType.RIGHT, 13),
        headerCell('Amount (£)', AlignmentType.RIGHT, 20)
      ]
    })
  ];

  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : [{ style: '-', gsm: '', color: '-', qty: 0, rate: 0, amount: 0 }];

  let totalQty = 0;
  let totalAmount = 0;

  items.forEach((item, index) => {
    const fill = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
    const qty = Number(item.qty) || 0;
    const amount = Number(item.amount) || 0;
    totalQty += qty;
    totalAmount += amount;

    itemRows.push(new TableRow({
      children: [
        bodyCell([new TextRun({ text: item.style || '-', bold: true, size: 16 })], AlignmentType.LEFT, 30, fill),
        bodyCell([new TextRun({ text: item.gsm || '-', size: 16 })], AlignmentType.CENTER, 10, fill),
        bodyCell([new TextRun({ text: item.color || 'Assorted', size: 16 })], AlignmentType.LEFT, 15, fill),
        bodyCell([new TextRun({ text: qty.toLocaleString(), size: 16 })], AlignmentType.RIGHT, 12, fill),
        bodyCell([new TextRun({ text: `£${Number(item.rate || 0).toFixed(2)}`, size: 16 })], AlignmentType.RIGHT, 13, fill),
        bodyCell([new TextRun({ text: `£${amount.toFixed(2)}`, bold: true, size: 16 })], AlignmentType.RIGHT, 20, fill)
      ]
    }));
  });

  itemRows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true, size: 16 })] })]
      }),
      new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: totalQty.toLocaleString(), bold: true, size: 16 })]
        })]
      }),
      new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: '' })] })]
      }),
      new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `£${totalAmount.toFixed(2)}`, bold: true, size: 16 })]
        })]
      })
    ]
  }));

  const money = value => `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

  const totalsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Subtotal', bold: true, size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: money(invoice.total), bold: true, size: 18 })]
            })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F0FDF4', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Received', bold: true, size: 18, color: '15803D' })] })]
          }),
          new TableCell({
            shading: { fill: 'F0FDF4', type: ShadingType.CLEAR },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: money(invoice.received), bold: true, size: 18, color: '15803D' })]
            })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'FEF2F2', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: 'Balance Due', bold: true, size: 18, color: 'B91C1C' })] })]
          }),
          new TableCell({
            shading: { fill: 'FEF2F2', type: ShadingType.CLEAR },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: money(invoice.balance), bold: true, size: 18, color: 'B91C1C' })]
            })]
          })
        ]
      })
    ]
  });

  const notesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Notes / Terms', bold: true, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: invoice.notes || invoice.terms || '-', size: 16, color: '475569' })] })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Bank / Payment Details', bold: true, size: 16 })] }),
              new Paragraph({ children: [new TextRun({
                text: invoice.bankDetails || 'Please contact the merchandiser for bank transfer details.',
                size: 16,
                color: '475569'
              })] })
            ]
          })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: company?.name || 'BUTT COLLECTION',
              bold: true,
              size: 32,
              color: '1E3A8A'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: `${company?.tagline || 'Quality Apparel Manufacturing & Export'} | Faisalabad, Pakistan`,
              size: 18,
              color: '64748B'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: getCompanyAddress(company),
              size: 14,
              color: '64748B'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 40 },
            children: [new TextRun({
              text: 'INVOICE',
              bold: true,
              size: 32,
              color: '1E3A8A'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [new TextRun({
              text: `Generated: ${new Date().toLocaleDateString('en-GB')}`,
              size: 16,
              color: '64748B'
            })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              metaRow('Invoice #', invoice.no, 'Invoice Date', invoice.date),
              metaRow('Order #', order.orderNumber || '-', 'Order Date', order.orderDate || '-'),
              metaRow('Customer / Buyer', order.customer || '-', 'Destination', order.dispatchCity || 'Faisalabad'),
              metaRow('Payment Terms', invoice.terms, 'Status', invoice.paymentStatus)
            ]
          }),

          new Paragraph({
            spacing: { before: 240, after: 80 },
            children: [new TextRun({
              text: 'INVOICE ITEMS',
              bold: true,
              size: 20,
              color: '1E3A8A'
            })]
          }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: itemRows }),

          new Paragraph({ spacing: { before: 200 } }),
          totalsTable,

          new Paragraph({ spacing: { before: 200 } }),
          notesTable,

          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Authorized Signature / Factory', size: 16, color: '475569' })]
          })
        ]
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

module.exports = {
  generateOrderDocx,
  generateGatePassDocx,
  generatePackingListDocx,
  generateInvoiceDocx
};
