/**
 * Bangla language utilities for the Converter tool.
 *  - toBanglaDigits / toEnglishDigits: exact, reliable.
 *  - englishToBangla: rule-based Avro-style phonetic transliteration.
 *  - unicodeToBijoy / bijoyToUnicode: compact mapping (beta).
 */

const EN_DIGITS = "0123456789";
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBanglaDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => BN_DIGITS[EN_DIGITS.indexOf(d)]);
}

export function toEnglishDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => EN_DIGITS[BN_DIGITS.indexOf(d)]);
}

/* -------------------------------------------------------------------------- */
/* English → Bangla (phonetic)                                                 */
/* -------------------------------------------------------------------------- */

type Pair = [string, string];

// Longest-first so multi-char keys win.
const CONSONANTS: Pair[] = [
  ["ksh", "ক্ষ"],
  ["chh", "ছ"],
  ["Sh", "ষ"],
  ["kh", "খ"],
  ["gh", "ঘ"],
  ["Ng", "ঙ"],
  ["ng", "ং"],
  ["ch", "চ"],
  ["jh", "ঝ"],
  ["Th", "ঠ"],
  ["th", "থ"],
  ["Dh", "ঢ"],
  ["dh", "ধ"],
  ["ph", "ফ"],
  ["bh", "ভ"],
  ["sh", "শ"],
  ["rh", "ঢ়"],
  ["k", "ক"],
  ["g", "গ"],
  ["c", "চ"],
  ["j", "জ"],
  ["T", "ট"],
  ["t", "ত"],
  ["D", "ড"],
  ["d", "দ"],
  ["N", "ণ"],
  ["n", "ন"],
  ["p", "প"],
  ["f", "ফ"],
  ["b", "ব"],
  ["m", "ম"],
  ["r", "র"],
  ["l", "ল"],
  ["s", "স"],
  ["h", "হ"],
  ["y", "য়"],
  ["w", "ও"],
  ["v", "ভ"],
  ["z", "জ"],
  ["q", "ক"],
  ["R", "ড়"],
  ["x", "ক্স"],
];

const IND_VOWELS: Pair[] = [
  ["OO", "উ"],
  ["oo", "উ"],
  ["ou", "ঔ"],
  ["oi", "ঐ"],
  ["aa", "আ"],
  ["ee", "ঈ"],
  ["ii", "ঈ"],
  ["uu", "ঊ"],
  ["rri", "ঋ"],
  ["a", "আ"],
  ["i", "ই"],
  ["u", "উ"],
  ["e", "এ"],
  ["o", "অ"],
];

const KARS: Pair[] = [
  ["oo", "ু"],
  ["ou", "ৌ"],
  ["oi", "ৈ"],
  ["aa", "া"],
  ["ee", "ী"],
  ["ii", "ী"],
  ["uu", "ূ"],
  ["rri", "ৃ"],
  ["a", "া"],
  ["i", "ি"],
  ["u", "ু"],
  ["e", "ে"],
  ["o", ""], // inherent vowel — no sign
];

function matchAt(list: Pair[], s: string, i: number): Pair | null {
  for (const pair of list) {
    if (s.startsWith(pair[0], i)) return pair;
  }
  return null;
}

function convertWord(w: string): string {
  let out = "";
  let i = 0;
  let prevCons = false;
  while (i < w.length) {
    const cm = matchAt(CONSONANTS, w, i);
    if (cm) {
      const [k, v] = cm;
      if (v === "ং") {
        out += v;
        prevCons = false;
      } else {
        if (prevCons) out += "্"; // hasanta between consecutive consonants
        out += v;
        prevCons = true;
      }
      i += k.length;
      continue;
    }
    const vm = matchAt(prevCons ? KARS : IND_VOWELS, w, i);
    if (vm) {
      out += vm[1];
      prevCons = false;
      i += vm[0].length;
      continue;
    }
    out += w[i];
    prevCons = false;
    i += 1;
  }
  return out;
}

