/**
 * Client-side document printing.
 *
 * PDFs ko pdf.js se images mein render karke ek chhote hidden iframe mein
 * daala jata hai, phir browser ka print dialog khulta hai — wahan user paper
 * size, orientation, margins, scale aur copies (full settings) khud set kar
 * sakta hai.
 *
 * Note: pehle naya window khol kar usme render karte the, lekin background
 * tab mein pdf.js ki rendering ruk jati thi (window focus le leta tha) aur
 * "Document prepare ho raha hai…" par atak jata tha. Ab render pehle hota
 * hai, phir hidden iframe print karta hai — koi popup block bhi nahi.
 */

let pdfjsPromise = null;

function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function renderPdfPages(source) {
  const pdfjs = await loadPdfjs();
  const params = typeof source === 'string' ? { url: source } : { data: source };
  const pdf = await pdfjs.getDocument(params).promise;

  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    // intent: 'print' pdf.js ko requestAnimationFrame ke baghair render karta hai —
    // background tab mein bhi atakta nahi (warna printing hang ho jati thi).
    await page.render({ canvasContext: context, viewport, canvas, intent: 'print' }).promise;
    pages.push({
      dataUrl: canvas.toDataURL('image/png'),
      width: viewport.width,
      height: viewport.height
    });
  }
  return pages;
}

function createPrintFrame() {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('title', 'Print frame');
  frame.style.cssText =
    'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(frame);
  return frame;
}

async function printImages(images, { landscape, copies = 1, title = 'Print' } = {}) {
  const repeated = [];
  const copyCount = Math.max(1, Math.min(20, Number(copies) || 1));
  for (let copy = 0; copy < copyCount; copy += 1) {
    images.forEach(image => repeated.push(image));
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .page { display: block; width: 100%; height: auto; page-break-after: always; break-after: page; }
    .page:last-child { page-break-after: auto; break-after: auto; }
  </style>
</head>
<body>
  ${repeated.map((image, index) => `<img class="page" src="${image.dataUrl}" alt="Page ${index + 1}" />`).join('\n')}
</body>
</html>`;

  const frame = createPrintFrame();
  const doc = frame.contentDocument || frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const imagesInFrame = Array.from(doc.images || []);
  await Promise.all(
    imagesInFrame.map(img => {
      if (img.complete) return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      }).then(() => (img.decode ? img.decode().catch(() => {}) : undefined));
    })
  );

  // Ek frame layout ke liye ruk jayein, phir usi iframe se print dialog kholein.
  await new Promise(resolve => setTimeout(resolve, 300));
  try {
    frame.contentWindow.focus();
    frame.contentWindow.print();
  } finally {
    setTimeout(() => {
      try { frame.remove(); } catch (_) { /* ignore */ }
    }, 60_000);
  }
}

export async function getPdfPageCount(source) {
  const pdfjs = await loadPdfjs();
  const params = typeof source === 'string' ? { url: source } : { data: source };
  const pdf = await pdfjs.getDocument(params).promise;
  return pdf.numPages;
}

export async function printPdf(source, { copies = 1, title = 'Print' } = {}) {
  const resolved = typeof source?.then === 'function' ? await source : source;
  const images = await renderPdfPages(resolved);
  if (!images.length) throw new Error('PDF mein koi page nahi mila.');
  const landscape = images[0].width > images[0].height;
  await printImages(images, { landscape, copies, title });
}

export async function printImageFile(file, { copies = 1, title } = {}) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const probe = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = objectUrl;
    });

    await printImages(
      [{ dataUrl: objectUrl, width: probe.width, height: probe.height }],
      { landscape: probe.width > probe.height, copies, title: title || file?.name || 'Print' }
    );
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }
}

export async function printLocalFile(file, { copies = 1 } = {}) {
  if (!file) throw new Error('Pehle PDF ya image file select karein.');
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);

  if (isPdf) {
    await printPdf(file.arrayBuffer().then(buffer => new Uint8Array(buffer)), {
      copies,
      title: file.name
    });
    return;
  }
  if (isImage) {
    await printImageFile(file, { copies, title: file.name });
    return;
  }
  throw new Error('Sirf PDF ya image file print ho sakti hai. Word file ko pehle PDF mein save karein.');
}
