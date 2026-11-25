# Butt Collection Portal — Complete Code Guide

> Yeh document project ke **actual code** ko padh kar banaya gaya hai (README ke bajaye current source of truth).
> Language: Hinglish + technical terms English mein. Paths repo root se relative hain.

---

## 1. Project kya hai?

**Butt Collection (Faisalabad, Pakistan)** ke garment merchandiser ke liye ek internal web portal:

- Production orders track karna (items, GSM, colors, cartons, size breakdown XS–XL)
- Shipment deadlines aur **Late / Urgent** alerts
- Payment ledger — **Wasool** (received) aur **Bakaya** (balance due), currency **£ GBP**
- **Carton label studio** — 4 print-ready templates (default "Bold Poster" style)
- Instant exports: **Excel (.xlsx)**, **Word (.docx)**, **PDF** (work orders + labels)
- Urdu/Arabic script guard — kyunki exports Latin-only fonts use karte hain

Yeh koi public/e-commerce app nahi hai — single-company internal tool hai, bina authentication ke (localhost use ke liye).

---

## 2. Tech Stack

| Layer | Technology | Version (package.json) |
|---|---|---|
| Frontend | React | 18.3.1 |
| Build tool | Vite | 6.0.1 |
| Styling | Tailwind CSS | 3.4.16 |
| Icons | lucide-react | 0.460.0 |
| Backend | Express | 4.21.2 |
| Database | MongoDB + Mongoose (optional) | 9.12.3 |
| DB fallback | Local JSON file (`data.json`) | — |
| Excel export | ExcelJS | 4.4.0 |
| PDF export | PDFKit | 0.16.0 |
| Word export | docx | 9.1.1 |
| Env config | dotenv | 18.0.10 |
| CORS | cors | 2.8.5 |

**Patterns:** koi Redux/React Router nahi — sab kuch `App.jsx` ke local state + tab switching se chalta hai. HTTP calls plain `fetch()` se hoti hain. Frontend aur backend dono ki apni `node_modules` aur `package.json` hain.

---

## 3. Kaise chalayein

**Sabse aasan (Windows):**

```bat
run-portal.bat
```

Yeh batch file:
1. `server/` mein `node server.js` (port **5000**) naya cmd window mein start karta hai
2. `client/` mein `npm run dev` (Vite, port **3000**) start karta hai
3. 4 second baad browser mein `http://localhost:3000` kholta hai

**Manual:**

```bash
# Terminal 1 — backend
cd server
npm install        # pehli baar
node server.js     # http://localhost:5000

# Terminal 2 — frontend
cd client
npm install        # pehli baar
npm run dev        # http://localhost:3000
```

**Root `package.json`** ke convenience scripts (optional):

```bash
npm run server   # cd server && node server.js
npm run client   # cd client && npm run dev
```

