import { Agent } from '../types';

const getEnv = (key: string): string | undefined => {
  const fromProcess = typeof process !== 'undefined' ? (process as any)?.env?.[key] : undefined;
  const fromImportMeta = typeof import.meta !== 'undefined' ? (import.meta as any)?.env?.[key] : undefined;
  const raw = fromProcess ?? fromImportMeta;
  if (!raw || typeof raw !== 'string') return undefined;
  const val = raw.trim().replace(/^['"]|['"]$/g, '');
  return val || undefined;
};

const parseListEnv = (keys: string[]): string[] | undefined => {
  for (const key of keys) {
    const v = getEnv(key);
    if (v) {
      const arr = v.split(',').map(s => s.trim()).filter(Boolean);
      if (arr.length) return arr;
    }
  }
  return undefined;
};

// Candidate defaults: customize via env to ensure availability in your API account.
// Lista solicitada (normalizada para nomes conhecidos do Gemini TTS):
// Puck, Charon, Fenrir, Orus, Enceladus, Iapetus, Umbriel,
// Algieba, Algenib, Rasalgethi, Alnilam, Schedar, Achird,
// Zubenelgenubi, Sadachbia, Sadaltager
const maleVoicesDefault = [
  'Puck',
  'Charon',
  'Fenrir',
  'Orus',
  'Enceladus',
  'Iapetus', // nota: algumas fontes usam "Lapetus"; "Iapetus" é o nome usado nas listas públicas
  'Umbriel',
  'Algieba',
  'Algenib',
  'Rasalgethi',
  'Alnilam', // corrigido de "Alnilan"
  'Schedar',
  'Achird',
  'Zubenelgenubi',
  'Sadachbia', // corrigido de "Sadaschbia"
  'Sadaltager',
];
const femaleVoicesDefault = [
  'Zephyr',
  'Kore',
  'Aoede',
  'Urania',
  'Thalia',
  'Callirrhoe',
  'Autonoe',
  'Despina',
  'Laomedeia',
  'Leda',
  'Erinome',
  'Gacrux',
  'Sulafat',
  'Achernar',
  'Vindemiatrix',
];

const maleVoices = parseListEnv(['VITE_TTS_MALE_VOICES', 'GEMINI_TTS_MALE_VOICES']) || maleVoicesDefault;
const femaleVoices = parseListEnv(['VITE_TTS_FEMALE_VOICES', 'GEMINI_TTS_FEMALE_VOICES']) || femaleVoicesDefault;

const stableIndex = (id: string, len: number): number => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return len > 0 ? (h % len) : 0;
};

export const getPreferredVoice = (agent: Agent): string => {
  const desired = agent.voice?.trim();
  if (desired) return desired;
  if (agent.gender === 'male') return maleVoices[stableIndex(agent.id, maleVoices.length)] || 'Charon';
  if (agent.gender === 'female') return femaleVoices[stableIndex(agent.id, femaleVoices.length)] || 'Zephyr';
  const all = [...maleVoices, ...femaleVoices];
  return all[stableIndex(agent.id, all.length)] || 'Zephyr';
};

export const getFallbackVoice = (agent: Agent): string => {
  if (agent.gender === 'male') return 'Charon';
  if (agent.gender === 'female') return 'Zephyr';
  return 'Zephyr';
};