/**
 * TKA Studio — lib/doc-prompt.js
 * © 2026 Ekwan Nugroho — Wonogiri
 * Prompt khusus untuk konversi dokumen bank soal ke JSON v1.1
 */

export function buildDocConversionPrompt(docText, meta = {}) {
  const mapel = meta.mapel || 'Umum';
  const kelas = meta.kelas || '-';
  const judul = meta.judul || 'Paket dari Dokumen';

  return `Anda adalah asisten konversi bank soal profesional.

TUGAS:
Ubah dokumen bank soal di bawah menjadi format JSON TKA Studio v1.1.
JANGAN membuat soal baru. HANYA konversi soal yang sudah ada.

FORMAT JSON YANG DIHARAPKAN:
{
  "version": "1.1",
  "id": "slug-paket",
  "judul": "${judul}",
  "mapel": "${mapel}",
  "durasiMenit": 30,
  "acakMode": "per-tipe",
  "latihanMandiri": true,
  "soal": [
    {
      "id": "s1",
      "tipe": "pg",
      "q": "Teks pertanyaan lengkap?",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "key": 0,
      "pembahasan": "Penjelasan jawaban"
    },
    {
      "id": "s2",
      "tipe": "mcma",
      "q": "Pilih semua jawaban benar?",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "key": [0, 2],
      "pembahasan": "Penjelasan"
    },
    {
      "id": "s3",
      "tipe": "bs",
      "q": "Tentukan Benar/Salah:",
      "pernyataan": [
        {"teks": "Pernyataan 1", "key": true},
        {"teks": "Pernyataan 2", "key": false}
      ],
      "pembahasan": "Penjelasan"
    }
  ]
}

ATURAN KONVERSI:
1. Pilihan Ganda biasa → tipe "pg", key berupa angka 0-3 (index jawaban benar, dimulai 0).
2. Pilihan Ganda Kompleks (lebih dari 1 jawaban benar) → tipe "mcma", key berupa array angka urut menaik (contoh: [0, 2]).
3. Soal Benar/Salah → tipe "bs", minimal 2 pernyataan, key boolean (true/false).
4. Teks soal (q): TANPA nomor soal, tanpa label "Soal 1", tanpa instruksi umum.
5. Opsi jawaban: TANPA huruf "A.", "B.", dll. Hanya teks murni.
6. Rumus matematika: gunakan LaTeX dengan delimiter $...$ (contoh: $\\frac{1}{2}$).
7. Pembahasan: isi jika ada. Jika tidak ada, kosongkan ("").
8. Jika ada soal ambigu atau tidak lengkap, LEBIH BAIK LEWATKAN daripada memaksakan.

INSTRUKSI OUTPUT FINAL:
- Berikan HANYA kode JSON valid.
- JANGAN gunakan markdown block (\`\`\`json ... \`\`\`).
- JANGAN berikan komentar atau penjelasan tambahan.
- JSON harus bisa langsung di-parse.

DOKUMEN BANK SOAL:
==============================================
${docText}
==============================================

Silakan konversi semua soal di atas ke format JSON v1.1.`;
}
