/**
 * TKA Studio — lib/expert-prompt.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { buildPrompt } from './prompt-template.js';

const KARAKTERISTIK_TIPE = {
  pg: `=== KARAKTERISTIK SOAL PG (PILIHAN GANDA) ===
- 4 opsi: A, B, C, D
- Tepat 1 jawaban benar, 3 distraktor
- Distraktor WAJIB berdasarkan miskonsepsi umum siswa (bukan asal beda angka)
- JANGAN gunakan opsi "semua benar", "semua salah", atau "bukan salah satu"
- JANGAN gunakan negatif ganda ("bukan tidak...")
- Distribusi kunci HARUS seimbang (A, B, C, D masing-masing ~25%)
- Stem soal harus jelas dan mandiri (siswa paham apa yang ditanya tanpa baca opsi dulu)
- Panjang opsi harus SEIMBANG — jawaban benar tidak boleh mencolok lebih panjang
- field "key" adalah integer indeks (0=A, 1=B, 2=C, 3=D)`,

  mcma: `=== KARAKTERISTIK SOAL MCMA (PILIHAN GANDA KOMPLEKS) ===
- 4 atau 5 opsi
- 2-3 jawaban benar (WAJIB minimal 2)
- Setiap jawaban benar harus INDEPENDEN (bisa diverifikasi satu per satu)
- Setiap distraktor HARUS jelas salah (tidak ambigu, tidak "hampir benar")
- Stem WAJIB pakai "Manakah yang..." atau "Pilihlah pernyataan yang..."
- JANGAN gunakan "semua benar" atau "semua salah" sebagai distraktor
- Urutan field "key" HARUS menaik: [0, 2, 3] bukan [3, 0, 2]
- field "key" adalah array integer (contoh: [0, 2])`,

  bs: `=== KARAKTERISTIK SOAL B/S (BENAR/SALAH) ===
- 3-5 pernyataan per soal
- WAJIB campuran Benar dan Salah (minimal 1 benar dan 1 salah)
- JANGAN buat semua pernyataan Benar atau semua Salah
- Setiap pernyataan: 5-15 kata, jelas, tidak ambigu
- Setiap pernyataan menguji ASPEK BERBEDA (jangan dua pernyataan yang mirip)
- Stem umum: "Tentukan Benar atau Salah pernyataan berikut:"
- field "pernyataan" adalah array objek {teks: string, key: boolean}
- key: true = Benar, false = Salah`,

  campur: `=== KARAKTERISTIK SOAL CAMPURAN ===
Buat campuran tipe soal secara seimbang. Contoh untuk 5 soal:
- 2 soal PG
- 2 soal MCMA  
- 1 soal BS
Ikuti karakteristik masing-masing tipe di atas.`
};

const PANDUAN_LEVEL = {
  auto: `Level kognitif mengikuti tingkat kesulitan: seimbangkan antara pemahaman (C1-C2), penerapan (C3), dan analisis (C4-C6).`,
  
  c1c2: `=== LEVEL KOGNITIF: C1-C2 (Pemahaman Tekstual) ===
- C1 (Mengingat): menyebutkan, mengidentifikasi, mendaftar fakta/informasi tersurat
- C2 (Memahami): menjelaskan, merangkum, menyusun ulang, mengelompokkan
- Stem biasanya: "Siapa...", "Apa...", "Di mana...", "Kapan...", "Sebutkan..."
- Jawaban bisa ditemukan LANGSUNG di teks/konteks`,

  c3: `=== LEVEL KOGNITIF: C3 (Penerapan/Inferensial) ===
- Menerapkan konsep ke situasi baru
- Menyimpulkan informasi yang tersirat
- Menjelaskan hubungan sebab-akibat
- Stem biasanya: "Mengapa...", "Bagaimana...", "Apa yang akan terjadi jika..."
- Jawaban butuh PENALARAN, tidak ada langsung di teks`,

  c4c6: `=== LEVEL KOGNITIF: C4-C6 (Analisis & Evaluasi) ===
- C4 (Analisis): menganalisis struktur, membandingkan, membedakan
- C5 (Evaluasi): menilai, mengkritik, memutuskan berdasarkan kriteria
- C6 (Mencipta): merancang, mengusulkan solusi alternatif
- Stem biasanya: "Menurut Anda...", "Manakah argumen terkuat...", "Apa kelemahan..."
- Jawaban butuh ANALISIS MENDALAM, bukan hafalan`
};

export function buildExpertPrompt(workspace, batchTarget) {
  const { mapel, kelas, topik, teks_wacana, soal, tipe_fokus, level_kognitif } = workspace;
  
  const soalTerdahulu = (soal || []).map((s, i) => {
    return `${i + 1}. [${s.tipe.toUpperCase()}] ${s.q.substring(0, 100)}... (Kunci: ${JSON.stringify(s.key)})`;
  }).join('\n');

  const konteksWacana = teks_wacana 
    ? `=== TEKS WACANA ACUAN (WAJIB DIGUNAKAN) ===\n"${teks_wacana}"\n\nSEMUA SOAL WAJIB MENGACU PADA TEKS DI ATAS.\n` 
    : '';

  const konteksDuplikasi = soalTerdahulu 
    ? `=== SOAL YANG SUDAH ADA (JANGAN BUAT SOAL YANG MIRIP/DUPLIKAT) ===\n${soalTerdahulu}\n` 
    : '';

  const karakteristik = KARAKTERISTIK_TIPE[tipe_fokus || 'campur'] || KARAKTERISTIK_TIPE.campur;
  const panduanLevel = PANDUAN_LEVEL[level_kognitif || 'auto'] || PANDUAN_LEVEL.auto;

  const isBahasa = mapel.toLowerCase().includes('indonesia');
  const panduanKemendikbud = isBahasa ? `
=== PANDUAN KHUSUS BAHASA INDONESIA (KEMENDIKBUD) ===
Kompetensi yang harus dicakup:
1. Pemahaman Tekstual (30%): mengidentifikasi informasi tersurat, kosakata, menyusun ulang.
2. Pemahaman Inferensial (40%): menyimpulkan ide pokok, amanat, perasaan tokoh, makna ungkapan.
3. Evaluasi & Apresiasi (30%): menilai relevansi, kesesuaian antarunsur, respons emosional.
` : '';

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

${panduanKemendikbud}

=== INSTRUKSI WAJIB ===
1. JANGAN mengulang soal yang sudah ada di daftar "SOAL YANG SUDAH ADA"
2. Setiap soal WAJIB punya pembahasan 1-2 kalimat yang edukatif
3. Distribusi kunci jawaban HARUS seimbang (jangan mayoritas satu huruf)
4. Variasikan panjang opsi (jangan ada yang mencolok)
5. Output HANYA JSON valid, tanpa markdown fence, tanpa teks pembuka/penutup

${base.split('=== SPESIFIKASI SOAL ===')[1] || base}
`;
}
