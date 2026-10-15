import type { SiteLanguageCode } from "@/constants/site-language";
import { normalizeSiteLanguageCode } from "@/constants/site-language";

/**
 * Phonetic transliteration of English job titles into the public site's
 * scripts. This is pronunciation, not meaning: "Delivery Partner" stays a
 * spoken English title written in Telugu, and is never "డెలివరీ వ్యక్తి".
 * English is returned unchanged. Titles already written in the target script
 * are left as entered. Nothing here calls a translation API.
 */

type IndicLanguage = Exclude<SiteLanguageCode, "en">;

type VowelId =
  | "a"
  | "aa"
  | "i"
  | "ii"
  | "u"
  | "uu"
  | "e"
  | "ee"
  | "ai"
  | "o"
  | "oo"
  | "au";

type Syllable = {
  consonants: string[];
  vowel: VowelId | null;
  anusvara: boolean;
};

const CACHE_LIMIT = 2000;
const transliterationCache = new Map<string, string>();

const SCRIPT_PATTERN: Record<IndicLanguage, RegExp> = {
  hi: /[\u0900-\u097F]/,
  te: /[\u0C00-\u0C7F]/,
  ta: /[\u0B80-\u0BFF]/,
  kn: /[\u0C80-\u0CFF]/,
  ml: /[\u0D00-\u0D7F]/,
};

const LATIN_LETTER = /[A-Za-z]/;
const WORD = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

const INDEPENDENT: Record<IndicLanguage, Record<VowelId, string>> = {
  hi: { a: "अ", aa: "आ", i: "इ", ii: "ई", u: "उ", uu: "ऊ", e: "ए", ee: "ए", ai: "ऐ", o: "ओ", oo: "ओ", au: "औ" },
  te: { a: "అ", aa: "ఆ", i: "ఇ", ii: "ఈ", u: "ఉ", uu: "ఊ", e: "ఎ", ee: "ఏ", ai: "ఐ", o: "ఒ", oo: "ఓ", au: "ఔ" },
  ta: { a: "அ", aa: "ஆ", i: "இ", ii: "ஈ", u: "உ", uu: "ஊ", e: "எ", ee: "ஏ", ai: "ஐ", o: "ஒ", oo: "ஓ", au: "ஔ" },
  kn: { a: "ಅ", aa: "ಆ", i: "ಇ", ii: "ಈ", u: "ಉ", uu: "ಊ", e: "ಎ", ee: "ಏ", ai: "ಐ", o: "ಒ", oo: "ಓ", au: "ಔ" },
  ml: { a: "അ", aa: "ആ", i: "ഇ", ii: "ഈ", u: "ഉ", uu: "ഊ", e: "എ", ee: "ഏ", ai: "ഐ", o: "ഒ", oo: "ഓ", au: "ഔ" },
};

const VOWEL_SIGN: Record<IndicLanguage, Record<VowelId, string>> = {
  hi: { a: "", aa: "ा", i: "ि", ii: "ी", u: "ु", uu: "ू", e: "े", ee: "े", ai: "ै", o: "ो", oo: "ो", au: "ौ" },
  te: { a: "", aa: "ా", i: "ి", ii: "ీ", u: "ు", uu: "ూ", e: "ె", ee: "ే", ai: "ై", o: "ొ", oo: "ో", au: "ౌ" },
  ta: { a: "", aa: "ா", i: "ி", ii: "ீ", u: "ு", uu: "ூ", e: "ெ", ee: "ே", ai: "ை", o: "ொ", oo: "ோ", au: "ௌ" },
  kn: { a: "", aa: "ಾ", i: "ಿ", ii: "ೀ", u: "ು", uu: "ೂ", e: "ೆ", ee: "ೇ", ai: "ೈ", o: "ೊ", oo: "ೋ", au: "ೌ" },
  ml: { a: "", aa: "ാ", i: "ി", ii: "ീ", u: "ു", uu: "ൂ", e: "െ", ee: "േ", ai: "ൈ", o: "ൊ", oo: "ോ", au: "ൌ" },
};