**Environment (`server/.env`)** — `.env.example` ka template:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/butt_collection
# Atlas: mongodb+srv://<user>:<pass>@cluster.mongodb.net/butt_collection?retryWrites=true&w=majority
```

> `.env` gitignored hai. Mongo na mile to server crash **nahi** hota — `data.json` par chalta rehta hai.

---

## 4. Folder Structure (actual)

```text
butt-collection-portal/
├── run-portal.bat              # One-click Windows launcher
├── package.json                # Root workspace scripts (koi dependency nahi)
├── README.md                   # Purana/partially outdated documentation
├── PROJECT_GUIDE.md            # Yeh file
├── .gitignore                  # node_modules, .env, dist, build
│
├── server/                     # Express backend
│   ├── server.js               # Saare API routes + export endpoints (688 lines)
│   ├── db.js                   # JSON fallback store + INITIAL_DATA seed (454 lines)
│   ├── data.json               # Live persisted data (JSON mode)
│   ├── data.json.urdu-backup   # Purana backup (Urdu text wala, app use nahi karta)
│   ├── .env / .env.example     # PORT + MONGO_URI
│   ├── config/
│   │   └── db.js               # Mongoose connect + auto-seeder
│   ├── models/                 # Mongoose schemas
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── CartonLabel.js
│   │   └── Company.js
│   ├── services/               # Document generators
│   │   ├── excelService.js     # 3-sheet styled workbook
│   │   ├── pdfService.js       # Work order, gate pass, packing list, invoice PDFs + 4 label templates
│   │   └── docxService.js      # Word work order, gate pass, packing list, invoice
│   └── utils/
│       ├── arabicScript.js     # Urdu/Arabic detect + strip + field labels
│       ├── companyInfo.js      # Factory address fallback for document headers
│       ├── gatePass.js         # Gate pass number + meta + totals
│       ├── packingList.js      # Packing list number, carton groups, weights, CBM
│       ├── invoice.js          # Invoice number + totals + payment status
│       └── orderNumber.js      # "6" → "ORDER #006"
│
└── client/                     # React frontend (Vite)
    ├── index.html              # Fonts (Inter, JetBrains Mono), BC favicon
    ├── vite.config.js          # port 3000 + /api proxy → 5000
    ├── tailwind.config.js      # brand blue palette
    ├── postcss.config.js
    ├── dist/                   # Vite build output (generated)
    └── src/
        ├── main.jsx            # React root
        ├── index.css           # Tailwind + scrollbar + @media print
        ├── App.jsx             # Data loading, tab routing, handlers
        ├── components/
        │   ├── Navbar.jsx
        │   ├── DashboardTab.jsx
        │   ├── OrdersTab.jsx
        │   ├── CreateOrderPage.jsx     # Full-page entry form (modal nahi)
        │   ├── OrderDetailsModal.jsx
        │   ├── PaymentLedgerTab.jsx
        │   ├── PaymentModal.jsx
        │   ├── CartonLabelTab.jsx
        │   ├── OrderDocumentsTab.jsx     # Dedicated Gate Pass / Packing List / Invoice create page
        │   ├── ExportsTab.jsx
        │   ├── GatePassModal.jsx         # Gate pass editor + live preview + PDF
        │   ├── GatePassDocument.jsx      # Gate pass A4 paper markup
        │   ├── PackingListModal.jsx      # Packing list editor + live preview + PDF
        │   ├── PackingListDocument.jsx   # Packing list A4 paper markup
        │   ├── InvoiceModal.jsx          # Invoice editor + live preview + PDF
        │   ├── InvoiceDocument.jsx       # Invoice A4 paper markup
        │   ├── CreateDocumentsModal.jsx  # Create/open gate pass, packing list & invoice
        │   ├── DocumentEditorModal.jsx   # Shared editor/preview shell for order documents
        │   ├── ScriptWarning.jsx
        │   └── OrderModal.jsx          # ⚠️ LEGACY — kahin import nahi hota
        └── utils/
            ├── arabicScript.js
            ├── company.js      # Company/factory address helper
            ├── gatePass.js     # Client mirror of gate pass meta/totals
            ├── packingList.js  # Client mirror of packing groups/totals
            ├── invoice.js      # Client mirror of invoice meta
            └── orderNumber.js
