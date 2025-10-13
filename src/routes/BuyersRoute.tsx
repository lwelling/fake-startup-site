import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { chunkedDelete, getDb } from '../lib/firestoreUtils';

const REQUIRED_HEADERS = [
  'Deal Date',
  'Deal Number',
  'Buyer',
  'Year',
  'Make',
  'Model',
  'VIN',
  'Stock',
  'Price',
  'Cost',
  'Gross',
] as const;

type CsvRow = Record<string, string>;

const HEADER_ALIAS_MAP: Record<string, string> = {
  dealdate: 'Deal Date',
  'deal date': 'Deal Date',
  dealnumber: 'Deal Number',
  'deal number': 'Deal Number',
  buyer: 'Buyer',
  buyername: 'Buyer',
  year: 'Year',
  'model year': 'Year',
  make: 'Make',
  manufacturer: 'Make',
  model: 'Model',
  vehicle: 'Vehicle',
  dealstatus: 'Deal Status',
  'deal status': 'Deal Status',
  'sales rep 1': 'Sales Rep 1',
  salesrep1: 'Sales Rep 1',
  'sales rep 2': 'Sales Rep 2',
  salesrep2: 'Sales Rep 2',
  'stock #': 'Stock',
  'stock#': 'Stock',
  'stock number': 'Stock',
  stockno: 'Stock',
  stocknumber: 'Stock',
  stock: 'Stock',
  vin: 'VIN',
  'vin#': 'VIN',
  price: 'Price',
  cost: 'Cost',
  gross: 'Gross',
  fees: 'Fees',
  transportation: 'Transportation',
  mileage: 'Mileage',
};

function replaceNbsp(value: string): string {
  return value.replace(/\u00a0/g, ' ');
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ');
}

