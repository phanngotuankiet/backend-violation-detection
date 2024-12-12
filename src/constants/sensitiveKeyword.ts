export const SENSITIVE_KEYWORDS = {
  political: ['chính quyền', 'chống phá', 'biểu tình', 'cách mạng', 'lật đổ'],
  adult: ['khiêu dâm', 'sex', '18+', 'người lớn', 'nude'],
  scam: ['lừa đảo', 'đa cấp', 'quick rich', 'giàu nhanh', 'đầu tư'],
  violence: ['đánh nhau', 'bạo lực', 'giết người', 'kích động', 'gây rối'],
} as const;

export type SensitiveKeywordCategory = keyof typeof SENSITIVE_KEYWORDS;
