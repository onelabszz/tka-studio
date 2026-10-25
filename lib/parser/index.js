/**
 * TKA Studio — lib/parser/index.js
 * © 2026 Ekwan Nugroho — Wonogiri
 * All rights reserved.
 *
 * Parser toleran untuk output AI (JSON atau CSV).
 */

// Fungsi untuk memperbaiki teks LaTeX yang rusak karena escape JSON
function fixLatexEscapes(str) {
  return String(str)
    // AI kadang menulis \frac tapi JSON membacanya sebagai \x0C (Form Feed) + rac
    .replace(/\x0Crac/g, '\\frac')
    .replace(/\x0Csqrt/g, '\\sqrt')
    // AI kadang menulis \times tapi JSON membacanya sebagai \t (Tab) + imes
    .replace(/\times/g, '\\times')
    .replace(/\theta/g, '\\theta');
}

function stripFences(text) {
  return String(text || '')
    .replace(/^\s*```(?:json|csv|javascript|)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

function stripPreamble(text) {
  const idxBrace = text.indexOf('{');
  const idxSep = text.search(/^sep\s*=/im);
  const idxNo = text.search(/^no\s*;\s*tipe/im);

  const candidates = [idxBrace, idxSep, idxNo].filter((i) => i >= 0);
  if (candidates.length === 0) return text;
  return text.slice(Math.min(...candidates));
}

function tryParseJSON(text) {
  let t = text.trim();
  if (!t.startsWith('{')) return null;

  // Reviver berfungsi untuk memperbaiki semua string di dalam objek JSON saat di-parse
  const reviver = (key, value) => {
    if (typeof value === 'string') return fixLatexEscapes(value);
    return value;
  };

  try { return JSON.parse(t, reviver); } catch {}

  const fixed = t.replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(fixed, reviver); } catch {}

  const lastBrace = t.lastIndexOf('}');
  if (lastBrace > 0 && lastBrace < t.length - 1) {
    const trimmed = t.slice(0, lastBrace + 1);
    try { return JSON.parse(trimmed, reviver); } catch {}
    try { return JSON.parse(trimmed.replace(/,\s*([}\]])/g, '$1'), reviver); } catch {}
  }
  return null;
}

function tryParseCSV(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    if (/^sep\s*=/i.test(line)) continue;
    if (/^no\s*;\s*tipe\s*;/i.test(line)) continue;
    rows.push(line);
  }
  if (rows.length === 0) return null;

  const soal = [];
  for (const line of rows) {
    const parts = line.split(';');
    if (parts.length < 3) continue;
    const [, tipe, q, img, opsiA, , opsiB, , opsiC, , opsiD, , kunci, pembahasan] = parts;
    const tipo = String(tipe || '').toLowerCase().trim();
    if (!tipo) continue;

    const item = {
      tipe: tipo,
      q: String(q || '').trim(),
      pembahasan: String(pembahasan || '').trim(),
    };
    if (img && img.trim()) item.img = img.trim();

    if (tipo === 'pg' || tipo === 'mcma') {
      item.options = [opsiA, opsiB, opsiC, opsiD].map((x) => String(x || '').trim()).filter(Boolean);
      const kun = String(kunci || '').trim();
      if (tipo === 'pg') {
        item.key = kun.toUpperCase().trim();
      } else {
        item.key = kun.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else if (tipo === 'bs') {
      const texts = [opsiA, opsiB, opsiC, opsiD].map((x) => String(x || '').trim());
      const keys = String(kunci || '').split(',').map((s) => s.trim().toUpperCase());
      item.pernyataan = [];
      for (let i = 0; i < texts.length; i++) {
        if (!texts[i]) continue;
        const k = keys[i];
        item.pernyataan.push({
          teks: texts[i],
          key: k === 'B' || k === 'BENAR' || k === 'TRUE',
        });
      }
    } else {
      continue;
    }
    soal.push(item);
  }

  if (soal.length === 0) return null;
  return { soal };
}

/**
 * @returns {{ ok: boolean, format: 'json'|'csv'|null, raw: object|null, error: string|null }}
 */
export function smartParse(input) {
  if (!input || !input.trim()) {
    return { ok: false, format: null, raw: null, error: 'Input kosong' };
  }

  let text = stripFences(input);
  text = stripPreamble(text);

  const jsonResult = tryParseJSON(text);
  if (jsonResult && (Array.isArray(jsonResult.soal) || Array.isArray(jsonResult.questions))) {
    if (Array.isArray(jsonResult.questions) && !Array.isArray(jsonResult.soal)) {
      jsonResult.soal = jsonResult.questions;
    }
    return { ok: true, format: 'json', raw: jsonResult, error: null };
  }

  const csvResult = tryParseCSV(text);
  if (csvResult) {
    return { ok: true, format: 'csv', raw: csvResult, error: null };
  }

  return {
    ok: false,
    format: null,
    raw: null,
    error: 'Tidak bisa mengenali format. Pastikan hasilnya JSON valid atau CSV (pemisah titik koma).',
  };
}
