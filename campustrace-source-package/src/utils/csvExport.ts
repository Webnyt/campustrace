import { LostFoundItem } from '../types';

/**
 * Escapes fields containing commas, double quotes, or line breaks according to RFC 4180.
 */
function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports an array of LostFoundItem records to a formatted CSV file and triggers a browser download.
 */
export function exportItemsToCsv(
  items: LostFoundItem[],
  customFilename?: string
): boolean {
  if (!items || items.length === 0) {
    return false;
  }

  const headers = [
    'Item ID',
    'Item Name',
    'Type',
    'Category',
    'Status',
    'Location Found',
    'Handover Location',
    'Finder/Owner Name',
    'Contact Phone',
    'Description',
    'Claimed By',
    'Claim Date',
    'Claim Notes',
    'Date Posted',
  ];

  const rows = items.map((item) => [
    escapeCsvField(item.item_id),
    escapeCsvField(item.item_name),
    escapeCsvField(item.item_type === 'lost' ? 'Lost Report' : 'Found Item'),
    escapeCsvField(item.category_name),
    escapeCsvField(item.item_status),
    escapeCsvField(item.location_found),
    escapeCsvField(item.dropoff_location || 'With Finder'),
    escapeCsvField(item.finder_name || 'Anonymous'),
    escapeCsvField(item.finder_contact),
    escapeCsvField(item.description),
    escapeCsvField(item.claimed_by || 'N/A'),
    escapeCsvField(item.claimed_date ? new Date(item.claimed_date).toLocaleString() : 'N/A'),
    escapeCsvField(item.claim_notes || 'N/A'),
    escapeCsvField(new Date(item.date_posted).toLocaleString()),
  ]);

  // Include UTF-8 BOM so Excel opens special characters correctly
  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const defaultFilename = `campustrace_items_${new Date().toISOString().slice(0, 10)}.csv`;
  const filename = customFilename || defaultFilename;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
