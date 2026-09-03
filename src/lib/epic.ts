import { browser, storage } from '#imports';
import { log } from './logger';

export interface OrderItem {
  description: string;
  quantity: number;
  amount: number;
  currency: string;
}

export interface Order {
  orderId: string;
  createdAtMillis: number;
  items: OrderItem[];
}

export interface OrderResponse {
  orders: Order[];
  nextPageToken?: string;
}

// One entry per owned game (orders are flattened and deduplicated).
export interface LibraryGame {
  key: string;               // normalized title, used as meta cache key
  title: string;             // clean display title
  rawTitle: string;          // original purchase description
  purchaseDateMillis: number;
  price: number;
  currency: string;
}

export interface LibraryResult {
  games: LibraryGame[];
  fetchedAt: number;
  fromCache: boolean;
  warning?: string;
}

export const gamesListItem = storage.defineItem<Order[]>('local:gamesList');
export const gamesListFetchedAtItem = storage.defineItem<number>('local:gamesListFetchedAt', { fallback: 0 });

export const ORDERS_TTL_MS = 24 * 60 * 60 * 1000; // cache the games list for 24 hours

const EDITION_WORDS = "standard|deluxe|definitive|ultimate|complete|premium|gold|digital|enhanced|special|collector'?s?|game of the year|goty|anniversary|remastered|epic|founder'?s?|launch|base";

// Strip purchase noise like "— Deluxe Edition", trailing "(...)" etc.
export function cleanTitle(raw: string): string {
  let t = (raw || '').trim();
  t = t.replace(/\s*\([^()]*\)\s*$/, '');
  const editionRe = new RegExp(`\\s*[-–—:|]?\\s*(?:${EDITION_WORDS})\\s+edition$`, 'i');
  t = t.replace(editionRe, '');
  t = t.replace(/\s*[-–—:|]?\s*edition$/i, '');
  t = t.replace(/\s*[-–—:|]+\s*$/, '').trim();
  return t || (raw || '').trim();
}

export function normTitle(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function flattenGames(orders: Order[]): LibraryGame[] {
  const seen = new Map<string, LibraryGame>();
  for (const order of orders) {
    for (const item of order.items || []) {
      const rawTitle = item.description || '';
      if (!rawTitle.trim()) continue;
      const title = cleanTitle(rawTitle);
      const key = normTitle(title);
      if (!key || seen.has(key)) continue;
      seen.set(key, {
        key,
        title,
        rawTitle,
        purchaseDateMillis: order.createdAtMillis,
        price: Number(item.amount) || 0,
        currency: item.currency || '',
      });
    }
  }
  return [...seen.values()];
}

const FETCH_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.5',
  'x-requested-with': 'XMLHttpRequest',
  'Content-Type': 'application/json;charset=utf-8',
  'Sec-GPC': '1',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
};

async function tryRelogin(): Promise<boolean> {
  try {
    const ok = await browser.runtime.sendMessage({ type: 'needLogin' });
    if (ok) return true;
  }
  catch (e) {
    log('needLogin via background failed, retrying directly: ' + String(e));
  }
  try {
    const res = await fetch('https://www.epicgames.com/id/api/login?redirect_uri=https%3A%2F%2Fwww.epicgames.com%2Faccount%2Fpersonal%3Flang%3Den-US%26productName%3Degs', {
      credentials: 'include',
      headers: FETCH_HEADERS,
      referrer: 'https://www.epicgames.com/',
      method: 'GET',
      mode: 'cors',
    });
    return res.ok;
  }
  catch {
    return false;
  }
}

async function fetchOrdersPage(pageToken?: string, isRetry = false): Promise<OrderResponse> {
  const url = new URL('https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory');
  url.searchParams.append('count', '10');
  url.searchParams.append('sortDir', 'DESC');
  url.searchParams.append('sortBy', 'DATE');
  url.searchParams.append('locale', 'en-US');
  if (pageToken) url.searchParams.append('nextPageToken', pageToken);

  const response = await fetch(url.toString(), {
    credentials: 'include',
    headers: FETCH_HEADERS,
    referrer: 'https://www.epicgames.com/',
    method: 'GET',
    mode: 'cors',
  });

  const data = await response.json();
  if (!data) throw new Error('Invalid response from Epic Games API');

  if (data.needLogin) {
    if (isRetry) throw new Error('Session expired. Please re-login to access your library.');
    log('Session needs re-login, refreshing…');
    const ok = await tryRelogin();
    if (!ok) throw new Error('Session expired. Please re-login to access your library.');
    return fetchOrdersPage(pageToken, true);
  }
  if (!data.orders) throw new Error('No orders found in the response.');

  return data as OrderResponse;
}

export async function fetchAllOrders(): Promise<Order[]> {
  let allOrders: Order[] = [];
  let nextPageToken: string | undefined = undefined;
  let pageNum = 0;

  log('Fetching order history…');
  do {
    const data: OrderResponse = await fetchOrdersPage(nextPageToken);
    allOrders = [...allOrders, ...data.orders];
    pageNum++;
    log(`Orders page ${pageNum}: +${data.orders.length} (total ${allOrders.length})`);
    nextPageToken = data.nextPageToken;
  }
  while (nextPageToken);

  log(`Fetched ${allOrders.length} orders total`);
  return allOrders;
}

// Returns the library, using the 24h cache unless `force` is set.
export async function getLibrary(force = false): Promise<LibraryResult> {
  const [cachedOrders, fetchedAt] = await Promise.all([
    gamesListItem.getValue(),
    gamesListFetchedAtItem.getValue(),
  ]);
  const hasCache = !!cachedOrders && cachedOrders.length > 0;
  const age = Date.now() - (fetchedAt || 0);
  const fresh = hasCache && age < ORDERS_TTL_MS;

  if (!force && fresh) {
    const games = flattenGames(cachedOrders!);
    log(`Library from cache: ${games.length} games (age ${(age / 3600000).toFixed(1)}h)`);
    return { games, fetchedAt: fetchedAt || 0, fromCache: true };
  }

  try {
    const orders = await fetchAllOrders();
    const now = Date.now();
    await gamesListItem.setValue(orders);
    await gamesListFetchedAtItem.setValue(now);
    const games = flattenGames(orders);
    log(`Library refreshed: ${games.length} games`);
    return { games, fetchedAt: now, fromCache: false };
  }
  catch (e) {
    if (hasCache) {
      log('Refresh failed, falling back to cached library: ' + String(e));
      return {
        games: flattenGames(cachedOrders!),
        fetchedAt: fetchedAt || 0,
        fromCache: true,
        warning: e instanceof Error ? e.message : String(e),
      };
    }
    throw e;
  }
}
