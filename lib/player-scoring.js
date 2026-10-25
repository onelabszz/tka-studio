/**
 * TKA Studio — lib/player-scoring.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */

function isAnswered(tipe, user, soal) {
  if (tipe === 'pg') return Number.isInteger(user);
  if (tipe === 'mcma') return Array.isArray(user) && user.length > 0;
  if (tipe === 'bs') {
    return Array.isArray(user)
      && user.length === soal.pernyataan.length
      && user.every(v => typeof v === 'boolean');
  }
  return false;
}

function isCorrect(tipe, user, soal) {
  if (tipe === 'pg') return Number.isInteger(user) && user === soal.key;

  if (tipe === 'mcma') {
    if (!Array.isArray(user) || !Array.isArray(soal.key)) return false;
    if (user.length !== soal.key.length) return false;
    const u = [...new Set(user)].sort((a, b) => a - b);
    const k = [...soal.key].sort((a, b) => a - b);
    return u.every((v, i) => v === k[i]);
  }

  if (tipe === 'bs') {
    if (!Array.isArray(user)) return false;
    if (user.length !== soal.pernyataan.length) return false;
    return soal.pernyataan.every((p, i) => user[i] === p.key);
  }
  return false;
}

export function scoreAttempt(paket, answers) {
  const perType = {
    pg:   { correct: 0, total: 0, answered: 0 },
    mcma: { correct: 0, total: 0, answered: 0 },
    bs:   { correct: 0, total: 0, answered: 0 },
  };

  const detail = paket.soal.map((s, index) => {
    const user = answers[s.id];
    const answered = isAnswered(s.tipe, user, s);
    const correct = answered && isCorrect(s.tipe, user, s);

    if (perType[s.tipe]) {
      perType[s.tipe].total++;
      if (answered) perType[s.tipe].answered++;
      if (correct) perType[s.tipe].correct++;
    }

    return {
      index,
      soalId: s.id,
      tipe: s.tipe,
      q: s.q,
      user: user,
      key: s.key,
      pernyataan: s.pernyataan,
      options: s.options,
      pembahasan: s.pembahasan,
      answered,
      correct,
    };
  });

  const score = detail.filter(d => d.correct).length;
  const answeredCount = detail.filter(d => d.answered).length;
  const total = paket.soal.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  return { score, total, answeredCount, pct, perType, detail };
}