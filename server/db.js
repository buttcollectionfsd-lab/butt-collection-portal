/**
 * Database Store for Butt Collection Merchandiser Portal
 * Exactly 5 Orders for Shahid Sahib as per the physical notebook
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const INITIAL_DATA = {
  company: {
    name: "Butt Collection",
    city: "Faisalabad",
    country: "Pakistan",
    phone: "+92 300 1234567",
    currency: "£",
    currencyCode: "GBP",
    tagline: "Quality Apparel Manufacturing & Export"
  },
  orders: [
    {
      id: "ord-1",
      orderNumber: "ORDER #001",
      customer: "Shahid Sab",
      manufacturer: "Butt Collection",
      dispatchCity: "Faisalabad",
      orderDate: "2026-10-17",
      deadline: "2026-10-17",
      shippedOn: "2026-10-17",
      status: "Shipped",
      totalPieces: 960,
      totalAmount: 7200.00,
      amountReceived: 4032.00,
      balance: 3168.00,
      notes: "300 GSM Gym Sets dispatched from Faisalabad on 17 Oct 2026 (Item No. 1)",
      items: [
        {
          id: "item-1-1",
          style: "Plain Gym Set 300 GSM",
          gsm: "300",
          color: "Black",
          sizeBreakdown: { xs: 120, s: 120, m: 120, l: 60, xl: 60 },
          cartons: 15,
          setsPerCarton: 32,
          qty: 480,
          rate: 7.50,
          amount: 3600.00
        },
        {
          id: "item-1-2",
          style: "Panel Gym Set 300 GSM",
          gsm: "300",
          color: "Pink / Gray",
          sizeBreakdown: { xs: 120, s: 120, m: 120, l: 60, xl: 60 },
          cartons: 15,
          setsPerCarton: 32,
          qty: 480,
          rate: 7.50,
          amount: 3600.00
        }
      ]
    },
    {
      id: "ord-2",
      orderNumber: "ORDER #002",
      customer: "Shahid Sab",
      manufacturer: "Butt Collection",
      dispatchCity: "Faisalabad",
      orderDate: "2026-10-21",
      deadline: "2026-10-21",
      shippedOn: "2026-10-21",
      status: "Shipped",
      totalPieces: 1186,
      totalAmount: 8161.50,
      amountReceived: 5000.00,
      balance: 6329.50, // 3168 + 8161.50 - 5000 = 6329.50 (Diary: 6329 balance)
      notes: "Dispatched on 21 Oct (Item No. 2). Half sleeve trouser, Gym set Alo, Half raglan Alo, W-FOX parachute & pant",
      items: [
        {
          id: "item-2-1",
          style: "Half Sleeve Trouser T-Shirt",
          gsm: "",
          color: "Assorted",
          sizeBreakdown: { xs: 32, s: 32, m: 48, l: 32, xl: 16 },
          cartons: 10,
          setsPerCarton: 16,
          qty: 160,
          rate: 7.25,
          amount: 1160.00
        },
        {
          id: "item-2-2",
          style: "Gym Set Alo",
          gsm: "",
          color: "Assorted",
          sizeBreakdown: { xs: 32, s: 32, m: 48, l: 32, xl: 16 },
          cartons: 10,
          setsPerCarton: 16,
          qty: 160,
          rate: 7.25,
          amount: 1160.00
        },
        {
          id: "item-2-3",
          style: "Half Raglan Alo",
          gsm: "",
          color: "Assorted",
          sizeBreakdown: { xs: 50, s: 64, m: 64, l: 50, xl: 28 },
          cartons: 16,
          setsPerCarton: 16,
          qty: 256,
          rate: 7.75,
          amount: 1984.00
        },
        {
          id: "item-2-4",
          style: "W-FOX Parachute Top",
          gsm: "Parachute",
          color: "Assorted",
          sizeBreakdown: { xs: 60, s: 80, m: 90, l: 60, xl: 30 },
          cartons: 20,
          setsPerCarton: 16,
          qty: 320,
          rate: 7.75,
          amount: 2480.00
        },
        {
          id: "item-2-5",
          style: "W-FOX Pant Trouser",
          gsm: "",
          color: "Assorted",
          sizeBreakdown: { xs: 50, s: 70, m: 80, l: 60, xl: 30 },
          cartons: 18,
          setsPerCarton: 16,
          qty: 290,
          rate: 4.75,
          amount: 1377.50
        }
      ]
    },
    {
      id: "ord-3",
      orderNumber: "ORDER #003",
      customer: "Shahid Sab",
      manufacturer: "Butt Collection",
      dispatchCity: "Faisalabad",
      orderDate: "2026-11-05",
      deadline: "2026-11-05",
      shippedOn: "2026-11-05",
      status: "Shipped",
      totalPieces: 1664,
      totalAmount: 12512.00,
      amountReceived: 7500.00,
      balance: 11341.50, // 6329.50 + 12512 - 7500 = 11341.50 (Diary: 11341)
      notes: "Shipped on 5 Nov 2026 (Article No. 3). Gym set Alo, Alo Parachute T-Shirt, Alo Raglan Fleece, W-FOX Parachute",
      items: [
        {
          id: "item-3-1",
          style: "Gym Set Alo",
          gsm: "",
          color: "Assorted",
          sizeBreakdown: { xs: 150, s: 200, m: 200, l: 150, xl: 68 },
          cartons: 24,
          setsPerCarton: 32,
          qty: 768,
          rate: 7.25,
          amount: 5568.00
        },
        {
          id: "item-3-2",
          style: "Alo Parachute T-Shirt",
          gsm: "Parachute",
          color: "Assorted",
          sizeBreakdown: { xs: 80, s: 100, m: 120, l: 76, xl: 40 },
          cartons: 13,
          setsPerCarton: 32,
          qty: 416,
          rate: 7.75,
          amount: 3224.00
        },
        {
          id: "item-3-3",
          style: "Alo Raglan Fleece",
          gsm: "Fleece",
          color: "Assorted",
          sizeBreakdown: { xs: 80, s: 100, m: 120, l: 76, xl: 40 },
          cartons: 13,
          setsPerCarton: 32,
          qty: 416,
          rate: 7.75,
          amount: 3224.00
        },
        {
          id: "item-3-4",
          style: "W-FOX Parachute",
          gsm: "Parachute",
          color: "Assorted",
          sizeBreakdown: { xs: 12, s: 16, m: 20, l: 10, xl: 6 },
          cartons: 2,
          setsPerCarton: 32,
          qty: 64,
          rate: 7.75,
          amount: 496.00
        }
      ]
    },
    {
      id: "ord-4",
      orderNumber: "ORDER #004",
      customer: "Shahid Sab",
      manufacturer: "Butt Collection",
      dispatchCity: "Faisalabad",
      orderDate: "2026-11-19",
      deadline: "2026-11-19",
      shippedOn: "2026-11-19",
      status: "Shipped",
      totalPieces: 1504,
      totalAmount: 9928.00,
      amountReceived: 11400.00, // 5200 + 6200
      balance: 9869.50, // 11341.50 + 9928 - 11400 = 9869.50 (Diary: 9869)
      notes: "Shipped 19 Nov (Article No. 4). Fleece W-FOX, Half Fleece Alo, Fleece Pant Alo. Received installments: £5,200 + £6,200 via Farman Sahib",
      items: [
        {
          id: "item-4-1",
          style: "Fleece W-FOX",
          gsm: "Fleece",
          color: "Assorted",
          sizeBreakdown: { xs: 80, s: 100, m: 120, l: 76, xl: 40 },
          cartons: 13,
          setsPerCarton: 32,
          qty: 416,
          rate: 7.75,
          amount: 3224.00
        },
        {
          id: "item-4-2",
          style: "Half Fleece Alo",
          gsm: "Fleece",
          color: "Assorted",
          sizeBreakdown: { xs: 100, s: 130, m: 150, l: 92, xl: 40 },
          cartons: 16,
          setsPerCarton: 32,
          qty: 512,
          rate: 7.75,
          amount: 3968.00
        },
        {
          id: "item-4-3",
          style: "Fleece Pant Alo",
          gsm: "Fleece",
          color: "Assorted",
          sizeBreakdown: { xs: 110, s: 150, m: 170, l: 100, xl: 46 },
          cartons: 18,
          setsPerCarton: 32,
          qty: 576,
          rate: 4.75,
          amount: 2736.00
        }
      ]
    },
    {
      id: "ord-5",
      orderNumber: "ORDER #005",
      customer: "Shahid Sab",
      manufacturer: "Butt Collection",
      dispatchCity: "Faisalabad",
      orderDate: "2026-11-24",
      deadline: "2026-11-28",
      shippedOn: "",
      status: "In Progress",
      totalPieces: 1504,
      totalAmount: 11144.00,
      amountReceived: 0.00,
      balance: 21013.50, // 9869.50 + 11144 = 21013.50 (Diary last line: 21013 total for Shahid Sahib)
      notes: "Running Production Order 24 Nov (Article No. 5). Alo Fleece Set, Fleece Top, Gym Set, Full Fleece Trouser",
      items: [
        {
          id: "item-5-1",
          style: "Alo Fleece Set",
          gsm: "Fleece",
          color: "Assorted",
          sizeBreakdown: { xs: 60, s: 80, m: 90, l: 50, xl: 20 },
          cartons: 10,
          setsPerCarton: 30,
          qty: 300,
          rate: 7.75,
          amount: 2325.00
        },
        {
          id: "item-5-2",
          style: "Fleece Top",
          gsm: "Fleece",
          color: "Assorted",
          sizeBreakdown: { xs: 36, s: 48, m: 54, l: 30, xl: 12 },
          cartons: 6,
          setsPerCarton: 30,
          qty: 180,
          rate: 7.75,
          amount: 1395.00
        },
        {
          id: "item-5-3",
          style: "Gym Set",
          gsm: "300",
          color: "Assorted",
          sizeBreakdown: { xs: 120, s: 160, m: 180, l: 100, xl: 48 },
          cartons: 19,
          setsPerCarton: 32,
          qty: 608,
          rate: 7.25,
          amount: 4408.00
        },
        {
          id: "item-5-4",
          style: "Full Fleece Trouser",
          gsm: "Fleece",
          color: "Assorted",
          sizeBreakdown: { xs: 80, s: 110, m: 120, l: 70, xl: 36 },
          cartons: 13,
          setsPerCarton: 32,
          qty: 416,
          rate: 7.25,
          amount: 3016.00
        }
      ]
    }
  ],
  payments: [
    {
      id: "pay-1",
      orderId: "ord-1",
      orderNumber: "ORDER #001",
      customer: "Shahid Sab",
      date: "2026-10-18",
      amount: 4032.00,
      method: "Bank Transfer",
      reference: "Wasool - Shahid Sahib",
      notes: "Payment for Order 1"
    },
    {
      id: "pay-2",
      orderId: "ord-2",
      orderNumber: "ORDER #002",
      customer: "Shahid Sab",
      date: "2026-10-22",
      amount: 5000.00,
      method: "Bank Transfer",
      reference: "Wasool - Shahid Sahib",
      notes: "Payment for Order 2"
    },
    {
      id: "pay-3",
      orderId: "ord-3",
      orderNumber: "ORDER #003",
      customer: "Shahid Sab",
      date: "2026-11-06",
      amount: 7500.00,
      method: "Bank Transfer",
      reference: "Wasool - Shahid Sahib",
      notes: "Payment for Order 3"
    },
    {
      id: "pay-4",
      orderId: "ord-4",
      orderNumber: "ORDER #004",
      customer: "Shahid Sab",
      date: "2026-11-19",
      amount: 5200.00,
      method: "Bank Transfer",
      reference: "Farman Sahib - Wasool 1",
      notes: "Installment 1 for Order 4 via Farman Sahib"
    },
    {
      id: "pay-5",
      orderId: "ord-4",
      orderNumber: "ORDER #004",
      customer: "Shahid Sab",
      date: "2026-11-20",
      amount: 6200.00,
      method: "Bank Transfer",
      reference: "Farman Sahib - Wasool 2",
      notes: "Installment 2 for Order 4 via Farman Sahib"
    }
  ],
  cartonLabels: [
    {
      id: "lbl-1",
      buyer: "SP IMPORTS",
      style: "ALOO7",
      description: "ALOO7 SET",
      cartonNo: "1 OF 32",
      totalCartons: 32,
      masterCartons: 32,
      setsPerCarton: 30,
      totalSets: 30,
      countryOfOrigin: "MADE IN PAKISTAN",
      manufacturer: "BUTT COLLECTION FAISALABAD",
      rows: [
        { color: "Black", xs: 3, s: 3, m: 3, l: 3, xl: 3, total: 15 },
        { color: "Gray", xs: 3, s: 3, m: 3, l: 3, xl: 3, total: 15 }
      ],
      notes: "BOLD POSTER DESIGN - 30 SETS PER CARTON (SCREENSHOT DEFAULT)"
    },
    {
      id: "lbl-2",
      buyer: "SP IMPORTS",
      style: "ALOO9",
      description: "PREMIUM GYM SET",
      cartonNo: "1 OF 4",
      totalCartons: 4,
      masterCartons: 4,
      setsPerCarton: 8,
      totalSets: 32,
      countryOfOrigin: "MADE IN PAKISTAN",
      manufacturer: "BUTT COLLECTION FAISALABAD",
      rows: [
        { color: "Black", xs: 2, s: 2, m: 2, l: 1, xl: 1, total: 8 }
      ],
      notes: "BOLD POSTER DESIGN - 4 MASTER CARTONS × 8 SETS = 32 SETS TOTAL"
    }
  ]
};

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDb(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading DB:", err);
    return INITIAL_DATA;
  }
}

function writeDb(data) {
  try {
    const tempPath = DB_PATH + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_PATH);
    return true;
  } catch (err) {
    console.error("Error writing DB:", err);
    return false;
  }
}

module.exports = {
  readDb,
  writeDb,
  INITIAL_DATA
};
