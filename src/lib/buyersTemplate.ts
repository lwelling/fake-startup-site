import * as XLSX from 'xlsx';

const FLAT_HEADERS = [
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
  'Mileage',
];

const FLAT_SAMPLE_ROWS = [
  [
    '2024-02-01',
    'D-240201',
    'Acme Imports',
    'Delivered',
    'Alex Rivera',
    'Jules Martin',
    '2024 Honda CR-V EX',
    'STK1024',
    '7FARW2H8XSE123456',
    38995,
    33200,
    5795,
    495,
    350,
    12_150,
  ],
  [
    '2024-02-05',
    'D-240205',
    'Sunrise Autos',
    'Pending',
    'Taylor Chen',
    '',
    '2023 Ford F-150 Lariat',
    'STK1029',
    '1FTFW1E50PFA65432',
    58990,
    52200,
    6790,
    395,
    600,
    8_420,
  ],
];

const REPORT_BLOCK: (string | number)[][] = [
  ['Deal Date', '2024-02-01', '', 'Vehicle', '2024 Honda CR-V EX'],
  ['Deal Number', 'D-240201', '', 'VIN', '7FARW2H8XSE123456'],
  ['Buyer', 'Acme Imports', '', 'Stock #', 'STK1024'],
  ['Deal Status', 'Delivered', '', '', ''],
  ['Sales Rep 1', 'Alex Rivera', '', '', ''],
  ['Sales Rep 2', 'Jules Martin', '', '', ''],
  ['', '', '', '', ''],
  ['Fees', '', '', '', '', 'F', 495],
  ['Transportation', '', '', '', '', 'F', 350],
  ['', '', '', '', '', '', ''],
  ['Totals', '', '', '', '', 'Price', 'Cost', 'Gross'],
  ['', '', '', '', '', 38995, 33200, 5795],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', 'Vehicle', '2023 Ford F-150 Lariat'],
  ['', '', '', 'VIN', '1FTFW1E50PFA65432'],
  ['', '', '', 'Stock #', 'STK1029'],
  ['', '', '', '', '', '', '', ''],
  ['Deal Date', '2024-02-05'],
  ['Deal Number', 'D-240205'],
  ['Buyer', 'Sunrise Autos'],
  ['Deal Status', 'Pending'],
  ['Sales Rep 1', 'Taylor Chen'],
  ['Sales Rep 2', ''],
  ['Fees', '', '', '', '', 'F', 395],
  ['Transportation', '', '', '', '', 'F', 600],
  ['', '', '', '', '', '', ''],
  ['Totals', '', '', '', '', 'Price', 'Cost', 'Gross'],
  ['', '', '', '', '', 58990, 52200, 6790],
];

const MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function buildFlatSheet(): XLSX.WorkSheet {
  const headerRow = [FLAT_HEADERS];
  const worksheet = XLSX.utils.aoa_to_sheet(headerRow.concat(FLAT_SAMPLE_ROWS));
  return worksheet;
}

function buildReportSheet(): XLSX.WorkSheet {
  const worksheet = XLSX.utils.aoa_to_sheet(REPORT_BLOCK);
  return worksheet;
}

export function buildBuyersTemplateWorkbook(): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildFlatSheet(), 'Flat Table');
  XLSX.utils.book_append_sheet(workbook, buildReportSheet(), 'Report Style');
  return workbook;
}

export function downloadBuyersTemplate(
  filename = 'buyers-import-template.xlsx',
): void {
  const workbook = buildBuyersTemplateWorkbook();
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: MIME_TYPE });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
