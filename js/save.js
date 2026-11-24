// save.js — progress and settings in localStorage (every access is guarded: private mode may throw)
const SAVE_KEY = 'moy-aeroport-save-1';
const defaultSave = () => ({ v: 1, money: 200, upg: {}, lv: {}, set: { diff: 1, sound: 0.8, music: 0.6 } });
let SAVE = defaultSave();
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return;
    const s = JSON.parse(raw); if (!s || s.v !== 1) return;
    const d = defaultSave();
    SAVE = { v: 1, money: Number.isFinite(s.money) ? s.money : d.money, upg: s.upg || {}, lv: s.lv || {}, set: Object.assign(d.set, s.set || {}) };
  } catch (e) {}
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
function resetProgress() { const set = SAVE.set; SAVE = defaultSave(); SAVE.set = set; writeSave(); }
const levelStars = n => (SAVE.lv[n] && SAVE.lv[n].stars) || 0;
const levelUnlocked = n => n === 1 || levelStars(n - 1) > 0;
const totalScore = () => Object.values(SAVE.lv).reduce((a, l) => a + (l.score || 0), 0);