const VIRAMA: Record<IndicLanguage, string> = {
  hi: "्",
  te: "్",
  ta: "்",
  kn: "್",
  ml: "്",
};

const ANUSVARA: Record<IndicLanguage, string> = {
  hi: "ं",
  te: "ం",
  ta: "ம்",
  kn: "ಂ",
  ml: "ം",
};

/** Tamil has no separate voiced series; Grantha letters cover English f/j/s. */
const CONSONANT: Record<IndicLanguage, Record<string, string>> = {
  hi: {
    k: "क", kh: "ख", g: "ग", ch: "च", j: "ज", T: "ट", D: "ड", n: "न",
    p: "प", f: "फ", b: "ब", m: "म", y: "य", r: "र", l: "ल", v: "व",
    sh: "ष", s: "स", h: "ह",
  },
  te: {
    k: "క", kh: "ఖ", g: "గ", ch: "చ", j: "జ", T: "ట", D: "డ", n: "న",
    p: "ప", f: "ఫ", b: "బ", m: "మ", y: "య", r: "ర", l: "ల", v: "వ",
    sh: "ష", s: "స", h: "హ",
  },
  ta: {
    k: "க", kh: "க", g: "க", ch: "ச", j: "ஜ", T: "ட", D: "ட", n: "ன",
    p: "ப", f: "ஃப", b: "ப", m: "ம", y: "ய", r: "ர", l: "ல", v: "வ",
    sh: "ஷ", s: "ஸ", h: "ஹ",
  },
  kn: {
    k: "ಕ", kh: "ಖ", g: "ಗ", ch: "ಚ", j: "ಜ", T: "ಟ", D: "ಡ", n: "ನ",
    p: "ಪ", f: "ಫ", b: "ಬ", m: "ಮ", y: "ಯ", r: "ರ", l: "ಲ", v: "ವ",
    sh: "ಷ", s: "ಸ", h: "ಹ",
  },
  ml: {
    k: "ക", kh: "ഖ", g: "ഗ", ch: "ച", j: "ജ", T: "ട", D: "ഡ", n: "ന",
    p: "പ", f: "ഫ", b: "ബ", m: "മ", y: "യ", r: "ര", l: "ല", v: "വ",
    sh: "ഷ", s: "സ", h: "ഹ",
  },
};

function isVowelChar(character: string | undefined): boolean {
  return character === "a" || character === "e" || character === "i" || character === "o" || character === "u" || character === "y";
}

function isConsonantChar(character: string | undefined): boolean {
  return Boolean(character) && !isVowelChar(character);
}

type ConsonantPiece = { phonemes: string[]; next: number };

function readConsonant(word: string, index: number): ConsonantPiece | null {
  const rest = word.slice(index);
  if (!rest) return null;
  const two = rest.slice(0, 2);
  const three = rest.slice(0, 3);
  if (three === "tch") return { phonemes: ["ch"], next: index + 3 };
  if (two === "ch") return { phonemes: ["ch"], next: index + 2 };
  if (two === "sh") return { phonemes: ["sh"], next: index + 2 };
  if (two === "th") return { phonemes: ["T"], next: index + 2 };
  if (two === "ph") return { phonemes: ["f"], next: index + 2 };
  if (two === "ck") return { phonemes: ["k"], next: index + 2 };
  if (two === "qu") return { phonemes: ["k"], next: index + 2 };
  if (/^(.)\1/.test(two) && isConsonantChar(two[0]) && two !== "xx") {
    return readConsonant(word, index + 1);
  }

  const character = rest[0] ?? "";
  if (!isConsonantChar(character)) return null;
  const next = word[index + 1];
  if (character === "c") {
    return { phonemes: [next === "e" || next === "i" || next === "y" ? "s" : "k"], next: index + 1 };
  }
  if (character === "g") {
    return { phonemes: [next === "e" || next === "i" || next === "y" ? "j" : "g"], next: index + 1 };
  }
  if (character === "x") {
    return { phonemes: ["k", "s"], next: index + 1 };
  }
  const single: Record<string, string> = {
    b: "b", d: "D", f: "f", h: "h", j: "j", k: "k", l: "l", m: "m", n: "n",
    p: "p", q: "k", r: "r", s: "s", t: "T", v: "v", w: "v", z: "j",
  };
  const phoneme = single[character];
  if (!phoneme) return null;
  return { phonemes: [phoneme], next: index + 1 };
}

