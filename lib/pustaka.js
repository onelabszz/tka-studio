/**
 * TKA Studio — lib/pustaka.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { getSupabase } from '../supabase/client.js';

const CART_KEY = 'tka-kotak-soal-v1';

// ============== API SUPABASE ==============

export async function publishSoal(profile, paket, soal, meta) {
  const client = await getSupabase();
  const { error } = await client.from('pustaka_soal').insert({
    contributor_id: profile.id,
    contributor_nama: profile.nama || 'Guru',
    contributor_sekolah: profile.sekolah || '',
    mapel: meta.mapel,
    kelas: meta.kelas,
    topik: meta.topik,
    tipe: soal.tipe,
    q_text: soal.q,
    konten: soal
  });
  if (error) throw error;
}

export async function getPustakaItems(filters = {}, page = 1, limit = 10) {
  const client = await getSupabase();
  let query = client.from('pustaka_soal').select('*', { count: 'exact' });

  if (filters.mapel) query = query.eq('mapel', filters.mapel);
  if (filters.kelas) query = query.eq('kelas', filters.kelas);
  if (filters.tipe) query = query.eq('tipe', filters.tipe);
  if (filters.search) query = query.ilike('q_text', `%${filters.search}%`);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data || [], total: count || 0 };
}

export async function incrementDownload(id) {
  const client = await getSupabase();
  // RPC opsional, kita pakai update manual saja
  await client.rpc('increment_download', { row_id: id }).catch(async () => {
    // Fallback jika RPC belum dibuat
    const { data } = await client.from('pustaka_soal').select('download_count').eq('id', id).single();
    if (data) {
      await client.from('pustaka_soal').update({ download_count: (data.download_count || 0) + 1 }).eq('id', id);
    }
  });
}

// ============== LOGIKA KOTAK (localStorage) ==============

export function getKotak() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addToKotak(item) {
  const kotak = getKotak();
  // Cek duplikat
  if (kotak.find(x => x.id === item.id)) return false;
  kotak.push(item);
  localStorage.setItem(CART_KEY, JSON.stringify(kotak));
  return true;
}

export function removeFromKotak(id) {
  const kotak = getKotak().filter(x => x.id !== id);
  localStorage.setItem(CART_KEY, JSON.stringify(kotak));
}

export function clearKotak() {
  localStorage.removeItem(CART_KEY);
}
