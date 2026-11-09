import { LostFoundItem, Category, StatsData } from '../types';
import { CAMPUS_CATEGORIES } from '../data/mockData';

const STORAGE_KEY = 'campustrace_items_backup';

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return data.categories || CAMPUS_CATEGORIES;
  } catch (err) {
    console.warn('Using default categories fallback', err);
    return CAMPUS_CATEGORIES;
  }
}

export async function fetchItems(params?: {
  category?: string;
  status?: string;
  search?: string;
  type?: string;
}): Promise<LostFoundItem[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'All') query.set('category', params.category);
  if (params?.status && params.status !== 'All') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.type && params.type !== 'All') query.set('type', params.type);

  try {
    const res = await fetch(`/api/items?${query.toString()}`);
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    if (data.items) {
      // cache locally in case of offline reload
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.items));
      return data.items;
    }
    throw new Error('No items returned');
  } catch (err) {
    console.warn('Failed to fetch items from backend, using local cache', err);
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        let items: LostFoundItem[] = JSON.parse(cached);
        if (params?.category && params.category !== 'All') {
          items = items.filter(
            (i) => i.category_name.toLowerCase() === params.category!.toLowerCase()
          );
        }
        if (params?.status && params.status !== 'All') {
          items = items.filter((i) => i.item_status === params.status);
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          items = items.filter((i) =>
            `${i.item_name} ${i.location_found} ${i.description}`.toLowerCase().includes(q)
          );
        }
        return items;
      } catch {
        // ignore parse error
      }
    }
    return [];
  }
}

export async function createItem(item: Partial<LostFoundItem>): Promise<{ success: boolean; item?: LostFoundItem; message: string }> {
  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to post item' };
    }
    return { success: true, item: data.item, message: data.message || 'Item posted successfully!' };
  } catch (err) {
    console.error('API createItem error:', err);
    return { success: false, message: 'Could not connect to server to post item.' };
  }
}

export async function claimItem(itemId: number | string, payload: { claimed_by: string; claim_notes: string }): Promise<{ success: boolean; item?: LostFoundItem; message: string }> {
  try {
    const res = await fetch(`/api/items/${itemId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to claim item' };
    }
    return { success: true, item: data.item, message: data.message || 'Item marked as claimed!' };
  } catch (err) {
    console.error('API claimItem error:', err);
    return { success: false, message: 'Network error claiming item.' };
  }
}

export async function unclaimItem(itemId: number | string): Promise<{ success: boolean; item?: LostFoundItem }> {
  try {
    const res = await fetch(`/api/items/${itemId}/unclaim`, {
      method: 'POST',
    });
    const data = await res.json();
    return { success: res.ok, item: data.item };
  } catch (err) {
    console.error('API unclaim error:', err);
    return { success: false };
  }
}

export async function deleteItem(itemId: number | string): Promise<boolean> {
  try {
    const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}


export async function fetchStats(): Promise<StatsData | null> {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return null;
    const data = await res.json();
    return data.stats;
  } catch {
    return null;
  }
}

export async function resetDemoData(): Promise<LostFoundItem[]> {
  try {
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}