```

---

## 5. High-Level Architecture

```text
┌──────────────────────────────────────────────┐
│  React + Vite  (http://localhost:3000)       │
│  App.jsx  ── fetch(API_BASE = :5000/api)     │
│  <a download href="http://localhost:5000/.."> │
└───────────────────┬──────────────────────────┘
                    │ JSON / file downloads
                    ▼
┌──────────────────────────────────────────────┐
│  Express API  (http://localhost:5000)        │
│  server.js                                    │
│                                               │
│  getIsConnected() ?                           │
│    ├─ YES → MongoDB (Mongoose models)        │
│    └─ NO  → server/data.json (atomic write)  │
│                                               │
│  Services: ExcelJS | PDFKit | docx            │
└──────────────────────────────────────────────┘
```

**Important:** har read/write route pehle check karta hai `getIsConnected()` — Mongo connected hai to Mongo use hoga, warna JSON file. Dono stores ka shape same rakha gaya hai (JSON record mein `id`, Mongo doc mein `_id` → route `id` mein convert karta hai).

---

## 6. Backend Deep Dive

### 6.1 Startup flow (`server/server.js`)

1. `dotenv.config()` — `.env` load
2. Express app + `cors()` + `express.json()`
3. `connectDB()` **async** call hoti hai — await nahi hoti, isliye Mongo down ho to bhi server 5000 par start ho jata hai
4. Mongo connect hote hi `seedOrSync()` chalta hai (neeche dekhein)
5. `app.listen(PORT)` — default 5000

### 6.2 Mongo connection + auto-seeding (`server/config/db.js`)

- `MONGO_URI` (ya default `mongodb://localhost:27017/butt_collection`) se connect, `serverSelectionTimeoutMS: 5000`
- Fail hone par sirf warning log — JSON fallback continue
- **Seeding condition:** `Order.countDocuments() === 0` — sirf empty DB par `data.json` se Company, Orders, Payments, CartonLabels copy hote hain (JSON ke `id` fields remove karke)
- `getIsConnected()` = `isConnected && mongoose.connection.readyState === 1`

> Agar DB mein orders already hain to seed skip — partial seeding repair nahi karta.

### 6.3 JSON fallback store (`server/db.js`)

- `DB_PATH = server/data.json`
- `readDb()`: file na mile to `INITIAL_DATA` likh kar return; parse error par bhi `INITIAL_DATA`
- `writeDb()`: **atomic write** — pehle `data.json.tmp` likhta hai, phir `rename` karta hai
- `INITIAL_DATA` = notebook ke 5 orders (Shahid Sab), 5 payments, 2 carton labels (ALOO7, ALOO9), company profile

### 6.4 Order number formatting (`server/utils/orderNumber.js`)

```
Regex: /^(?:order|po|article|item)?\s*#?\s*(\d{1,4})$/i
"6" / "order 6" / "PO #6" / "Order #6"  →  "ORDER #006"
"ALOO9" / "JY008"                        →  waise hi rehta hai (custom buyer ref preserve)
```
Same logic client (`client/src/utils/orderNumber.js`) mein duplicate hai taake form aur server consistent rahein.

### 6.5 Urdu / Arabic script guard (`server/utils/arabicScript.js`)

**Kyun:** PDFKit/docx/ExcelJS ke Latin fonts Urdu glyphs render nahi karte — export corrupt/blank aata hai.

- Detect: Unicode ranges `0600–06FF`, `0750–077F`, `08A0–08FF`, `FB50–FDFF`, `FE70–FEFF`
- `rejectArabicPayload` middleware `POST/PUT /orders`, `POST /payments`, `POST/PUT /labels` par 400 return karta hai agar koi field mein Arabic script ho
- `sanitizeTextFields()` — Arabic chars, Arabic-wale parentheses groups, extra spaces, dangling punctuation strip karta hai; `reference` → fallback `"Wasool"`, `style` → `"Standard Style"`
- `getFieldLabel()` — path `items.0.style` ko human label `Item #1 — Style / Item Name` banata hai
- Maintenance routes: scan (list) aur clean (DB/JSON update)

Client side bhi same logic ka mirror hai: forms mein red **ScriptWarning** banner + save block + **Remove Urdu text** button.

### 6.6 API Endpoints

Base: `http://localhost:5000/api`

| Method | Route | Kya karta hai |
|---|---|---|
| GET | `/health` | Status + `database` mode + `mongoConnected` |
| GET | `/dashboard` | Company, stats, annotated orders, `recentPayments`, today date |
| GET | `/orders` | Orders list; query: `status`, `customer`, `search` |
| GET | `/orders/:id` | Single order |
| POST | `/orders` | Naya order; totals server par recalculate hote hain |
| PUT | `/orders/:id` | Partial update; items aayein to totals + balance recalc |
| DELETE | `/orders/:id` | Order delete (payments delete nahi hote) |
| GET | `/payments` | Saari payments (date desc) |
| POST | `/payments` | Naya Wasool; linked order ka `amountReceived`/`balance` update |
| DELETE | `/payments/:id` | Payment delete; linked order se amount minus + balance recalc |
| GET | `/labels` | Carton labels |
| POST | `/labels` | Naya label |
| PUT | `/labels/:id` | Label update |
| GET | `/maintenance/arabic-scan` | Arabic-script wale saved fields list |
| POST | `/maintenance/arabic-clean` | Saare records sanitize karke save |
| GET | `/export/excel` | Full tracker workbook `.xlsx` |
| GET | `/export/pdf/order/:id` | Work order PDF |
| GET | `/export/pdf/label/:id?template=` | Carton label PDF (4 templates) |
| GET | `/export/pdf/gate-pass/:id` | Dispatch gate pass PDF (`?inline=1` for iframe) |
| GET | `/export/pdf/packing-list/:id` | Packing list PDF (`?inline=1` for iframe) |
| GET | `/export/pdf/invoice/:id` | Commercial invoice PDF (`?inline=1` for iframe) |
| GET | `/export/docx/order/:id` | Work order Word document |
| GET | `/export/docx/gate-pass/:id` | Gate pass Word document |
| GET | `/export/docx/packing-list/:id` | Packing list Word document |
| GET | `/export/docx/invoice/:id` | Commercial invoice Word document |

**Labels ke liye DELETE endpoint nahi hai.**

### 6.7 Dashboard calculations (`GET /dashboard`)

```text
totalOrders      = orders.length
shippedOrders    = status === "Shipped"
inProgressOrders = status === "In Progress"
lateOrders       = status !== "Shipped" && deadline < today (string ISO compare)
urgentOrders     = status !== "Shipped" && 0 <= daysLeft <= 7
totalBilled      = Σ order.totalAmount
totalReceived    = Σ payment.amount          (ledger se, order fields se nahi)
balanceDue       = totalBilled - totalReceived
totalPieces      = Σ order.totalPieces
```

Har order par annotate hota hai:

```js
{ ...order,
  daysLeft: ceil((deadline - now) / 1 day),
  alert: "Shipped" | "LATE" | "Urgent (N days)" | "On time (N days)" | "Normal"
}
```

`recentPayments` = `payments.slice(-5)` — payments date **desc** sorted hain, is liye yeh technically **purani 5** deta hai, latest 5 nahi (minor bug).

### 6.8 Order create/update rules

**POST `/orders`:**
- `orderNumber` + `customer` required
- Har item normalize: `qty`, `rate`, `amount = qty × rate` (agar amount missing)
- `totalPieces = Σ qty`, `totalAmount = Σ amount`
- `orderNumber` auto-format
- **`amountReceived` hamesha 0 set hota hai**, `balance = totalAmount`
- Shipped ho to `shippedOn` default orderDate

**Advance payment kaise handle hota hai?**
Client order create karne ke baad, agar `advancePaid > 0` hai, to alag se `POST /payments` bhejta hai. Server wahan order ka `amountReceived += amount` aur `balance = totalAmount - amountReceived` karta hai. Is liye double-count nahi hota (POST order incoming amountReceived ignore karta hai).

**PUT `/orders/:id`:**
- `id`, `_id`, `__v` payload se remove
- Items aayein to totals recalc; `balance = totalAmount - amountReceived`
- Mongo mode mein `findByIdAndUpdate(..., { runValidators: false })`

**⚠️ Caveat:** editing form `advancePaid` ko order ke current `amountReceived` se prefill karta hai aur PUT usse direct set karta hai. Agar payments ledger mein multiple entries hain, order-level `amountReceived` aur ledger ka sum drift kar sakta hai.

### 6.9 Payment create/delete

**POST `/payments`:** amount > 0 required; defaults `customer="Shahid Sab"`, `date=today`, `method="Bank Transfer"`, `reference="Wasool"`; `orderId` ho to linked order update.

**DELETE `/payments/:id`:** linked order se `amountReceived -= amount` (min 0 clamp), `balance = totalAmount - amountReceived`, phir payment remove.

Order delete karne par uske payments **orphan** reh jate hain (delete nahi hote).

### 6.10 Export services

**`excelService.js` — `generateFullTrackerWorkbook(orders, payments, company)`**
3 sheets, styled headers/cards/borders, GBP number formats:
1. **Order Tracker** — 4 summary cards + order rows (items summary, pieces, cartons, status colors, balance)
2. **Order Details** — har line item ki row (style, GSM, color, qty, rate, amount, notes)
3. **Payment Ledger** — Billed / Received / Balance cards + payments table

**`pdfService.js`** — PDFKit, A4:
- `generateOrderPdfBuffer(order, company)` — branded header, order meta box, items table, size matrix, financial box, signature lines. Header/footer customizable: `docTitle` (blank = hidden), `docStatus` (optional badge), `footerLeft`, `footerRight`.
- `generateCartonLabelPdfBuffer(label, company, templateId)` — 4 templates:
  - `screenshot_bold` (**default**) — double border, buyer, style title, size table, bottom-left TOTAL SETS, bottom-right CTN# box
  - `classic_box` — description + top-right CTN# box + bottom full-width total
  - `minimal_clean` — rounded border, ruled lines
  - `top_ctn` — top CTN# box, buyer/sets dual box, table, bottom total
- `generateGatePassPdfBuffer(order, company)` — blue header with editable company name/tagline/address + document title, editable generated date, 8-field gate pass meta (GP#, date, customer, order#, vehicle, driver, destination, purpose), dispatch items table (editable rows, multi-page), totals/remarks box, 4 editable signature labels, editable footer note.
- `generatePackingListPdfBuffer(order, company)` — 8-field meta, colour/size breakdown table, carton details (range, description, pcs/carton, cartons, pcs), weight & volume box (net/gross/CBM), notes, 2 signatures.
- `generateInvoicePdfBuffer(order, company)` — invoice meta + payment status badge, bill-to box, items table, totals, three financial cards (subtotal/received/balance), notes & bank details, signature.

**`docxService.js`** — editable Word documents:
- `generateOrderDocx(order, company)` — company header, meta table, items table (with total row), ledger section, signature block. `docTitle`, `docStatus`, `footerLeft`, `footerRight` bhi print hote hain.
- `generateGatePassDocx(order, company)` — same editable header/meta/items/signatures/footer note as the PDF.
- `generatePackingListDocx(order, company)` — size breakdown, carton details, weight table with blanks when values are empty, notes, 2 signatures.
- `generateInvoiceDocx(order, company)` — meta table, items, totals table, notes/bank table, signature.

All order documents share the company address fallback (`server/utils/companyInfo.js` → client `utils/company.js`): **Ayub Colony, Fsd, Nazamabad Street No 9, Center Mill Road** (factory / office).

**Gate pass editability:** gate pass ke har visible element ke overrides order par save hote hain — `gatePassTitle`, `gatePassGeneratedOn`, `gatePassCompanyName/Tagline/Address`, `gatePassCustomer`, `gatePassOrderNo`, `gatePassPreparedBy/GateKeeper/ReceivedBy/AuthorizedBy`, `gatePassFooterNote`, aur `gatePassItems[]` (style, GSM, color, cartons, qty, remarks). Empty override ka matlab fallback (company profile / order items). Shared logic `server/utils/gatePass.js` + client `utils/gatePass.js`; PDF/Word/preview teeno same values use karte hain.

**Derived numbers:** gate pass `GP-###`, packing list `PL-###`, invoice `INV-###`, where `###` comes from the order number digits. Inline PDFs use `Content-Disposition: inline`, downloads use `attachment`.

---

## 7. Frontend Deep Dive

### 7.1 `App.jsx` — application controller

**API base:** hardcoded `const API_BASE = 'http://localhost:5000/api'`.

**State:**

| State | Kaam |
|---|---|
| `activeTab` | `dashboard` / `orders` / `create-order` / `documents` / `ledger` / `labels` / `exports` |
| `company`, `stats`, `orders`, `payments`, `labels`, `todayDate`, `database` | Server data |
| `editingOrder` | Edit mode ke liye order |
| `selectedOrderDetails` | Details modal |
| `gatePassOrder`, `packingListOrder`, `invoiceOrder` | Document editor modals (live preview + PDF) |
| `documentCreateOrder` | "Create Order Documents" modal; naye order save par khud khulta hai |
| `isPaymentModalOpen` | Wasool modal |
| `toast` | Bottom-right notification |
| `cleaningStoredUrdu` | Maintenance cleanup busy state |

**`loadData(silent)`:** 4 parallel fetches (`/dashboard`, `/orders`, `/payments`, `/labels`). `silent=true` par spinner nahi (optimistic updates ke baad background refresh). Dashboard fail = poora error screen + retry.

**Handlers:** `handleSaveOrder` (POST/PUT + advance payment entry), `handleDeleteOrder`, `handleUpdateOrderStatus`, `handleSavePayment`, `handleDeletePayment`, `handleSaveLabel`, `handleCleanStoredUrdu`, plus document saves `handleSaveGatePass`, `handleSavePackingList`, `handleSaveInvoice`. Sab optimistic updates + silent reload use karte hain; document saves partial fields `PUT /orders/:id` se bhejte hain aur modal state merge karte hain. `handleOpenDocument(type, order)` dedicated documents tab se already-created document seedha editor mein kholta hai.

**Create Documents flow:** naya order save hone par `handleSaveOrder` `setDocumentCreateOrder(savedOrder)` karta hai, jisse `CreateDocumentsModal` khulta hai (Gate Pass / Packing List / Invoice). `handleCreateDocument(type, order)` pehle default number + date + terms `PUT /orders/:id` se save karta hai (taake document "created" ban jaye), phir wahi document editor khol deta hai. Entry points: Navbar ka **Gate Pass / Invoice / Packing** tab (`OrderDocumentsTab`), Dashboard banner ka amber shortcut, Orders table ke **Create Docs** button, Order Details ke **Create Documents** button, aur Exports Hub ka order selector.

Yeh bhi karta hai: saved records mein `findArabicIssues(orders/payments/labels)` scan karke top par cleanup banner dikhana.

### 7.2 Components

| Component | Type | Highlights |
|---|---|---|
| `Navbar` | Layout | 7 tabs (incl. **Gate Pass / Invoice / Packing**), Mongo/local DB badge, today date, Billed/Balance ticker, +New Order highlight |
| `DashboardTab` | Tab | KPI cards (orders, shipped, in progress, late/urgent), GBP financial cards (Billed/Wasool/Bakaya), amber **Gate Pass / Invoice / Packing** shortcut, urgent orders list, recent orders table |
| `OrdersTab` | Tab | Search (order #, customer, notes, style), status filters `All/In Progress/Shipped/Urgent/Late`, inline status `<select>`, **Create Docs** button per row, Gate Pass / Packing List / Invoice editors, Work Order/PDF/Excel viewer, PDF/Word/Edit/Delete actions |
| `CreateOrderPage` | Full page | 5 sections: order/customer meta, items + size matrix, advance payment, notes, document header/footer/status. Add/duplicate/remove items, auto amount, auto qty from sizes, live preview, sticky totals bar. Save par documents-create modal auto khulta hai |
| `OrderDetailsModal` | Modal | Meta badges, items table, size matrix, ledger summary, notes, status toggle, Create Documents, Gate Pass / Packing List / Invoice shortcuts, in-app View (Work Order/PDF), Word/PDF export, Edit |
| `PaymentLedgerTab` | Tab | 3 summary cards, search, payments table, delete. **Edit nahi hai** |
| `PaymentModal` | Modal | Optional order select (auto-fill customer/notes), amount, date, method, reference, notes, Urdu guard |
| `CartonLabelTab` | Tab | 4 template cards, label customizer (buyer/style/carton#, color-size rows), live preview, print, PDF export, save label, ALOO7/ALOO9 presets |
| `OrderDocumentsTab` | Tab | Dedicated create page: order selector + summary, three large cards (Gate Pass / Packing List / Commercial Invoice) with Created/Not created status, number/date, **Create** ya **Open** button |
| `ExportsTab` | Tab | 3 cards: Excel tracker, Word order (order select), PDF label/order + View buttons; top par **Create / Manage Order Documents** order selector; Gate Pass / Packing List / Invoice blocks with View, PDF and Word |
| `CreateDocumentsModal` | Modal | Teen document cards (number + date + Created/New status), Create/Open buttons; create karte hi editor + PDF/Word khul jata hai |
| `DocumentEditorModal` | Modal shell | Shared left editor + right Document/PDF tabs, dirty-state pill, save + PDF/Word/new-tab actions |
| `GatePassModal` / `PackingListModal` / `InvoiceModal` | Modal wrappers | Field definitions + defaults + paper preview wired into `DocumentEditorModal`; Gate Pass additionally has grouped header/details/signature sections and a full dispatch-items editor (add/remove/reset rows) |
| `GatePassDocument` / `PackingListDocument` / `InvoiceDocument` | Shared | A4 paper markup mirroring the PDF output with the factory address; gate pass uses all editable overrides (header, customer/order #, items, signatures, footer) |
| `WorkOrderDocument` | Shared | A4 work-order paper markup (docTitle/docStatus/footer/financials) — form preview + viewer dono use karte hain |
| `WorkOrderPreview` | Modal | Live form preview overlay |
| `DocumentViewerModal` | Modal | Tabs: Work Order / PDF (inline iframe) / Excel (HTML sheet preview), plus download shortcuts |
| `ExcelWorkbookPreview` | Shared | Order Tracker / Order Details / Payment Ledger sheets HTML tables mein, bina `.xlsx` download |
| `ScriptWarning` | Shared | Red banner, max 4 issues list, "Remove Urdu text" action |
| `OrderModal` | ⚠️ Legacy | Kahin import nahi hota; CreateOrderPage iski jagah le chuka hai |

### 7.3 Size matrix ↔ Qty logic (`CreateOrderPage`)

- Size inputs (`xs,s,m,l,xl`) mein value daalte hi: `qty = xs+s+m+l+xl`, aur `amount = qty × rate`
- Qty ya Rate manually change karein to `amount = qty × rate`
- Size-breakdown edit qty ko overwrite karta hai (agar total sizes > 0)
- `orderNumber` field `onBlur` par `formatOrderNumber()` se auto-format hota hai
- Validation: order number, customer required; Arabic script ho to save block
- Save payload mein `totalPieces`, `totalAmount`, `amountReceived = advancePaid`, `balance = totalAmount - advancePaid` jata hai

### 7.4 Carton label logic (`CartonLabelTab`)

- Template preview React/Tailwind se render hota hai (print CSS: `.no-print` hide)
- Row size edit par `row.total = xs+s+m+l+xl`
- Uske baad `setsPerCarton = totalSets = Σ row.total` (manual override bhi possible)
- Style title ke saath `SET` auto-append hota hai (e.g. `ALOO7` → `ALOO7 SET`)
- Export PDF URL: `/api/export/pdf/label/:id?template=<activeTemplate>`

### 7.5 Frontend API calls — sab `localhost:5000` par

`App.jsx`, `OrdersTab.jsx`, `OrderDetailsModal.jsx`, `DashboardTab.jsx`, `ExportsTab.jsx`, `CartonLabelTab.jsx` mein direct `http://localhost:5000/...` URLs hain. `vite.config.js` mein `/api` → `:5000` proxy bhi configured hai, lekin code mostly use nahi karta. Deploy karne ke liye in URLs ko env-based banana padega.

---

## 8. Data Model

### 8.1 Shapes (JSON / Mongo common)

**Order**
```js
{
  id,                    // JSON: "ord-*" ; Mongo: _id se mapped
  orderNumber: "ORDER #001",
  customer, manufacturer: "Butt Collection", dispatchCity: "Faisalabad",
  orderDate, deadline, shippedOn,       // "YYYY-MM-DD" strings
  status: "In Progress" | "Shipped",    // enum — Late/Urgent sirf computed alerts
  totalPieces, totalAmount, amountReceived, balance,
  notes,
  docTitle: "MERCHANDISER WORK ORDER",   // blank string = heading hidden
  docStatus: "",                          // optional badge, e.g. APPROVED
  footerLeft: "Prepared by Merchandiser",
  footerRight: "Authorized Signature / Factory",
  items: [{
    id?, style, gsm, color,
    sizeBreakdown: { xs, s, m, l, xl },
    cartons, setsPerCarton, qty, rate, amount
  }]
}
```

**Payment**
```js
{ id, orderId, orderNumber, customer, date, amount,
  method: "Bank Transfer" | ..., reference, notes }
```

**CartonLabel**
```js
{ id, buyer, style, description,
  cartonNo, totalCartons, masterCartons, setsPerCarton, totalSets,
  countryOfOrigin: "MADE IN PAKISTAN",
  manufacturer: "BUTT COLLECTION FAISALABAD",
  rows: [{ color, xs, s, m, l, xl, total }],
  notes }
```

**Company**
```js
{ name: "Butt Collection", city: "Faisalabad", country: "Pakistan",
  phone, currency: "£", currencyCode: "GBP", tagline }
```

### 8.2 Seed vs live data

- **Seed (`db.js` → `INITIAL_DATA`):** 5 orders (Order #001–#005), 5 payments, 2 labels (ALOO7, ALOO9), cumulative diary-style balances (3168 → 6329.50 → 11341.50 → 9869.50 → 21013.50).
- **Live `server/data.json` (current repo state):** **6 orders** — 5 seed + `ORDER #010` (In Progress, £7,672.50), balances per-order (`totalAmount - amountReceived`) style mein, e.g. ORDER #002 balance `3161.50`, ORDER #004 balance `-1472.00` (over-received).
- **`data.json.urdu-backup`:** cleanup se pehle ka backup — notes/styles Urdu mein, order numbers `"Order 1"` format. App isse read nahi karta.

### 8.3 Key business formulas

```text
item.amount      = qty × rate
order.totalPieces = Σ item.qty
order.totalAmount = Σ item.amount
order.balance     = order.totalAmount - order.amountReceived   (per-order, live data)

dashboard.balanceDue = Σ order.totalAmount - Σ payment.amount  (global ledger)
label.setsPerCarton  = Σ label.rows[].total
label.rows[].total   = xs + s + m + l + xl
```

> Note: seed data ke cumulative balances ka total aur global ledger formula dono ka result same tha (£21,013.50), lekin UI edits ke baad per-order balances store hote hain. Dashboard global calculation (billed − payments) hi use karta hai.

---

## 9. Known Quirks / Limitations (code padhne par mile)

1. **`OrderModal.jsx` dead code hai** — koi import nahi; edit/new order ab `CreateOrderPage.jsx` se hota hai.
2. **`recentPayments = payments.slice(-5)`** — descending sort ki wajah se oldest 5 deta hai.
3. **Hardcoded `http://localhost:5000`** frontend ke kai components mein — deployment ke waqt badalna padega; CORS bhi open hai.
4. **No authentication / no tests** — purely local/internal tool.
5. **Order delete se payments delete nahi hote** — ledger mein orphan entries reh sakti hain.
6. **Edit se ledger drift** — order ka `amountReceived` direct set hota hai, payment entries adjust nahi hoti.
7. **Labels ka DELETE endpoint nahi** — sirf create/update.
8. **Mongo seeding sirf empty DB par** — adhoora seed self-heal nahi karta.
9. **Status enum sirf 2 values** — "Late"/"Urgent" computed alert hain, real status nahi.
10. **`data.json.urdu-backup`** app ke liye irrelevant hai — sirf historical backup.
11. **README purana hai** — JSON-only store, 5 orders, order dates (e.g. Order 4 = 15 Nov) mention karta hai; current code/data alag hai. Is guide ko follow karein.
12. **Server frontend build serve nahi karta** — `client/dist` alag se host karna padega ya `express.static` add karna hoga.

---

## 10. Common Change Guide

| Karna ho | Kahan edit karein |
|---|---|
| Naya order field add | `server/models/Order.js` → `CreateOrderPage.jsx` form → `server.js` POST/PUT normalize → exports (excel/pdf/docx) |
| Naya carton label template | `pdfService.js` (PDF) + `CartonLabelTab.jsx` (preview card + JSX) + `ExportsTab.jsx` dropdown |
| Naya export format/route | `server.js` export section + naya service file + `ExportsTab.jsx` card |
| Gate pass / packing / invoice field add | `Order.js` + `server.js` POST + server & client utils + PDF/DOCX generator + Document JSX + modal field list |
| Factory address change | `server/utils/companyInfo.js` + `client/src/utils/company.js` + `Company` model/data |
| Currency/company info change | `server/db.js` INITIAL_DATA + Mongo `Company` doc + hardcoded `£` strings |
| Urdu guard rules change | `server/utils/arabicScript.js` + `client/src/utils/arabicScript.js` (dono mirror) |
| API base configurable | `App.jsx` + direct links (`OrdersTab`, `ExportsTab`, `OrderDetailsModal`, `CartonLabelTab`, `DashboardTab`) |
| Dashboard KPI change | `server.js` `/api/dashboard` + `DashboardTab.jsx` cards |

---

## 11. Quick Verification Commands

```bash
# Backend health + DB mode
curl http://localhost:5000/api/health

# Dashboard JSON
curl http://localhost:5000/api/dashboard

# Arabic-script scan (stored records)
curl http://localhost:5000/api/maintenance/arabic-scan

# Excel download (browser)
http://localhost:5000/api/export/excel

# Order documents (PDF inline / Word download)
http://localhost:5000/api/export/pdf/gate-pass/ord-1?inline=1
http://localhost:5000/api/export/docx/packing-list/ord-1
http://localhost:5000/api/export/pdf/invoice/ord-1?inline=1

# Frontend production build
cd client && npm run build
```

---

**Summary:** Yeh ek single-company garment merchandising portal hai — React (Vite + Tailwind) frontend, Express backend, MongoDB optional with JSON file fallback, aur ExcelJS/PDFKit/docx se document generation. Business core: orders + size matrix, wasool/bakaya ledger, carton label studio, aur Urdu-free data entry taake exports clean rahein. Har order ke saath Gate Pass, Packing List aur Commercial Invoice auto-derived documents bhi edit, view aur PDF/Word export ke liye tayyar hain.