function normaliseHeaderValue(value: string): string {
  const withoutBom = value.replace(/^\uFEFF/, '');
  const replaced = replaceNbsp(withoutBom);
  const trimmed = replaced.trim();
  const collapsed = collapseWhitespace(trimmed);
  const lower = collapsed.toLowerCase();
  return lower.replace(/[!"$%&'()*+,./:;<=>?@[\\\]^_`{|}~-]/g, '');
}

function toCanonicalHeader(header: string): string {
  const normalised = normaliseHeaderValue(header);
  const withoutSpaces = normalised.replace(/\s+/g, '');
  const canonical = HEADER_ALIAS_MAP[normalised] ?? HEADER_ALIAS_MAP[withoutSpaces];
  return canonical ?? normalised;
}

function normaliseLabel(value: string | undefined): string {
  if (!value) return '';
  return normaliseHeaderValue(value);
}

function cleanCell(value: unknown): string {
  if (typeof value === 'string') {
    return collapseWhitespace(replaceNbsp(value)).trim();
  }
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
}

type Deal = {
  dealDate: string;
  dealNumber: string;
  buyer: string;
  dealStatus: string;
  salesRep1?: string;
  salesRep2?: string;
  make?: string;
  model?: string;
  vehicle?: string;
  stock?: string;
  vin?: string;
  price?: number | null;
  cost?: number | null;
  gross?: number | null;
  fees?: number | null;
  transportation?: number | null;
  mileage?: number | null;
  year?: number | null;
};

type BuyerTotals = {
  price: number;
  cost: number;
  gross: number;
  fees: number;
  transportation: number;
};

type BuyerAverages = {
  price?: number;
  cost?: number;
  gross?: number;
  fees?: number;
  transportation?: number;
  mileage?: number;
  year?: number;
};

type PreferredModel = {
  vehicle: string;
  count: number;
};

type BuyerStatRecord = {
  buyer: string;
  buyerId: string;
  totalDeals: number;
  totals: BuyerTotals;
  averages: BuyerAverages;
  preferredModels: PreferredModel[];
};

type StatusMessage = {
  kind: 'success' | 'error' | 'info';
  message: string;
} | null;

type SortKey =
  | 'buyer'
  | 'totalDeals'
  | 'avgPrice'
  | 'avgCost'
  | 'avgGross'
  | 'avgYear'
  | 'avgMileage';

type SortDirection = 'asc' | 'desc';

function parseNumber(value: unknown): number | null | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') {
    return value === undefined || value === null ? undefined : null;
  }
  const cleaned = cleanCell(value).replace(/[$,]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveYear(vehicle?: string): number | null {
  if (!vehicle) return null;
  const match = /^\s*(\d{4})/.exec(vehicle);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

function normaliseBuyer(value: string): string {
  return value.trim();
}

function normaliseBuyerId(value: string): string {
  const fallback = 'buyer';
  const trimmed = normaliseBuyer(value).toLowerCase();
  const slug = trimmed.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normaliseDeal(row: CsvRow, hasMileageColumn: boolean): Deal {
  const rawVehicle = cleanCell(row['Vehicle']);
  const salesRep1 = cleanCell(row['Sales Rep 1']);
  const salesRep2 = cleanCell(row['Sales Rep 2']);
  const make = cleanCell(row['Make']);
  const model = cleanCell(row['Model']);
  const stock = cleanCell(row['Stock']);
  const mileageRaw = hasMileageColumn ? row['Mileage'] : undefined;
  const mileageNumber = hasMileageColumn ? parseNumber(mileageRaw) : undefined;
  const yearValue = parseNumber(row['Year']);
  const numericYear =
    typeof yearValue === 'number' && Number.isFinite(yearValue)
      ? Math.round(yearValue)
      : null;

  const vehicleFromParts = [
    typeof numericYear === 'number' ? String(numericYear) : '',
    make,
    model,
  ]
    .filter((part) => typeof part === 'string' && part.length > 0)
    .join(' ')
    .trim();

  const vehicle = vehicleFromParts || rawVehicle;

  return {
    dealDate: cleanCell(row['Deal Date']) ?? '',
    dealNumber: cleanCell(row['Deal Number']) ?? '',
    buyer: normaliseBuyer(cleanCell(row['Buyer'] ?? '')),
    dealStatus: cleanCell(row['Deal Status']) ?? '',
    salesRep1: salesRep1 || undefined,
    salesRep2: salesRep2 || undefined,
    make: make || undefined,
    model: model || undefined,
    vehicle: vehicle || undefined,
    stock: stock || cleanCell(row['Stock #']) || undefined,
    vin: cleanCell(row['VIN']) || undefined,
    price: parseNumber(row['Price']),
    cost: parseNumber(row['Cost']),
    gross: parseNumber(row['Gross']),
    fees: parseNumber(row['Fees']),
    transportation: parseNumber(row['Transportation']),
    mileage: hasMileageColumn ? (mileageNumber ?? null) : undefined,
    year: typeof numericYear === 'number' ? numericYear : deriveYear(vehicle || rawVehicle || undefined),
  };
}

function aggregateDeals(deals: Deal[]): BuyerStatRecord[] {
  const buyerMap = new Map<string, {
    buyer: string;
    totals: BuyerTotals;
    counts: Record<keyof BuyerTotals, number> & { mileage: number; year: number };
    mileageTotal: number;
    yearTotal: number;
    totalDeals: number;
    preferredModels: Map<string, number>;
  }>();

  const numericFields: (keyof BuyerTotals)[] = ['price', 'cost', 'gross', 'fees', 'transportation'];

  deals.forEach((deal) => {
    const buyerName = normaliseBuyer(deal.buyer);
    if (!buyerName) return;
    const buyerId = normaliseBuyerId(buyerName);
    const entry = buyerMap.get(buyerId) ?? {
      buyer: buyerName,
      totals: {
        price: 0,
        cost: 0,
        gross: 0,
        fees: 0,
        transportation: 0,
      },
      counts: {
        price: 0,
        cost: 0,
        gross: 0,
        fees: 0,
        transportation: 0,
        mileage: 0,
        year: 0,
      },
      mileageTotal: 0,
      yearTotal: 0,
      totalDeals: 0,
      preferredModels: new Map<string, number>(),
    };

    entry.totalDeals += 1;

    numericFields.forEach((field) => {
      const value = deal[field];
      if (typeof value === 'number' && Number.isFinite(value)) {
        entry.totals[field] += value;
        entry.counts[field] += 1;
      }
    });

    if (typeof deal.mileage === 'number' && Number.isFinite(deal.mileage)) {
      entry.mileageTotal += deal.mileage;
      entry.counts.mileage += 1;
    }

    if (typeof deal.year === 'number' && Number.isFinite(deal.year)) {
      entry.yearTotal += deal.year;
      entry.counts.year += 1;
    }

    const preferredLabelParts = [
      typeof deal.year === 'number' && Number.isFinite(deal.year) ? String(deal.year) : '',
      deal.make?.trim() ?? '',
      deal.model?.trim() ?? '',
    ].filter((part) => part.length > 0);
    const preferredLabel = (preferredLabelParts.join(' ').trim() || deal.vehicle?.trim() || '').trim();
    if (preferredLabel) {
      entry.preferredModels.set(
        preferredLabel,
        (entry.preferredModels.get(preferredLabel) ?? 0) + 1,
      );
    }

    buyerMap.set(buyerId, entry);
  });

  const records: BuyerStatRecord[] = [];

  buyerMap.forEach((entry, buyerId) => {
    const averages: BuyerAverages = {};
    (['price', 'cost', 'gross', 'fees', 'transportation'] as const).forEach((field) => {
      const count = entry.counts[field];
      if (count > 0) {
        averages[field] = round(entry.totals[field] / count);
      }
    });
    if (entry.counts.mileage > 0) {
      averages.mileage = round(entry.mileageTotal / entry.counts.mileage, 0);
    }
    if (entry.counts.year > 0) {
      averages.year = round(entry.yearTotal / entry.counts.year, 0);
    }

    const preferredModels = Array.from(entry.preferredModels.entries())
      .map(([vehicle, count]) => ({ vehicle, count }))
      .sort((a, b) => {
        if (b.count === a.count) {
          return a.vehicle.localeCompare(b.vehicle);
        }
        return b.count - a.count;
      })
      .slice(0, 3);

    records.push({
      buyer: entry.buyer,
      buyerId,
      totalDeals: entry.totalDeals,
      totals: {
        price: round(entry.totals.price),
        cost: round(entry.totals.cost),
        gross: round(entry.totals.gross),
        fees: round(entry.totals.fees),
        transportation: round(entry.totals.transportation),
      },
      averages,
      preferredModels,
    });
  });

  return records;
}

function serialiseDeal(deal: Deal): DocumentData {
  const base: DocumentData = {
    dealDate: deal.dealDate,
    dealNumber: deal.dealNumber,
    buyer: deal.buyer,
    dealStatus: deal.dealStatus,
  };

  if (deal.salesRep1) base.salesRep1 = deal.salesRep1;
  if (deal.salesRep2) base.salesRep2 = deal.salesRep2;
  if (deal.make) base.make = deal.make;
  if (deal.model) base.model = deal.model;
  if (deal.vehicle) base.vehicle = deal.vehicle;
  if (deal.stock) base.stock = deal.stock;
  if (deal.vin) base.vin = deal.vin;
  if (typeof deal.price === 'number') base.price = deal.price;
  if (typeof deal.cost === 'number') base.cost = deal.cost;
  if (typeof deal.gross === 'number') base.gross = deal.gross;
  if (typeof deal.fees === 'number') base.fees = deal.fees;
  if (typeof deal.transportation === 'number') base.transportation = deal.transportation;
  if (deal.mileage !== undefined) base.mileage = deal.mileage;
  if (typeof deal.year === 'number') base.year = deal.year;

  return base;
}

async function writeRawDeals(database: Firestore, deals: Deal[]): Promise<void> {
  if (!deals.length) return;
  const rawCollection = collection(database, 'buyers_raw');
  let batch = writeBatch(database);
  let writesInBatch = 0;
  for (let index = 0; index < deals.length; index += 1) {
    const deal = deals[index];
    const ref = doc(rawCollection);
    batch.set(ref, serialiseDeal(deal));
    writesInBatch += 1;
    const isLast = index === deals.length - 1;
    if (writesInBatch === 400 || isLast) {
      await batch.commit();
      batch = writeBatch(database);
      writesInBatch = 0;
    }
  }
}

async function writeBuyerStats(database: Firestore, stats: BuyerStatRecord[]): Promise<void> {
  if (!stats.length) return;
  const statsCollection = collection(database, 'buyer_stats');
  let batch = writeBatch(database);
  let writesInBatch = 0;
  for (let index = 0; index < stats.length; index += 1) {
    const stat = stats[index];
    const ref = doc(statsCollection, stat.buyerId);
    batch.set(ref, {
      buyer: stat.buyer,
      totalDeals: stat.totalDeals,
      totals: stat.totals,
      averages: stat.averages,
      preferredModels: stat.preferredModels,
    });
    writesInBatch += 1;
    const isLast = index === stats.length - 1;
    if (writesInBatch === 400 || isLast) {
      await batch.commit();
      batch = writeBatch(database);
      writesInBatch = 0;
    }
  }
}

function deserializeDeal(data: DocumentData): Deal {
  return {
    dealDate: String(data.dealDate ?? ''),
    dealNumber: String(data.dealNumber ?? ''),
    buyer: String(data.buyer ?? ''),
    dealStatus: String(data.dealStatus ?? ''),
    salesRep1: data.salesRep1 ? String(data.salesRep1) : undefined,
    salesRep2: data.salesRep2 ? String(data.salesRep2) : undefined,
    make: data.make ? cleanCell(data.make) || undefined : undefined,
    model: data.model ? cleanCell(data.model) || undefined : undefined,
    vehicle: data.vehicle ? String(data.vehicle) : undefined,
    stock: data.stock ? String(data.stock) : undefined,
    vin: data.vin ? String(data.vin) : undefined,
    price: typeof data.price === 'number' ? data.price : undefined,
    cost: typeof data.cost === 'number' ? data.cost : undefined,
    gross: typeof data.gross === 'number' ? data.gross : undefined,
    fees: typeof data.fees === 'number' ? data.fees : undefined,
    transportation: typeof data.transportation === 'number' ? data.transportation : undefined,
    mileage:
      data.mileage === null
        ? null
        : typeof data.mileage === 'number'
          ? data.mileage
          : undefined,
    year: typeof data.year === 'number' ? data.year : null,
  };
}

function deserializeStat(id: string, data: DocumentData): BuyerStatRecord {
  return {
    buyer: String(data.buyer ?? id),
    buyerId: id,
    totalDeals: Number(data.totalDeals ?? 0),
    totals: {
      price: Number(data.totals?.price ?? 0),
      cost: Number(data.totals?.cost ?? 0),
      gross: Number(data.totals?.gross ?? 0),
      fees: Number(data.totals?.fees ?? 0),
      transportation: Number(data.totals?.transportation ?? 0),
    },
    averages: {
      price: typeof data.averages?.price === 'number' ? data.averages.price : undefined,
      cost: typeof data.averages?.cost === 'number' ? data.averages.cost : undefined,
      gross: typeof data.averages?.gross === 'number' ? data.averages.gross : undefined,
      fees: typeof data.averages?.fees === 'number' ? data.averages.fees : undefined,
      transportation:
        typeof data.averages?.transportation === 'number'
          ? data.averages.transportation
          : undefined,
      mileage:
        typeof data.averages?.mileage === 'number' ? data.averages.mileage : undefined,
      year: typeof data.averages?.year === 'number' ? data.averages.year : undefined,
    },
    preferredModels: Array.isArray(data.preferredModels)
      ? data.preferredModels
          .map((entry: any) => ({
            vehicle: typeof entry?.vehicle === 'string' ? entry.vehicle : '',
            count: Number(entry?.count ?? 0),
          }))
          .filter((entry: PreferredModel) => entry.vehicle)
      : [],
  };
}

type FlatParseResult =
  | { kind: 'success'; deals: Deal[] }
  | { kind: 'missingHeaders'; missing: string[] };

async function tryParseFlat(content: string): Promise<FlatParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(content, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: toCanonicalHeader,
      complete: (result) => {
        const fields = result.meta.fields ?? [];
        const headerSet = new Set(fields);
        const missing = REQUIRED_HEADERS.filter((header) => !headerSet.has(header));
        if (missing.length) {
          resolve({ kind: 'missingHeaders', missing });
          return;
        }

        const hasMileage = headerSet.has('Mileage');
        const deals = result.data
          .map((row) => row as CsvRow)
          .filter((row) =>
            Object.values(row as Record<string, unknown>).some((value) => cleanCell(value).length > 0),
          )
          .map((row) => normaliseDeal(row, hasMileage));

        resolve({ kind: 'success', deals });
      },
      error: reject,
    });
  });
}

