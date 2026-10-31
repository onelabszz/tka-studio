/**
 * TKA Studio — lib/doc-extractor.js
 * © 2026 Ekwan Nugroho — Wonogiri
 * Client-side text extraction untuk PDF, DOCX, TXT.
 */

async function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Gagal memuat library: ' + src));
    document.head.appendChild(script);
  });
}

async function extractPDF(file) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  if (!window.pdfjsLib) throw new Error('pdf.js gagal dimuat');
  
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + '\n\n';
  }
  return text.trim();
}

async function extractDOCX(file) {
  await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js');
  if (!window.mammoth) throw new Error('mammoth.js gagal dimuat');
  
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function extractTXT(file) {
  return (await file.text()).trim();
}

export async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.pdf')) return extractPDF(file);
  if (name.endsWith('.docx')) return extractDOCX(file);
  if (name.endsWith('.txt') || name.endsWith('.md')) return extractTXT(file);
  if (name.endsWith('.doc')) {
    throw new Error('Format .doc (Word 97-2003) tidak didukung. Simpan ulang sebagai .docx atau PDF terlebih dahulu.');
  }
  throw new Error('Format file tidak didukung. Gunakan PDF, DOCX, atau TXT.');
}