function readConsonantRun(word: string, index: number): { phonemes: string[]; next: number } {
  const phonemes: string[] = [];
  let cursor = index;
  while (cursor < word.length) {
    const piece = readConsonant(word, cursor);
    if (!piece || piece.next === cursor) break;
    phonemes.push(...piece.phonemes);
    cursor = piece.next;
  }
  return { phonemes, next: cursor };
}

type VowelRead = {
  vowel: VowelId;
  next: number;
  anusvara: boolean;
  coda: string[];
};

function closedA(language: IndicLanguage): VowelId {
  return language === "hi" ? "ai" : "aa";
}

function readVowel(
  word: string,
  index: number,
  language: IndicLanguage,
  consonantCount: number,
): VowelRead | null {
  const rest = word.slice(index);
  if (!rest) return null;

  const take = (size: number, vowel: VowelId, coda: string[] = [], anusvara = false): VowelRead => ({
    vowel,
    next: index + size,
    anusvara,
    coda,
  });

  if (rest.startsWith("eer")) return take(3, "ii", ["r"]);
  if (rest.startsWith("ee") || rest.startsWith("ea") || rest.startsWith("ie")) return take(2, "ii");
  if (rest.startsWith("oo")) return take(2, "uu");
  if (rest.startsWith("ou") || rest.startsWith("ow")) return take(2, "au");
  if (rest.startsWith("oi") || rest.startsWith("oy")) return take(2, "o", ["y"]);
  if (rest.startsWith("ai") || rest.startsWith("ay")) return take(2, "ee");
  if (rest.startsWith("au") || rest.startsWith("aw")) return take(2, "aa");

  if (rest.startsWith("ar") && (rest.length === 2 || isConsonantChar(rest[2]))) {
    return take(1, "aa");
  }
  if (rest.startsWith("or") && isConsonantChar(rest[2])) return take(2, "oo", ["r"]);
  if ((rest.startsWith("er") || rest.startsWith("or")) && index + 2 === word.length) {
    return take(2, "a", ["r"]);
  }

  const magic = magicE(word, index);
  if (magic) return magic;

  const character = rest[0];
  if (character === "a") {
    if (index + 1 === word.length) return take(1, "aa");
    const after = word[index + 1];
    if (word.slice(index).startsWith("ator")) return take(1, "ee");
    if (after && isConsonantChar(after) && isVowelChar(word[index + 2])) return take(1, "ee");
    if (after && isConsonantChar(after)) return take(1, closedA(language));
    return take(1, "aa");
  }
  if (character === "e") {
    if (word.slice(index, index + 2) === "en" && isConsonantChar(word[index + 2])) {
      const vowel: VowelId = word.slice(index, index + 3) === "eng" ? "i" : "e";
      return take(2, vowel, [], true);
    }
    return take(1, "e");
  }
  if (character === "i") {
    if (word[index - 1] === "g" && isConsonantChar(word[index + 1])) return take(1, "a");
    if (/^i[bcdfghjklmnpqrstvwxz]er$/.test(rest)) return take(1, "ai");
    return take(1, "i");
  }
  if (character === "o") {
    if (
      isConsonantChar(word[index + 1]) &&
      isConsonantChar(word[index + 2]) &&
      word[index + 1] !== word[index + 2]
    ) {
      return take(1, "aa");
    }
    if (index === 0) return take(1, "aa");
    if (isConsonantChar(word[index + 1]) && isVowelChar(word[index + 2])) return take(1, "a");
    return take(1, "o");
  }
  if (character === "u") {
    const laterVowel = /[aeioy]/.test(word.slice(index + 1));
    if (!laterVowel) return take(1, "u");
    if (
      consonantCount === 1 &&
      isConsonantChar(word[index + 1]) &&
      isVowelChar(word[index + 2])
    ) {
      return take(1, "uu", ["y"]);
    }
    return take(1, "a");
  }
  if (character === "y" && !isVowelChar(word[index + 1])) return take(1, "ii");
  return null;
}

