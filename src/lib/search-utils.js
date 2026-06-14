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