function flattenReportBlock(block: string[][]): Deal | null {
  if (!block.length) return null;

  const totalsRow = block[0];
  if (normaliseLabel(totalsRow[0]) !== normaliseLabel('Deal Date')) {
    return null;
  }

  const getRow = (label: string) => block.find((row) => normaliseLabel(row[0]) === normaliseLabel(label));
  const getValue = (label: string) => {
    const row = getRow(label);
    return row ? cleanCell(row[1]) : '';
  };

  const columnCEntries = block.map((row) => cleanCell(row[2]));
  let vehicle: string | undefined;
  let vin: string | undefined;
  let stock: string | undefined;
  let sawVehicle = false;

  for (const entry of columnCEntries) {
    if (!vehicle && /^(19|20)\d{2}\b.+/.test(entry)) {
      vehicle = entry;
      sawVehicle = true;
      continue;
    }

    if (!stock) {
      const stockMatch = /^stock #[:\s-]*(.+)$/i.exec(entry);
      if (stockMatch) {
        stock = cleanCell(stockMatch[1]);
      }
    }

    if (sawVehicle && !vin) {
      const candidate = entry.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (candidate.length === 17 && /[A-HJ-NPR-Z0-9]{17}/i.test(candidate)) {
        vin = candidate;
      }
    }
  }

  const feesRow = getRow('Fees');
  const transportationRow = getRow('Transportation');
  const mileageRow = getRow('Mileage');

  const feesFromF = feesRow ? parseNumber(feesRow[5]) : undefined;
  const feesFromH = feesRow ? parseNumber(feesRow[7]) : undefined;
  const transportationValue = transportationRow ? parseNumber(transportationRow[5]) : undefined;
  const transportationFallback = transportationRow ? parseNumber(transportationRow[7]) : undefined;
  const mileageValue = mileageRow ? parseNumber(mileageRow[1]) : undefined;

  const deal: Deal = {
    dealDate: cleanCell(totalsRow[1]),
    dealNumber: getValue('Deal Number'),
    buyer: normaliseBuyer(getValue('Buyer')),
    dealStatus: getValue('Deal Status'),
    salesRep1: getValue('Sales Rep 1') || undefined,
    salesRep2: getValue('Sales Rep 2') || undefined,
    vehicle: vehicle || undefined,
    stock: stock || undefined,
    vin: vin || undefined,
    price: parseNumber(totalsRow[5]),
    cost: parseNumber(totalsRow[6]),
    gross: parseNumber(totalsRow[7]),
    fees: feesFromF !== undefined ? feesFromF : feesFromH,
    transportation:
      transportationValue !== undefined ? transportationValue : transportationFallback,
    mileage: mileageRow ? (mileageValue ?? null) : undefined,
    year: deriveYear(vehicle),
  };

  return deal;
}