export function englishToBangla(input: string): string {
  // Preserve whitespace/punctuation runs, transliterate letter runs.
  return input
    .split(/([A-Za-z]+)/)
    .map((chunk) => (/^[A-Za-z]+$/.test(chunk) ? convertWord(chunk) : chunk))
    .join("");
}

/* -------------------------------------------------------------------------- */
/* Bijoy ⇌ Unicode (beta)                                                      */
/* -------------------------------------------------------------------------- */

// Compact, internally consistent mapping. Covers the common glyph set; complex
// conjuncts may need manual touch-up. Ordered longest-first for replacement.
const UNI_TO_BIJOY: Pair[] = [
  ["ক্ষ", "ÿ"],
  ["ঞ্জ", "Ä"],
  ["ষ্ট", "ó"],
  ["ন্ন", "boe"],
  ["আ", "Av"],
  ["ই", "B"],
  ["ঈ", "C"],
  ["উ", "D"],
  ["ঊ", "E"],
  ["ঋ", "F"],
  ["এ", "G"],
  ["ঐ", "H"],
  ["ও", "I"],
  ["ঔ", "J"],
  ["অ", "A"],
  ["ক", "K"],
  ["খ", "L"],
  ["গ", "M"],
  ["ঘ", "N"],
  ["ঙ", "O"],
  ["চ", "P"],
  ["ছ", "Q"],
  ["জ", "R"],
  ["ঝ", "S"],
  ["ঞ", "T"],
  ["ট", "U"],
  ["ঠ", "V"],
  ["ড", "W"],
  ["ঢ", "X"],
  ["ণ", "Y"],
  ["ত", "Z"],
  ["থ", "_"],
  ["দ", "`"],
  ["ধ", "a"],
  ["ন", "b"],
  ["প", "c"],
  ["ফ", "d"],
  ["ব", "e"],
  ["ভ", "f"],
  ["ম", "g"],
  ["য", "h"],
  ["র", "i"],
  ["ল", "j"],
  ["শ", "k"],
  ["ষ", "l"],
  ["স", "m"],
  ["হ", "n"],
  ["ড়", "o"],
  ["ঢ়", "p"],
  ["য়", "q"],
  ["ৎ", "r"],
  ["ং", "s"],
  ["ঃ", "t"],
  ["ঁ", "u"],
  ["া", "v"],
  ["ি", "w"],
  ["ী", "x"],
  ["ু", "y"],
  ["ূ", "z"],
  ["ৃ", "…"],
  ["ে", "†"],
  ["ৈ", "‡"],
  ["ো", "†v"],
  ["ৌ", "†Š"],
  ["্", "&"],
  ["০", "0"],
  ["১", "1"],
  ["২", "2"],
  ["৩", "3"],
  ["৪", "4"],
  ["৫", "5"],
  ["৬", "6"],
  ["৭", "7"],
  ["৮", "8"],
  ["৯", "9"],
  ["।", "|"],
];

export function unicodeToBijoy(text: string): string {
  // In Bijoy the i-kar precedes its consonant; reorder Unicode "C ি" -> "ি C".
  const reordered = text.replace(/([ক-হড়-য়])ি/g, "ি$1");
  let out = reordered;
  for (const [uni, bij] of UNI_TO_BIJOY) {
    out = out.split(uni).join(bij);
  }
  return out;
}

export function bijoyToUnicode(text: string): string {
  let out = text;
  // Reverse the map, longest Bijoy tokens first.
  const reverse = [...UNI_TO_BIJOY].sort((a, b) => b[1].length - a[1].length);
  for (const [uni, bij] of reverse) {
    out = out.split(bij).join(uni);
  }
  // Move i-kar back after its consonant for correct Unicode order.
  out = out.replace(/ি([ক-হড়-য়])/g, "$1ি");
  return out;
}
