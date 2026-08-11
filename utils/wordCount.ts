/**
 * Counts words accurately for both CJK (Chinese, Japanese, Korean) characters and English words.
 * Each CJK character is counted as one word, while English words are grouped by spaces/punctuation.
 */
export const countWords = (htmlOrText: string): number => {
  if (!htmlOrText) return 0;
  
  // Strip HTML tags if present
  let text = htmlOrText;
  if (htmlOrText.includes('<') || htmlOrText.includes('>')) {
    text = htmlOrText.replace(/<[^>]*>/g, ' ');
  }
  
  // Normalize whitespace and trim
  const cleanText = text.trim();
  if (cleanText.length === 0) return 0;
  
  // Count Chinese/Japanese/Korean characters
  const cjkChars = cleanText.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g);
  const cjkCount = cjkChars ? cjkChars.length : 0;
  
  // Remove CJK characters to count remaining English words
  const cleanEnglish = cleanText.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ');
  const englishWords = cleanEnglish.match(/[a-zA-Z0-9_]+(?:'[a-zA-Z0-9_]+)*/g);
  const englishCount = englishWords ? englishWords.length : 0;
  
  return cjkCount + englishCount;
};

/**
 * Counts characters in HTML or raw text without HTML tags.
 */
export const countChars = (htmlOrText: string): number => {
  if (!htmlOrText) return 0;
  let text = htmlOrText;
  if (htmlOrText.includes('<') || htmlOrText.includes('>')) {
    text = htmlOrText.replace(/<[^>]*>/g, '');
  }
  return text.length;
};
