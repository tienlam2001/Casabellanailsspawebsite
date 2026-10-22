import { parseCsv } from './csv';
import { normalizePhone } from './phone';

const normalizeHeader = (header) => String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const FIELD_ALIASES = {
  name: ['name', 'customername', 'clientname', 'fullname', 'client', 'customer'],
  phone: ['phone', 'phonenumber', 'mobilephone', 'mobile', 'cellphone', 'cell', 'contactnumber', 'telephone', 'tel'],
  points: ['points', 'rewardpoints', 'loyaltypoints', 'pts'],
  visits: ['visits', 'totalvisits', 'numberofvisits', 'visitcount', 'numvisits'],
  lastVisit: ['lastvisit', 'lastvisitdate', 'recentvisit', 'lastvisited', 'lastappointment', 'lastseen'],
  spent: ['spent', 'totalspent', 'lifetimespent', 'totalspend', 'amountspent', 'totalspending', 'revenue'],
};

const REQUIRED_FIELDS = ['name', 'phone'];

export const REQUIRED_FIELD_LABELS = {
  name: 'Name',
  phone: 'Phone Number',
};

export const OPTIONAL_FIELD_LABELS = {
  points: 'Points',
  visits: 'Visits',
  lastVisit: 'Last Visit',
  spent: 'Spent',
};

export const detectHeaderMapping = (headers) => {
  const normalizedHeaders = headers.map((h) => ({ raw: h, normalized: normalizeHeader(h) }));
  const mapping = {};

  for (const field of Object.keys(FIELD_ALIASES)) {
    const aliases = FIELD_ALIASES[field];
    const match = normalizedHeaders.find((h) => aliases.includes(h.normalized));
    mapping[field] = match ? match.raw : null;
  }

  const missingRequiredHeaders = REQUIRED_FIELDS.filter((field) => !mapping[field]);
  return { mapping, missingRequiredHeaders };
};

const parseMoney = (raw) => {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return { value: 0, valid: true };
  const negative = /^\(.*\)$/.test(trimmed);
  const cleaned = trimmed.replace(/[$,()\s]/g, '');
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return { value: 0, valid: false };
  return { value: negative ? -Math.abs(num) : num, valid: true };
};

const parseCount = (raw) => {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return { value: 0, valid: true };
  const cleaned = trimmed.replace(/[,\s]/g, '');
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return { value: 0, valid: false };
  return { value: Math.round(num), valid: true };
};

const parseDate = (raw) => {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return { value: null, valid: true };
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return { value: null, valid: false };
  return { value: date.toISOString().slice(0, 10), valid: true };
};

// Turns one raw CSV record into a validated customer row, or an invalid-row entry with a reason.
export const normalizeCustomerRow = (record, mapping, rowNumber) => {
  const name = String(record[mapping.name] ?? '').trim();
  const phoneRaw = String(record[mapping.phone] ?? '').trim();
  const phoneNumber = normalizePhone(phoneRaw);

  if (!name) {
    return { valid: false, rowNumber, reason: 'Missing customer name', raw: record };
  }
  if (!phoneRaw) {
    return { valid: false, rowNumber, reason: 'Missing phone number', raw: record };
  }
  if (!phoneNumber) {
    return { valid: false, rowNumber, reason: `Invalid phone number "${phoneRaw}"`, raw: record };
  }

  const points = mapping.points ? parseCount(record[mapping.points]) : { value: 0, valid: true };
  if (!points.valid) {
    return { valid: false, rowNumber, reason: `Invalid points value "${record[mapping.points]}"`, raw: record };
  }

  const visits = mapping.visits ? parseCount(record[mapping.visits]) : { value: 0, valid: true };
  if (!visits.valid) {
    return { valid: false, rowNumber, reason: `Invalid visits value "${record[mapping.visits]}"`, raw: record };
  }

  const spent = mapping.spent ? parseMoney(record[mapping.spent]) : { value: 0, valid: true };
  if (!spent.valid) {
    return { valid: false, rowNumber, reason: `Invalid spent value "${record[mapping.spent]}"`, raw: record };
  }

  const lastVisit = mapping.lastVisit ? parseDate(record[mapping.lastVisit]) : { value: null, valid: true };
  if (!lastVisit.valid) {
    return { valid: false, rowNumber, reason: `Invalid last visit date "${record[mapping.lastVisit]}"`, raw: record };
  }

  return {
    valid: true,
    rowNumber,
    record: {
      phoneNumber,
      phoneDisplay: phoneRaw,
      name,
      points: points.value,
      visits: visits.value,
      spent: spent.value,
      lastVisit: lastVisit.value,
    },
  };
};

// Parses + validates a full CSV file. Nothing here touches Firebase.
export const buildImportPreview = (csvText) => {
  const { headers, records } = parseCsv(csvText);
  if (headers.length === 0) {
    return {
      headers: [],
      mapping: {},
      missingRequiredHeaders: REQUIRED_FIELDS,
      csvRecordCount: 0,
      validRecords: [],
      invalidRows: [],
      duplicatePhonesInFile: 0,
    };
  }

  const { mapping, missingRequiredHeaders } = detectHeaderMapping(headers);
  if (missingRequiredHeaders.length > 0) {
    return {
      headers,
      mapping,
      missingRequiredHeaders,
      csvRecordCount: records.length,
      validRecords: [],
      invalidRows: [],
      duplicatePhonesInFile: 0,
    };
  }

  const invalidRows = [];
  const byPhone = new Map();
  let duplicatePhonesInFile = 0;

  records.forEach((record, index) => {
    const rowNumber = index + 2; // account for header row, 1-based
    const result = normalizeCustomerRow(record, mapping, rowNumber);
    if (!result.valid) {
      invalidRows.push(result);
      return;
    }
    if (byPhone.has(result.record.phoneNumber)) {
      duplicatePhonesInFile += 1;
    }
    // Newest row in the file wins when the same phone number appears more than once.
    byPhone.set(result.record.phoneNumber, result.record);
  });

  return {
    headers,
    mapping,
    missingRequiredHeaders: [],
    csvRecordCount: records.length,
    validRecords: Array.from(byPhone.values()),
    invalidRows,
    duplicatePhonesInFile,
  };
};
