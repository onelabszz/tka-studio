/**
 * TKA Studio — lib/doc-prompt.js
 * © 2026 Ekwan Nugroho — Wonogiri
 * Prompt khusus untuk konversi dokumen bank soal ke JSON v1.1
 */

export function buildDocConversionPrompt(docText, meta = {}) {
  const mapel = meta.mapel || 'Umum';
  const kelas = meta.kelas || '-';
  const judul = meta.judul || 'Paket dari Dokumen';

  return `Anda adalah asisten konversi bank soal profesional yang teliti dan patuh pada aturan.

TUGAS:
Ubah dokumen bank soal di bawah menjadi format JSON TKA Studio v1.1.
JANGAN membuat soal baru. JANGAN mengarang kunci jawaban jika tidak ada di dokumen. HANYA konversi data yang ada.

FORMAT JSON YANG DIHARAPKAN:
{
  "version": "1.1",
  "id": "slug-paket",
  "judul": "${judul}",
  "mapel": "${mapel}",
  "durasiMenit": 30,
  "acakMode": "per-tipe",
  "latihanMandiri": true,
  "wacana": "Teks bacaan panjang (jika ada, kosongkan jika tidak ada)",
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

ATURAN KONVERSI (SANGAT PENTING):
1. TIPE SOAL: 
   - Pilihan Ganda biasa -> tipe "pg", key angka 0-3.
   - Pilihan Ganda Kompleks (lebih dari 1 jawaban) -> tipe "mcma", key array menaik (contoh: [0, 2]).
   - Benar/Salah -> tipe "bs", minimal 2 pernyataan, key boolean (true/false).
2. PEMBERSIHAN TEKS (q): 
   - Hapus nomor soal ("1.", "Soal 1").
   - Hapus instruksi umum seperti "Pilihlah jawaban yang benar".
   - JANGAN menyertakan opsi jawaban di dalam teks pertanyaan (q).
3. OPSI JAWABAN: 
   - Hapus label huruf ("A.", "B.", "C.", "D."). Cukup teks jawabannya saja.
4. WACANA (TEKS BACAAN PANJANG):
   - Jika di awal dokumen ada teks bacaan panjang, masukkan ke field "wacana".
   - JANGAN menduplikasi teks wacana tersebut ke dalam setiap pertanyaan (q).
5. GAMBAR:
   - Jika soal membutuhkan gambar (contoh: "Perhatikan gambar berikut"), tambahkan field "img_ref": "deskripsi singkat gambar".
   - JANGAN membuat field "img" atau "img_data" (base64). Biarkan kosong.
6. KUNCI JAWABAN TERPISAH:
   - Jika kunci jawaban terletak di halaman terakhir atau tabel terpisah, cocokkan kunci tersebut dengan soal yang sesuai.
7. MATEMATIKA (LaTeX):
   - Wajib menggunakan format $...$ untuk rumus. Contoh: $\\frac{1}{2}$ atau $x^2 + y^2 = z^2$.
   - Escape backslash dengan benar (gunakan \\\\frac jika perlu, tapi utamakan $...$).
8. PEMBAHASAN:
   - Jika dokumen menyertakan pembahasan, masukkan ke field "pembahasan".
   - Jika tidak ada, isi dengan string kosong "".
9. SOAL RUSAK/AMBIGU:
   - Jika ada soal yang tidak lengkap (misal: tidak ada opsi jawaban), LEWATKAN (jangan dimasukkan ke array).

INSTRUKSI OUTPUT FINAL:
- Berikan HANYA kode JSON valid.
- JANGAN gunakan markdown block (\`\`\`json ... \`\`\`).
- JANGAN berikan komentar atau teks pengantar apapun.
- Pastikan string JSON menggunakan tanda kutip dua (") dan escape karakter khusus dengan benar.

DOKUMEN BANK SOAL:
==============================================
${docText}
==============================================

Silakan konversi dokumen di atas ke format JSON v1.1.`;
}