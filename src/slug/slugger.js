const CYRILLIC_MAP = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya'
};

function transliterate(input) {
  let out = '';

  for (const ch of input.toLowerCase()) {
    const mapped = CYRILLIC_MAP[ch];
    out += mapped !== undefined ? mapped : ch;
  }

  return out;
}

export function defaultSlugger(title) {
  if (typeof title !== 'string') {
    return '';
  }

  const transliterated = transliterate(title.trim());
  // Decomposing й before transliteration loses its mapping.
  const deaccented = transliterated.normalize('NFKD').replace(/\p{M}+/gu, '');
  const ascii = deaccented.replace(/[^a-z0-9]+/g, '-');
  const trimmed = ascii.replace(/^-+|-+$/g, '');

  return trimmed;
}
