import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
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
  'Deal Status',
  'Sales Rep 1',
  'Sales Rep 2',
  'Vehicle',
  'Stock #',
  'VIN',
  'Price',
  'Cost',
  'Gross',
  'Fees',
  'Transportation',
] as const;

type CsvRow = Record<string, string>;

type Deal = {
  dealDate: string;
  dealNumber: string;
  buyer: string;
  dealStatus: string;
  salesRep1?: string;
  salesRep2?: string;
  vehicle?: string;
  stock?: string;
  vin?: string;
  price?: number;
  cost?: number;
  gross?: number;
  fees?: number;
  transportation?: number;
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

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/[$,]/g, '').trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  const vehicle = row['Vehicle']?.trim();
  const mileageRaw = hasMileageColumn ? row['Mileage'] : undefined;
  const mileageNumber = parseNumber(mileageRaw);
  return {
    dealDate: row['Deal Date']?.trim() ?? '',
    dealNumber: row['Deal Number']?.trim() ?? '',
    buyer: normaliseBuyer(row['Buyer'] ?? ''),
    dealStatus: row['Deal Status']?.trim() ?? '',
    salesRep1: row['Sales Rep 1']?.trim() || undefined,
    salesRep2: row['Sales Rep 2']?.trim() || undefined,
    vehicle: vehicle || undefined,
    stock: row['Stock #']?.trim() || undefined,
    vin: row['VIN']?.trim() || undefined,
    price: parseNumber(row['Price']),
    cost: parseNumber(row['Cost']),
    gross: parseNumber(row['Gross']),
    fees: parseNumber(row['Fees']),
    transportation: parseNumber(row['Transportation']),
    mileage: hasMileageColumn ? (mileageNumber ?? null) : undefined,
    year: deriveYear(vehicle),
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

    const model = deal.vehicle?.trim();
    if (model) {
      entry.preferredModels.set(model, (entry.preferredModels.get(model) ?? 0) + 1);
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

async function parseCsv(file: File): Promise<ParseResult<CsvRow>> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: resolve,
      error: reject,
    });
  });
}

function validateHeaders(fields: string[] | undefined): { valid: boolean; missing: string[] } {
  const headers = fields ?? [];
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  return { valid: missing.length === 0, missing };
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
  };

  const onUpload = useCallback(async () => {
    if (!file) {
      setStatus({ kind: 'error', message: 'Please select a CSV file to upload.' });
      return;
    }
    setUploading(true);
    setStatus({ kind: 'info', message: 'Parsing CSV…' });

    try {
      const result = await parseCsv(file);
      const { valid, missing } = validateHeaders(result.meta.fields);
      if (!valid) {
        throw new Error(`Missing required column(s): ${missing.join(', ')}`);
      }
      const hasMileageColumn = result.meta.fields?.includes('Mileage') ?? false;
      const deals = result.data.map((row) => normaliseDeal(row, hasMileageColumn));
      if (!deals.length) {
        throw new Error('The CSV file did not contain any rows to import.');
      }

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
            : 'An unexpected error occurred while processing the CSV.',
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
            Import buyer deals CSV
          </label>
          <input
            id="buyers-file"
            type="file"
            accept=".csv"
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
            }}
            className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            Re-upload CSV
          </button>
          <div className="text-xs text-slate-400">
            {lastImportAt ? `Last import: ${formatDate(lastImportAt)}` : 'No imports yet.'}
          </div>
        </div>
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
            No buyer data yet. Upload a CSV to get started.
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

function formatCurrency(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat().format(value);
}
