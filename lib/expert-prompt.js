/**
 * TKA Studio — lib/expert-prompt.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { buildPrompt } from './prompt-template.js';

// ==========================================
// PANDUAN KHUSUS KEMENDIKBUD (PUSMENDIK)
// ==========================================

const PANDUAN_MATEMATIKA = `
=== PANDUAN SOAL TKA MATEMATIKA (KEMENDIKBUD) ===
1. DILARANG membuat soal operasi hitung langsung (misal: "Berapakah 5 x 4?").
2. WAJIB menggunakan KONTEKS KEHIDUPAN SEHARI-HARI (belanja, pertanian, bangun ruang, waktu, dsb).
3. Soal harus menguji PENALARAN dan PEMECAHAN MASALAH, bukan sekadar hafalan rumus.
4. Fokus pada materi: Bilangan (pecahan, KPK/FPB), Geometri (luas, volume, satuan), dan Data.
5. Bentuk soal MCMA (Pilihan Ganda Kompleks) sangat disarankan, di mana siswa harus memilih beberapa pernyataan benar dari hasil hitungan mereka.
6. Untuk soal B/S, sajikan pernyataan yang membandingkan dua hasil perhitungan (misal: "Berat mi instan lebih dari 0,5 kg").

=== FORMAT RUMUS MATEMATIKA (SANGAT PENTING) ===
- Tuliskan SEMUA rumus matematika, angka pecahan, akar, pangkat, dan simbol menggunakan format LaTeX yang dibungkus tanda dolar ($...$).
- KARENA OUTPUT ANDA ADALAH JSON, ANDA WAJIB MENULIS DOUBLE BACKSLASH (\\\\frac) UNTUK SETIAP PERINTAH LATEX AGAR TIDAK ERROR.
- Contoh yang BENAR: "$\\\\frac{1}{2}$", "$\\\\sqrt{16}$", "$\\\\times$".
- Contoh yang SALAH (akan error): "$\\frac{1}{2}$".
- JANGAN menulis "1/2" atau "akar 16" dalam teks biasa.
`;

const PANDUAN_BAHASA_INDONESIA = `
=== PANDUAN SOAL TKA BAHASA INDONESIA (KEMENDIKBUD) ===
1. TEKS BACAAN: 
   - Panjang teks 150-200 kata (kecuali puisi).
   - Kalimat harus 3-7 kata dengan pola dasar SPOK.
   - Jenis teks: Teks Informasi (fakta lokal/nasional) atau Teks Fiksi (fantasi/sejarah, latar konkret, tokoh datar, konflik tunggal, alur maju, sudut pandang orang pertama).
2. KOMPETENSI YANG DIUJI (Distribusi: 30% Tekstual, 40% Inferensial, 30% Apresiasi):
   - Pemahaman Tekstual (Eksplisit): Menemukan informasi tersurat, kosakata, menyusun ulang.
   - Pemahaman Inferensial (Tersirat): Menyimpulkan ide pokok, amanat, perasaan tokoh, makna ungkapan/konotatif terbatas, atau perubahan sederhana pada objek/latar.
   - Evaluasi & Apresiasi: Menilai relevansi peristiwa dengan kehidupan, menilai kesesuaian antarunsur, atau respons emosional terhadap teks fiksi.
3. Bentuk soal PGK MCMA (Kompleks) dan PGK Kategori (B/S) sangat disarankan untuk menguji pemahaman mendalam.
`;

// ==========================================
// LOGIKA PROMPT EXPERT
// ==========================================

const KARAKTERISTIK_TIPE = {
  pg: `=== KARAKTERISTIK SOAL PG (PILIHAN GANDA) ===
- 4 opsi: A, B, C, D. Tepat 1 jawaban benar.
- Distraktor WAJIB berdasarkan miskonsepsi umum siswa.
- JANGAN gunakan opsi "semua benar/salah" atau negatif ganda.
- Stem soal harus mandiri dan jelas.`,

  mcma: `=== KARAKTERISTIK SOAL MCMA (PILIHAN GANDA KOMPLEKS) ===
- 4 atau 5 opsi. 2-3 jawaban benar.
- Jawaban benar independen (bisa diverifikasi satu per satu).
- Stem WAJIB pakai "Manakah yang..." atau "Pilihlah pernyataan yang...".
- Urutan field "key" HARUS menaik: [0, 2, 3].`,

  bs: `=== KARAKTERISTIK SOAL B/S (BENAR/SALAH) ===
- 3-5 pernyataan per soal. WAJIB campuran Benar dan Salah.
- Setiap pernyataan 5-15 kata, jelas, menguji aspek berbeda.
- Stem umum: "Tentukan Benar atau Salah pernyataan berikut:"`,

  campur: `=== KARAKTERISTIK SOAL CAMPURAN ===
Buat campuran tipe soal secara seimbang (PG, MCMA, B/S). Ikuti karakteristik masing-masing.`
};

const PANDUAN_LEVEL = {
  auto: `Level kognitif mengikuti tingkat kesulitan: seimbangkan C1-C2, C3, dan C4-C6.`,
  c1c2: `=== LEVEL KOGNITIF: C1-C2 ===\nFokus pada hafalan dan pemahaman langsung (menyebutkan, menjelaskan).`,
  c3: `=== LEVEL KOGNITIF: C3 ===\nFokus pada penerapan konsep di situasi baru dan penalaran sebab-akibat.`,
  c4c6: `=== LEVEL KOGNITIF: C4-C6 ===\nFokus pada analisis, evaluasi, dan mencipta (membandingkan, mengkritik, merancang).`
};

export function buildExpertPrompt(workspace, batchTarget) {
  const { mapel, kelas, topik, teks_wacana, soal, tipe_fokus, level_kognitif } = workspace;
  
  const soalTerdahulu = (soal || []).map((s, i) => {
    return `${i + 1}. [${s.tipe.toUpperCase()}] ${s.q.substring(0, 100)}... (Kunci: ${JSON.stringify(s.key)})`;
  }).join('\n');

  // Konteks Wacana disesuaikan agar AI tidak menyalin teks ke dalam 'q'
  const konteksWacana = teks_wacana 
    ? `=== TEKS WACANA ACUAN (WAJIB DIGUNAKAN) ===\n"${teks_wacana}"\n\nSEMUA SOAL WAJIB MENGACU PADA TEKS DI ATAS.\nCATATAN PENTING: JANGAN menyalin ulang teks wacana ini ke dalam field "q". Cukup buat pertanyaannya saja. Teks wacana akan digabungkan secara otomatis oleh sistem.\n` 
    : '';

  const konteksDuplikasi = soalTerdahulu 
    ? `=== SOAL YANG SUDAH ADA (JANGAN BUAT SOAL YANG MIRIP/DUPLIKAT) ===\n${soalTerdahulu}\n` 
    : '';

  const karakteristik = KARAKTERISTIK_TIPE[tipe_fokus || 'campur'] || KARAKTERISTIK_TIPE.campur;
  const panduanLevel = PANDUAN_LEVEL[level_kognitif || 'auto'] || PANDUAN_LEVEL.auto;

  // Deteksi Mapel untuk Panduan Khusus
  let panduanMapel = '';
  if (mapel.toLowerCase().includes('matematika')) {
    panduanMapel = PANDUAN_MATEMATIKA;
  } else if (mapel.toLowerCase().includes('indonesia')) {
    panduanMapel = PANDUAN_BAHASA_INDONESIA;
  }

  // Base prompt dengan dummy total (kita split nanti)
  const base = buildPrompt({
    mapel, kelas, topik,
    pg: batchTarget, mcma: 0, bs: 0,
    instruksiTambahan: 'Fokus pada kualitas HOTS.'
  });

  return `Anda adalah mesin pembuat soal TKA profesional yang mengikuti standar Kemendikbud. Anda membantu guru menyusun soal secara bertahap dengan KUALITAS TINGGI.

${konteksWacana}
${konteksDuplikasi}

=== TUGAS BATCH INI ===
Buat TEPAT ${batchTarget} soal BARU.
Topik: ${topik || 'Umum'}
Kelas: ${kelas}
Mata Pelajaran: ${mapel}

${karakteristik}

${panduanLevel}

${panduanMapel}

=== INSTRUKSI WAJIB ===
1. JANGAN mengulang soal yang sudah ada di daftar "SOAL YANG SUDAH ADA".
2. Setiap soal WAJIB punya pembahasan 1-2 kalimat yang edukatif.
3. Output HANYA JSON valid, tanpa markdown fence, tanpa teks pembuka/penutup.

${base.split('=== SPESIFIKASI SOAL ===')[1] || base}
`;
}
