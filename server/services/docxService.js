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
const { getGatePassMeta, getGatePassTotals } = require('../utils/gatePass');
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
  const totals = getGatePassTotals(order);

  const labelCell = (text) => new TableCell({
    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
    width: { size: 18, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 18, color: '334155' })]
    })]
  });

  const valueCell = (text) => new TableCell({
    width: { size: 32, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      children: [new TextRun({ text: text || '-', size: 18, color: '0F172A' })]
    })]
  });

  const metaRow = (leftLabel, leftValue, rightLabel, rightValue) => new TableRow({
    children: [
      labelCell(leftLabel),
      valueCell(leftValue),
      labelCell(rightLabel),
      valueCell(rightValue)
    ]
  });

  const headerCell = (text, alignment, width) => new TableCell({
    shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      alignment,
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 16 })]
    })]
  });

  const itemRows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Style / Description', AlignmentType.LEFT, 34),
        headerCell('GSM', AlignmentType.CENTER, 10),
        headerCell('Color', AlignmentType.LEFT, 16),
        headerCell('Cartons', AlignmentType.RIGHT, 12),
        headerCell('Qty (Pcs)', AlignmentType.RIGHT, 12),
        headerCell('Remarks', AlignmentType.LEFT, 16)
      ]
    })
  ];

  const items = meta.items;

  items.forEach((item, index) => {
    const fill = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
    const cell = (children, alignment, width) => new TableCell({
      shading: { fill, type: ShadingType.CLEAR },
      width: { size: width, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ alignment, children })]
    });

    itemRows.push(new TableRow({
      children: [
        cell([new TextRun({ text: item.style || '-', bold: true, size: 17 })], AlignmentType.LEFT, 34),
        cell([new TextRun({ text: item.gsm || '-', size: 17 })], AlignmentType.CENTER, 10),
        cell([new TextRun({ text: item.color || 'Assorted', size: 17 })], AlignmentType.LEFT, 16),
        cell([new TextRun({ text: String(Number(item.cartons) || '-'), size: 17 })], AlignmentType.RIGHT, 12),
        cell([new TextRun({ text: String(Number(item.qty) || 0), size: 17 })], AlignmentType.RIGHT, 12),
        cell([new TextRun({ text: item.remarks || '-', size: 17 })], AlignmentType.LEFT, 16)
      ]
    }));
  });

  itemRows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({
          children: [new TextRun({ text: 'TOTAL', bold: true, size: 18, color: '0F172A' })]
        })]
      }),
      new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: String(totals.cartons || '-'), bold: true, size: 18 })]
        })]
      }),
      new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: totals.pieces.toLocaleString(), bold: true, size: 18 })]
        })]
      }),
      new TableCell({
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: '' })] })]
      })
    ]
  }));

  const signatureBorders = {
    top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  };

  const signatureLabels = [
    meta.preparedBy,
    meta.gateKeeper,
    meta.receivedBy,
    meta.authorizedBy
  ];

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: signatureLabels.map(label => new TableCell({
          borders: signatureBorders,
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120 },
            children: [new TextRun({ text: label, size: 16, color: '475569' })]
          })]
        }))
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
              text: meta.companyName || company?.name || 'BUTT COLLECTION',
              bold: true,
              size: 32,
              color: '1E3A8A'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: meta.companyTagline
                || `${company?.tagline || 'Quality Apparel Manufacturing & Export'} | Faisalabad, Pakistan`,
              size: 18,
              color: '64748B'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: meta.companyAddress || getCompanyAddress(company),
              size: 14,
              color: '64748B'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 40 },
            children: [new TextRun({
              text: meta.title,
              bold: true,
              size: 30,
              color: '1E3A8A'
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [new TextRun({
              text: `Generated: ${meta.generatedOn}`,
              size: 16,
              color: '64748B'
            })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              metaRow('Gate Pass #', meta.no, 'Vehicle No.', meta.vehicleNo),
              metaRow('Date', meta.date, 'Driver Name', meta.driverName),
              metaRow('Customer / Buyer', meta.customer, 'Destination', meta.destination),
              metaRow('Order #', meta.orderNo, 'Purpose', meta.purpose)
            ]
          }),

          new Paragraph({
            spacing: { before: 240, after: 80 },
            children: [new TextRun({
              text: 'DISPATCH ITEMS',
              bold: true,
              size: 20,
              color: '334155'
            })]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: itemRows
          }),

          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({ text: 'Total Pieces: ', bold: true, size: 18 }),
              new TextRun({ text: totals.pieces.toLocaleString(), size: 18 })
            ]
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Total Cartons: ', bold: true, size: 18 }),
              new TextRun({ text: totals.cartons ? totals.cartons.toLocaleString() : '-', size: 18 })
            ]
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({ text: 'Remarks: ', bold: true, size: 18 }),
              new TextRun({ text: meta.remarks || '-', size: 18 })
            ]
          }),

          signatureTable,

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240 },
            children: [new TextRun({
              text: meta.footerNote,
              size: 14,
              color: '94A3B8'
            })]
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