/** Silent final e, as in "sales" and "software". "er" suffixes are not silent e. */
function magicE(word: string, index: number): VowelRead | null {
  const vowel = word[index];
  if (vowel !== "a" && vowel !== "i" && vowel !== "o" && vowel !== "u") return null;
  let cursor = index + 1;
  const coda: string[] = [];
  while (cursor < word.length && isConsonantChar(word[cursor])) {
    const piece = readConsonant(word, cursor);
    if (!piece) break;
    coda.push(...piece.phonemes);
    cursor = piece.next;
  }
  if (coda.length === 0 || word[cursor] !== "e") return null;
  const remainder = word.slice(cursor + 1);
  if (remainder !== "" && remainder !== "s") return null;
  const mapped: VowelId =
    vowel === "a" ? "ee" : vowel === "i" ? (coda[0] === "v" ? "i" : "ai") : vowel === "o" ? "oo" : "uu";
  return {
    vowel: mapped,
    next: cursor + 1,
    anusvara: false,
    coda,
  };
}

function parseWord(word: string, language: IndicLanguage): Syllable[] {
  if (word.endsWith("cian") && word.length > 4) {
    return [
      ...parseWord(word.slice(0, -4), language),
      { consonants: ["sh"], vowel: "i", anusvara: false },
      { consonants: ["y"], vowel: "a", anusvara: false },
      { consonants: ["n"], vowel: null, anusvara: false },
    ];
  }
  const syllables: Syllable[] = [];
  let index = 0;
  while (index < word.length) {
    if (word[index] === "'") {
      index += 1;
      continue;
    }

    if (word.startsWith("x", index) && index > 0 && isVowelChar(word[index - 1]) && isVowelChar(word[index + 1])) {
      syllables.push({ consonants: ["g"], vowel: null, anusvara: false });
      index += 1;
      if (word[index] === "e" && isConsonantChar(word[index + 1])) {
        syllables.push({
          consonants: ["j"],
          vowel: language === "hi" ? "ii" : "i",
          anusvara: false,
        });
        index += 1;
      }
      continue;
    }

    const run = readConsonantRun(word, index);
    index = run.next;
    if (index >= word.length) {
      if (run.phonemes.length > 0) {
        syllables.push({ consonants: run.phonemes, vowel: null, anusvara: false });
      }
      break;
    }

    const vowel = readVowel(word, index, language, run.phonemes.length);
    if (!vowel) {
      if (run.phonemes.length > 0) {
        syllables.push({ consonants: run.phonemes, vowel: "a", anusvara: false });
      }
      index += 1;
      continue;
    }

    const consonants = [...run.phonemes];
    if (vowel.vowel === "uu" && vowel.coda[0] === "y" && consonants.length > 0) {
      consonants.push("y");
      vowel.coda = [];
    }

    syllables.push({
      consonants,
      vowel: vowel.vowel,
      anusvara: vowel.anusvara,
    });
    if (vowel.coda.length > 0) {
      syllables.push({ consonants: vowel.coda, vowel: null, anusvara: false });
    }
    index = vowel.next;
  }

  reduceUnstressedVowels(syllables);
  return splitSchwaClusters(syllables);
}

