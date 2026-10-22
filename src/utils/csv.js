// Minimal RFC4180-style CSV parser: handles quoted fields, escaped quotes ("")
// and commas/newlines inside quotes. No external dependency needed.
export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = String(text ?? '').replace(/^\uFEFF/, '');

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i += 1) {
    const char = src[i];
    const next = src[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushField();
    } else if (char === '\r') {
      // skip, handled by \n or end
    } else if (char === '\n') {
      pushRow();
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  const nonEmptyRows = rows.filter((r) => !(r.length === 1 && r[0] === ''));
  if (nonEmptyRows.length === 0) {
    return { headers: [], records: [] };
  }

  const headers = nonEmptyRows[0].map((h) => String(h ?? '').trim());
  const records = nonEmptyRows.slice(1).map((r) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = r[index] !== undefined ? String(r[index]).trim() : '';
    });
    return record;
  });

  return { headers, records };
};
