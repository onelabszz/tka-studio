import { buildPrompt } from './prompt-template.js';

const PANDUAN_MATEMATIKA = `
=== PANDUAN SOAL TKA MATEMATIKA (KEMENDIKBUD) ===
1. WAJIB menggunakan KONTEKS KEHIDUPAN SEHARI-HARI (belanja, pertanian, bangun ruang, waktu, dsb).
2. Soal harus menguji PENALARAN dan PEMECAHAN MASALAH, bukan sekadar hafalan rumus.
3. Fokus pada materi: Bilangan (pecahan, KPK/FPB), Geometri (luas, volume, satuan), dan Data.
4. Bentuk soal MCMA sangat disarankan, di mana siswa harus memilih beberapa pernyataan benar dari hasil hitungan mereka.

=== FORMAT RUMUS MATEMATIKA (WAJIB DIPATUHI) ===
Tuliskan rumus matematika menggunakan format LaTeX yang dibungkus tanda dolar tunggal ($...$).
Gunakan HANYA perintah sederhana: $\\frac{1}{2}$, $2\\frac{1}{2}$, $\\sqrt{16}$, $x^2$, $\\times$, $\\div$, $\\%$, $^{\\circ}$, $\\pi$, $\\neq$, $\\geq$, $\\leq$.
DILARANG menggunakan \\begin{}, \\end{}, \\displaystyle, \\text{}.
Satuan (cm, kg) tulis di luar tanda dolar.
`;

const PANDUAN_BAHASA_INDONESIA = `
=== PANDUAN SOAL TKA BAHASA INDONESIA (KEMENDIKBUD) ===
1. TEKS BACAAN: 150-200 kata, kalimat SPOK (3-7 kata).
2. KOMPETENSI: 30% Tekstual, 40% Inferensial, 30% Apresiasi.
3. Bentuk soal MCMA dan B/S sangat disarankan untuk menguji pemahaman mendalam.
`;

const KARAKTERISTIK_TIPE = {
  pg: `=== KARAKTERISTIK SOAL PG ===\n- 4 opsi (A, B, C, D). Tepat 1 jawaban benar.`,
  mcma: `=== KARAKTERISTIK SOAL MCMA ===\n- 4 opsi. 2-3 jawaban benar. field "key" adalah array menaik: [0, 2].`,
  bs: `=== KARAKTERISTIK SOAL B/S ===\n- 3-5 pernyataan. WAJIB campuran Benar dan Salah. field "key": true/false.`,
  campur: `=== KARAKTERISTIK SOAL CAMPURAN ===\nBuat campuran PG, MCMA, dan B/S secara seimbang.`
};

const PANDUAN_LEVEL = {
  auto: `Level kognitif seimbang (C1-C6).`,
  c1c2: `Level kognitif C1-C2 (Hafalan/Pemahaman).`,
  c3: `Level kognitif C3 (Penerapan).`,
  c4c6: `Level kognitif C4-C6 (Analisis/Evaluasi).`
};

export function buildExpertPrompt(workspace, batchTarget) {
  const { mapel, kelas, topik, kompetensi, teks_wacana, soal, tipe_fokus, level_kognitif, sertakan_gambar } = workspace;
  
  const soalTerdahulu = (soal || []).map((s, i) => `${i + 1}. [${s.tipe.toUpperCase()}] ${s.q.substring(0, 80)}...`).join('\n');

  const konteksWacana = teks_wacana ? `=== TEKS WACANA ACUAN ===\n"${teks_wacana}"\nSEMUA SOAL WAJIB MENGACU PADA TEKS DI ATAS.\n` : '';
  const konteksDuplikasi = soalTerdahulu ? `=== SOAL YANG SUDAH ADA (JANGAN DUPLIKAT) ===\n${soalTerdahulu}\n` : '';
  const karakteristik = KARAKTERISTIK_TIPE[tipe_fokus || 'campur'];
  const panduanLevel = PANDUAN_LEVEL[level_kognitif || 'auto'];

  let panduanMapel = '';
  if (mapel.toLowerCase().includes('matematika')) panduanMapel = PANDUAN_MATEMATIKA;
  else if (mapel.toLowerCase().includes('indonesia')) panduanMapel = PANDUAN_BAHASA_INDONESIA;

  const aturanGambar = sertakan_gambar ? `
=== ATURAN GAMBAR ===
Sertakan gambar pada 20% soal. Isi field "img" (nama file) dan "img_ref" (keyword Google Images).
` : `=== ATURAN GAMBAR ===\nJANGAN hasilkan soal bergambar.`;

  // Kita buat instruksi format JSON yang SANGAT JELAS untuk MCMA & BS
  const formatJSON = `
=== FORMAT OUTPUT WAJIB (JSON) ===
Hasilkan HANYA JSON valid. Struktur:
{
  "soal": [
    {
      "id": "s1",
      "tipe": "pg", 
      "q": "Teks soal PG...",
      "options": ["A", "B", "C", "D"],
      "key": 2,
      "pembahasan": "..."
    },
    {
      "id": "s2",
      "tipe": "mcma",
      "q": "Teks soal MCMA...",
      "options": ["A", "B", "C", "D"],
      "key": [0, 2],
      "pembahasan": "..."
    },
    {
      "id": "s3",
      "tipe": "bs",
      "q": "Tentukan B/S pernyataan berikut:",
      "pernyataan": [
        { "teks": "Pernyataan 1", "key": true },
        { "teks": "Pernyataan 2", "key": false }
      ],
      "pembahasan": "..."
    }
  ]
}
`;

  return `Anda adalah mesin pembuat soal TKA profesional (Standar Kemendikbud).

${konteksWacana}
${konteksDuplikasi}

=== TUGAS BATCH INI ===
Buat TEPAT ${batchTarget} soal BARU.
Mata Pelajaran: ${mapel}
Kelas: ${kelas}
Submateri: ${topik || 'Umum'}
Kompetensi: ${kompetensi || '-'}

${karakteristik}
${panduanLevel}
${panduanMapel}
${aturanGambar}

=== INSTRUKSI WAJIB ===
1. JANGAN mengulang soal yang sudah ada.
2. JIKA TIPE FOKUS ADALAH "CAMPUR", BUATLAH CAMPURAN PG, MCMA, DAN B/S. JANGAN HANYA MEMBUAT PG!
3. Pembahasan wajib 1-2 kalimat.

${formatJSON}
`;
}
