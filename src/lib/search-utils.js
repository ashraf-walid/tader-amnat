import { en, ar } from 'convert-layout';

// Windows Arabic keyboard layout (101 key) - standard used in Egypt
const WINDOWS_ARABIC_MAP = {
  'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ',
  'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'د',
  'a': 'ش', 's': 'س', 'd': 'ي', 'f': 'ب', 'g': 'ل', 'h': 'ا',
  'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ك', "'": 'ط',
  'z': 'ئ', 'x': 'ء', 'c': 'ؤ', 'v': 'ر', 'b': 'لا', 'n': 'ى',
  'm': 'ة', ',': 'و', '.': 'ز', '/': 'ظ',
  // Shift characters
  'Q': 'َ', 'W': 'ً', 'E': 'ُ', 'R': 'ٌ', 'T': 'لإ', 'Y': 'إ',
  'U': '\'', 'I': '÷', 'O': '×', 'P': '؛',
  'A': 'ِ', 'S': 'ٍ', 'D': ']', 'F': '[', 'G': 'لأ', 'H': 'أ',
  'J': 'ـ', 'K': '،', 'L': '/',
  'Z': '~', 'X': 'ُ', 'C': '}', 'V': '{', 'B': 'لآ', 'N': 'آ',
  'M': '\u2019',
  ' ': ' ',
};

export function normalizeArabicText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    // Normalize Alef forms
    .replace(/[أإآ]/g, 'ا')
    // Normalize Yaa forms
    .replace(/[ى]/g, 'ي')
    // Normalize Taa Marbuta
    .replace(/[ة]/g, 'ه')
    // Normalize Waw forms
    .replace(/[ؤ]/g, 'و')
    // Remove tatweel (stretch characters)
    .replace(/ـ/g, '');
}

/**
 * Convert English keyboard input to Arabic using Windows Arabic keyboard layout.
 * This handles the case where user forgets to switch keyboard to Arabic.
 */
export function convertEnglishToArabic(text) {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += WINDOWS_ARABIC_MAP[char] || char;
  }
  return result;
}

/**
 * Fallback conversion using convert-layout library (Mac layout).
 */
export function convertEnglishToArabicLib(text) {
  if (!text) return '';
  return ar.fromEn(text);
}

/**
 * Check if text looks like English keyboard typing (Latin letters)
 */
export function isEnglishTyping(text) {
  if (!text) return false;
  return /[a-zA-Z]/.test(text);
}