function reduceUnstressedVowels(syllables: Syllable[]): void {
  syllables.forEach((syllable, index) => {
    if (index === 0 || syllable.anusvara || syllable.consonants.length !== 1) return;
    const next = syllables[index + 1];
    if (!next || next.consonants.length !== 1) return;
    if (syllable.vowel === "e" || syllable.vowel === "o") {
      syllable.vowel = "a";
    }
  });
}

/** "partner" keeps a schwa on each consonant instead of one long conjunct. */
function splitSchwaClusters(syllables: Syllable[]): Syllable[] {
  const split: Syllable[] = [];
  for (const syllable of syllables) {
    if (syllable.vowel === "a" && syllable.consonants.length >= 3 && !syllable.anusvara) {
      split.push({
        consonants: syllable.consonants.slice(0, 2),
        vowel: "a",
        anusvara: false,
      });
      for (const phoneme of syllable.consonants.slice(2)) {
        split.push({ consonants: [phoneme], vowel: "a", anusvara: false });
      }
      continue;
    }
    split.push(syllable);
  }
  return split;
}

function glyph(language: IndicLanguage, phoneme: string): string {
  return CONSONANT[language][phoneme] ?? "";
}

function renderSyllable(
  syllable: Syllable,
  language: IndicLanguage,
  dropFinalVirama: boolean,
): string {
  const virama = VIRAMA[language];
  if (syllable.consonants.length === 0) {
    if (!syllable.vowel) return "";
    return INDEPENDENT[language][syllable.vowel] + (syllable.anusvara ? anusvaraGlyph(language) : "");
  }

  let text = "";
  syllable.consonants.forEach((phoneme, index) => {
    text += glyph(language, phoneme);
    const last = index === syllable.consonants.length - 1;
    if (!last) {
      text += virama;
      return;
    }
    if (syllable.vowel && syllable.vowel !== "a") {
      text += VOWEL_SIGN[language][syllable.vowel];
    } else if (!syllable.vowel && !dropFinalVirama) {
      text += virama;
    }
  });
  if (syllable.anusvara) text += anusvaraGlyph(language);
  return text;
}

function anusvaraGlyph(language: IndicLanguage): string {
  return language === "ta" ? "ன்" : ANUSVARA[language];
}

function renderWord(syllables: Syllable[], language: IndicLanguage): string {
  return syllables
    .map((syllable, index) =>
      renderSyllable(syllable, language, language === "hi" && index === syllables.length - 1),
    )
    .join("");
}

function transliterateToken(token: string, language: IndicLanguage): string {
  if (token.length >= 2 && token === token.toUpperCase() && /^[A-Z0-9]+$/.test(token)) {
    return token;
  }
  const syllables = parseWord(token.toLowerCase(), language);
  const rendered = renderWord(syllables, language);
  if (!rendered || !SCRIPT_PATTERN[language].test(rendered)) return token;
  return rendered;
}

function transliterateTitle(title: string, language: IndicLanguage): string {
  if (SCRIPT_PATTERN[language].test(title) && !LATIN_LETTER.test(title)) return title;
  return title.replace(WORD, (token) => transliterateToken(token, language));
}

export function transliterateJobTitle(
  title: string,
  language: SiteLanguageCode | string | null | undefined,
): string {
  if (!title) return title;
  const code = normalizeSiteLanguageCode(language);
  if (code === "en") return title;
  const key = `${code}\u0000${title}`;
  const cached = transliterationCache.get(key);
  if (cached !== undefined) return cached;
  const rendered = transliterateTitle(title, code);
  if (transliterationCache.size >= CACHE_LIMIT) transliterationCache.clear();
  transliterationCache.set(key, rendered);
  return rendered;
}

export function clearJobTitleTransliterationCache(): void {
  transliterationCache.clear();
}