function parseReportStyle(content: string): Deal[] {
  const result = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: 'greedy',
  });

  const rows = result.data as string[][];
  const deals: Deal[] = [];
  let currentBlock: string[][] | null = null;

  rows.forEach((row) => {
    const label = normaliseLabel(row[0]);
    if (label === normaliseLabel('Deal Date')) {
      if (currentBlock && currentBlock.length) {
        const deal = flattenReportBlock(currentBlock);
        if (deal) {
          deals.push(deal);
        }
      }
      currentBlock = [row];
    } else if (currentBlock) {
      currentBlock.push(row);
    }
  });

  if (currentBlock && currentBlock.length) {
    const deal = flattenReportBlock(currentBlock);
    if (deal) {
      deals.push(deal);
    }
  }

  return deals;
}

async function readFileAsCsv(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const isXlsx =
    name.endsWith('.xlsx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (isXlsx) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const [firstSheetName] = workbook.SheetNames;
    if (!firstSheetName) {
      throw new Error('The XLSX file did not contain any sheets.');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_csv(worksheet, { FS: ',', strip: true });
  }

  return file.text();
}

async function parseDealsFile(file: File): Promise<{ deals: Deal[]; mode: 'flat' | 'report' }> {
  const content = await readFileAsCsv(file);
  const flatResult = await tryParseFlat(content);

  if (flatResult.kind === 'success') {
    return { deals: flatResult.deals, mode: 'flat' };
  }

  const reportDeals = parseReportStyle(content);
  if (reportDeals.length) {
    return { deals: reportDeals, mode: 'report' };
  }

  if (flatResult.kind === 'missingHeaders') {
    throw new Error(`Missing required column(s): ${flatResult.missing.join(', ')}`);
  }

  throw new Error('Unable to parse file. Please ensure it is a supported CSV or XLSX export.');
}

function formatDate(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function extractYear(dateString: string): number | null {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  const year = parsed.getFullYear();
  return Number.isNaN(year) ? null : year;
}

function useBuyerData() {
  const [rawDeals, setRawDeals] = useState<Deal[]>([]);
  const [storedStats, setStoredStats] = useState<BuyerStatRecord[]>([]);
  const [lastImportAt, setLastImportAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const database = getDb();
      const rawPromise = getDocs(collection(database, 'buyers_raw'));
      const statsPromise = getDocs(collection(database, 'buyer_stats'));
      const metaPromise = getDoc(doc(database, 'buyer_meta', 'app'));
      const [rawSnapshot, statsSnapshot, metaSnapshot] = await Promise.all([
        rawPromise,
        statsPromise,
        metaPromise,
      ]);
      const deals = rawSnapshot.docs.map((docSnap) => deserializeDeal(docSnap.data()));
      const stats = statsSnapshot.docs.map((docSnap) => deserializeStat(docSnap.id, docSnap.data()));
      setRawDeals(deals);
      setStoredStats(stats);
      if (metaSnapshot.exists()) {
        const ts = metaSnapshot.data()?.lastImportAt;
        if (ts && typeof ts.toDate === 'function') {
          setLastImportAt(ts.toDate());
        } else {
          setLastImportAt(null);
        }
      } else {
        setLastImportAt(null);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load buyer data.');
      setRawDeals([]);
      setStoredStats([]);
      setLastImportAt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    rawDeals,
    storedStats,
    lastImportAt,
    loading,
    error,
    refresh: fetchData,
  };
}

export default function BuyersRoute() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [usedReportStyle, setUsedReportStyle] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('totalDeals');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState<number>(currentYear);
  const [endYear, setEndYear] = useState<number>(currentYear);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    rawDeals,
    storedStats,
    lastImportAt,
    loading,
    error,
    refresh,
  } = useBuyerData();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setUsedReportStyle(false);
  };

  const onUpload = useCallback(async () => {
    if (!file) {
      setStatus({ kind: 'error', message: 'Please select a CSV or XLSX file to upload.' });
      return;
    }
    setUploading(true);
    setUsedReportStyle(false);
    setStatus({ kind: 'info', message: 'Parsing file…' });

    try {
      const { deals, mode } = await parseDealsFile(file);
      if (!deals.length) {
        throw new Error('The file did not contain any rows to import.');
      }

      setUsedReportStyle(mode === 'report');

      const database = getDb();

      setStatus({ kind: 'info', message: 'Clearing previous buyer data…' });
      await chunkedDelete('buyers_raw');
      await chunkedDelete('buyer_stats');

      setStatus({ kind: 'info', message: 'Writing raw deals…' });
      await writeRawDeals(database, deals);

      const stats = aggregateDeals(deals);

      setStatus({ kind: 'info', message: 'Writing buyer statistics…' });
      await writeBuyerStats(database, stats);

      await setDoc(doc(database, 'buyer_meta', 'app'), { lastImportAt: serverTimestamp() }, { merge: true });

      setStatus({
        kind: 'success',
        message: `Imported ${deals.length} deals across ${stats.length} buyers.`,
      });

      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      await refresh();
    } catch (err) {
      console.error(err);
      setStatus({
        kind: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while processing the file.',
      });
    } finally {
      setUploading(false);
    }
  }, [file, refresh]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!uploading) {
      void onUpload();
    }
  };

  const filteredDeals = useMemo(() => {
    if (!rawDeals.length) return null;
    const [rangeStart, rangeEnd] = startYear <= endYear ? [startYear, endYear] : [endYear, startYear];
    return rawDeals.filter((deal) => {
      const year = extractYear(deal.dealDate);
      if (year === null) return true;
      return year >= rangeStart && year <= rangeEnd;
    });
  }, [rawDeals, startYear, endYear]);

  const displayStats = useMemo(() => {
    if (filteredDeals) {
      if (!filteredDeals.length) {
        return [];
      }
      return aggregateDeals(filteredDeals);
    }
    return storedStats;
  }, [filteredDeals, storedStats]);

  const hasMileage = useMemo(
    () => displayStats.some((stat) => typeof stat.averages.mileage === 'number'),
    [displayStats],
  );

  const sortedStats = useMemo(() => {
    const sorted = [...displayStats];
    sorted.sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'buyer':
          return multiplier * a.buyer.localeCompare(b.buyer);
        case 'totalDeals': {
          if (a.totalDeals === b.totalDeals) {
            const avgA = a.averages.gross ?? 0;
            const avgB = b.averages.gross ?? 0;
            return multiplier * (avgA === avgB ? a.buyer.localeCompare(b.buyer) : avgA - avgB);
          }
          return multiplier * (a.totalDeals - b.totalDeals);
        }
        case 'avgPrice':
          return multiplier * ((a.averages.price ?? 0) - (b.averages.price ?? 0));
        case 'avgCost':
          return multiplier * ((a.averages.cost ?? 0) - (b.averages.cost ?? 0));
        case 'avgGross':
          return multiplier * ((a.averages.gross ?? 0) - (b.averages.gross ?? 0));
        case 'avgYear':
          return multiplier * ((a.averages.year ?? 0) - (b.averages.year ?? 0));
        case 'avgMileage':
          return multiplier * ((a.averages.mileage ?? 0) - (b.averages.mileage ?? 0));
        default:
          return 0;
      }
    });
    return sorted;
  }, [displayStats, sortDirection, sortKey]);

  const onSort = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDirection('desc');
      return key;
    });
  };

  const resetStatus = () => setStatus(null);

  const handleStartYearChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      setStartYear(value);
    }
  };

  const handleEndYearChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      setEndYear(value);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-slate-100">
      <h1 className="text-3xl font-semibold">Buyer Insights</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div>
          <label htmlFor="buyers-file" className="block text-sm font-medium text-slate-300">
            Import buyer deals CSV or XLSX
          </label>
          <input
            id="buyers-file"
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            disabled={uploading}
            ref={inputRef}
            className="mt-2 block w-full rounded border border-slate-700 bg-slate-800 p-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-800"
          >
            {uploading ? 'Uploading…' : 'Upload & Overwrite'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (inputRef.current) {
                inputRef.current.value = '';
              }
              setStatus(null);
              setUsedReportStyle(false);
            }}
            className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            Re-upload file
          </button>
          <div className="text-xs text-slate-400">
            {lastImportAt ? `Last import: ${formatDate(lastImportAt)}` : 'No imports yet.'}
          </div>
        </div>
        {usedReportStyle && (
          <div className="rounded border border-amber-600 bg-amber-900/40 px-3 py-2 text-sm text-amber-200">
            Parsed report-style CSV and normalized into rows.
          </div>
        )}
        {status && (
          <div
            role="status"
            className={`rounded border px-3 py-2 text-sm ${
              status.kind === 'success'
                ? 'border-emerald-700 bg-emerald-900/40 text-emerald-200'
                : status.kind === 'error'
                  ? 'border-rose-700 bg-rose-900/40 text-rose-200'
                  : 'border-slate-600 bg-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{status.message}</span>
              <button type="button" onClick={resetStatus} className="text-xs text-slate-300 hover:text-white">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </form>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4 rounded border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center gap-2">
            <label htmlFor="start-year" className="text-sm text-slate-300">
              Start year
            </label>
            <input
              id="start-year"
              type="number"
              value={startYear}
              onChange={handleStartYearChange}
              className="w-24 rounded border border-slate-700 bg-slate-800 p-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="end-year" className="text-sm text-slate-300">
              End year
            </label>
            <input
              id="end-year"
              type="number"
              value={endYear}
              onChange={handleEndYearChange}
              className="w-24 rounded border border-slate-700 bg-slate-800 p-1 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded border border-slate-700 bg-slate-900 p-6 text-center text-slate-300">
            Loading buyer statistics…
          </div>
        ) : error ? (
          <div className="rounded border border-rose-700 bg-rose-900/40 p-6 text-center text-rose-200">
            {error}
          </div>
        ) : sortedStats.length === 0 ? (
          <div className="rounded border border-slate-700 bg-slate-900 p-6 text-center text-slate-300">
            No buyer data yet. Upload a CSV or XLSX to get started.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-slate-700">
            <table className="min-w-full divide-y divide-slate-700 text-sm">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <SortableHeader label="Buyer" sortKey="buyer" currentKey={sortKey} direction={sortDirection} onSort={onSort} />
                  <SortableHeader
                    label="Deals"
                    sortKey="totalDeals"
                    currentKey={sortKey}
                    direction={sortDirection}
                    onSort={onSort}
                  />
                  <SortableHeader
                    label="Avg Price"
                    sortKey="avgPrice"
                    currentKey={sortKey}
                    direction={sortDirection}
                    onSort={onSort}
                  />
                  <SortableHeader
                    label="Avg Cost"
                    sortKey="avgCost"
                    currentKey={sortKey}
                    direction={sortDirection}
                    onSort={onSort}
                  />
                  <SortableHeader
                    label="Avg Gross"
                    sortKey="avgGross"
                    currentKey={sortKey}
                    direction={sortDirection}
                    onSort={onSort}
                  />
                  <SortableHeader
                    label="Avg Year"
                    sortKey="avgYear"
                    currentKey={sortKey}
                    direction={sortDirection}
                    onSort={onSort}
                  />
                  {hasMileage && (
                    <SortableHeader
                      label="Avg Mileage"
                      sortKey="avgMileage"
                      currentKey={sortKey}
                      direction={sortDirection}
                      onSort={onSort}
                    />
                  )}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Top Models
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900 text-slate-200">
                {sortedStats.map((stat) => (
                  <tr key={stat.buyerId} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-medium">{stat.buyer}</td>
                    <td className="px-4 py-3">{stat.totalDeals}</td>
                    <td className="px-4 py-3">{formatCurrency(stat.averages.price)}</td>
                    <td className="px-4 py-3">{formatCurrency(stat.averages.cost)}</td>
                    <td className="px-4 py-3">{formatCurrency(stat.averages.gross)}</td>
                    <td className="px-4 py-3">{stat.averages.year ?? '—'}</td>
                    {hasMileage && (
                      <td className="px-4 py-3">{formatNumber(stat.averages.mileage)}</td>
                    )}
                    <td className="px-4 py-3 text-slate-300">
                      {stat.preferredModels.length
                        ? stat.preferredModels.map((model) => `${model.vehicle} (${model.count})`).join(', ')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

type SortableHeaderProps = {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
};

function SortableHeader({ label, sortKey, currentKey, direction, onSort }: SortableHeaderProps) {
  const isActive = currentKey === sortKey;
  return (
    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 transition ${isActive ? 'text-white' : 'text-slate-300 hover:text-white'}`}
      >
        <span>{label}</span>
        <span className="text-xs">{isActive ? (direction === 'asc' ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );
}

function formatCurrency(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat().format(value);
}
