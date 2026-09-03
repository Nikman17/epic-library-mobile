import { storage } from '#imports';
import { log } from './logger';
import { normTitle } from './epic';

export interface GameMeta {
  productUrl?: string;
  imageUrl?: string;
  tags?: string[];
  namespace?: string;
  offerId?: string;
  releaseDateMillis?: number;
  resolvedAt?: number;      // when url/image/ids were resolved
  tagsResolvedAt?: number;  // when tags were last attempted
  failedAt?: number;        // negative cache timestamp
}

export type MetaMap = Record<string, GameMeta>;

export const gameMetaItem = storage.defineItem<MetaMap>('local:gameMeta', { fallback: {} });

export const META_TTL_MS = 7 * 24 * 60 * 60 * 1000; // covers/links/tags: 7 days (images almost never change)
export const FAIL_TTL_MS = 24 * 60 * 60 * 1000;     // failed lookups: retry after a day

let metaMap: MetaMap | null = null;
let loadPromise: Promise<MetaMap> | null = null;

export function loadMetaMap(): Promise<MetaMap> {
  if (metaMap) return Promise.resolve(metaMap);
  if (!loadPromise) {
    loadPromise = gameMetaItem.getValue().then((v) => {
      metaMap = v || {};
      return metaMap;
    });
  }
  return loadPromise;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (metaMap) gameMetaItem.setValue(metaMap).catch((e) => log('Meta cache save failed: ' + String(e)));
  }, 1000);
}

export function isCoreFresh(meta?: GameMeta): boolean {
  return !!meta?.resolvedAt && (Date.now() - meta.resolvedAt) < META_TTL_MS;
}

export function needsResolve(meta?: GameMeta): boolean {
  if (!meta) return true;
  const failedRecently = !!meta.failedAt && (Date.now() - meta.failedAt) < FAIL_TTL_MS;
  if (!isCoreFresh(meta)) return !failedRecently;
  const tagsFresh = !!meta.tagsResolvedAt && (Date.now() - meta.tagsResolvedAt) < META_TTL_MS;
  return !(meta.tags && meta.tags.length) && !tagsFresh && !!meta.productUrl;
}

export function searchUrlFor(title: string): string {
  return `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(title)}&sortBy=relevancy&sortDir=DESC&count=40&start=0`;
}

// Small resized preview via Epic CDN params (falls back to the raw URL in the card on error).
export function resizedImageUrl(url: string): string {
  if (!url || url.includes('?')) return url;
  return `${url}?resize=1&w=480&quality=medium`;
}

function scoreMatch(target: string, candidate: string): number {
  const t = normTitle(target);
  const c = normTitle(candidate);
  if (!t || !c) return 0;
  if (t === c) return 3;
  if (c.startsWith(t) || t.startsWith(c)) return 2;
  if (c.includes(t) || t.includes(c)) return 1;
  return 0;
}

function graphqlUrl(): string {
  try {
    if (location.hostname === 'store.epicgames.com') return `${location.origin}/graphql`;
  }
  catch { /* not in a window context */ }
  return 'https://store.epicgames.com/graphql';
}

const SEARCH_QUERY = `query searchStoreQuery($keywords: String, $country: String!, $locale: String, $count: Int) {
  Catalog {
    searchStore(keywords: $keywords, country: $country, locale: $locale, count: $count) {
      elements {
        title
        id
        namespace
        effectiveDate
        keyImages { type url }
        productSlug
        urlSlug
        url
        tags { id name }
        catalogNs { mappings(pageType: "productHome") { pageSlug pageType } }
        offerMappings { pageSlug pageType }
      }
      paging { count total }
    }
  }
}`;

const IMAGE_TYPE_PRIORITY = [
  'OfferImageWide',
  'DieselStoreFrontWide',
  'DieselGameBoxWide',
  'Featured',
  'OfferImageTall',
  'DieselGameBoxTall',
  'Thumbnail',
];

function pickImage(keyImages?: Array<{ type?: string; url?: string }>): string | undefined {
  if (!keyImages?.length) return undefined;
  for (const type of IMAGE_TYPE_PRIORITY) {
    const hit = keyImages.find((k) => k.type === type && k.url);
    if (hit) return hit.url;
  }
  return keyImages.find((k) => !!k.url)?.url;
}

function cleanSlug(slug?: string | null): string | undefined {
  if (!slug || slug === '[]') return undefined;
  let s = slug.replace(/^\/+/, '').replace(/\/home$/, '').trim();
  if (!s) return undefined;
  return s;
}

async function graphqlSearch(title: string): Promise<Partial<GameMeta> | null> {
  const res = await fetch(graphqlUrl(), {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { keywords: title, country: 'US', locale: 'en-US', count: 8 },
    }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);

  const json = await res.json();
  const elements: any[] = json?.data?.Catalog?.searchStore?.elements || [];
  if (!elements.length) {
    if (json?.errors?.length) throw new Error('GraphQL error: ' + (json.errors[0]?.message || 'unknown'));
    return null;
  }

  let best: any = null;
  let bestScore = 0;
  for (const el of elements) {
    const score = scoreMatch(title, el?.title || '');
    if (score > bestScore) { best = el; bestScore = score; }
  }
  if (!best) return null;

  const slug = cleanSlug(best.catalogNs?.mappings?.[0]?.pageSlug)
    || cleanSlug(best.offerMappings?.find((m: any) => m?.pageType === 'productHome')?.pageSlug)
    || cleanSlug(best.offerMappings?.[0]?.pageSlug)
    || cleanSlug(best.productSlug)
    || cleanSlug(best.urlSlug);

  const productUrl = slug
    ? `https://store.epicgames.com/en-US/p/${slug}`
    : (typeof best.url === 'string' && best.url.startsWith('http') ? best.url : undefined);

  const tags: string[] = (best.tags || [])
    .map((t: any) => (typeof t?.name === 'string' ? t.name.trim() : ''))
    .filter((name: string) => !!name)
    .slice(0, 10);

  let releaseDateMillis: number | undefined;
  if (best.effectiveDate) {
    const ms = Date.parse(best.effectiveDate);
    if (!Number.isNaN(ms) && new Date(ms).getFullYear() < 2090) releaseDateMillis = ms;
  }

  return {
    productUrl,
    imageUrl: pickImage(best.keyImages),
    tags: tags.length ? tags : undefined,
    namespace: best.namespace || undefined,
    offerId: best.id || undefined,
    releaseDateMillis,
  };
}

// Fallback: parse the store search page HTML for a direct product link + cover image.
async function scrapeSearch(title: string): Promise<Partial<GameMeta> | null> {
  const res = await fetch(searchUrlFor(title), {
    credentials: 'include',
    mode: 'cors',
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  if (!res.ok) throw new Error(`Search page HTTP ${res.status}`);

  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const anchors = [...doc.querySelectorAll<HTMLAnchorElement>('a[href*="/p/"]')];

  let best: { url: string; image?: string; score: number } | null = null;
  for (const a of anchors) {
    const href = a.getAttribute('href') || '';
    const slugMatch = href.match(/\/p\/([^/?#]+)/);
    if (!slugMatch) continue;

    const candTitle = a.getAttribute('aria-label') || a.textContent || '';
    const score = scoreMatch(title, candTitle);
    if (score < 1) continue;

    let image: string | undefined;
    const img = a.querySelector('img');
    if (img) {
      image = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-image') || undefined;
      if (!image) {
        const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
        if (srcset) image = srcset.split(',')[0]?.trim().split(/\s+/)[0];
      }
    }

    const url = href.startsWith('http') ? href : `https://store.epicgames.com${href.startsWith('/') ? '' : '/'}${href}`;
    if (!best || score > best.score || (score === best.score && !best.image && image)) {
      best = { url, image, score };
    }
  }

  if (!best) return null;
  return { productUrl: best.url, imageUrl: best.image };
}

function extractArraySlice(s: string, startIdx: number): string | null {
  let depth = 0;
  for (let i = startIdx; i < s.length && i < startIdx + 30000; i++) {
    const ch = s[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return s.slice(startIdx, i + 1);
    }
  }
  return null;
}

function isReasonableTag(t: string): boolean {
  return !!t && t.length >= 2 && t.length <= 30 && !/[{}<>"]/.test(t);
}

// Scrape the product page: tags (genres/features), plus og:image / release date as extras.
async function scrapeProduct(productUrl: string): Promise<{ tags: string[]; imageUrl?: string; releaseDateMillis?: number }> {
  const res = await fetch(productUrl, {
    credentials: 'include',
    mode: 'cors',
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  if (!res.ok) throw new Error(`Product page HTTP ${res.status}`);

  const html = await res.text();
  const tags = new Set<string>();
  let releaseDateMillis: number | undefined;
  let imageUrl: string | undefined;

  // 1. Embedded state: "tags":[{..."name":"Action"...}]
  let idx = 0;
  while (tags.size < 12) {
    const found = html.indexOf('"tags":[', idx);
    if (found === -1) break;
    const slice = extractArraySlice(html, found + '"tags":'.length);
    if (slice) {
      for (const m of slice.matchAll(/"name"\s*:\s*"([^"]+)"/g)) {
        const t = m[1].trim();
        if (isReasonableTag(t)) tags.add(t);
      }
    }
    idx = found + 8;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // 2. JSON-LD: genre + release date
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.textContent || 'null');
      const objects = Array.isArray(data) ? data : [data];
      for (const obj of objects) {
        if (!obj || typeof obj !== 'object') continue;
        const genre = (obj as any).genre;
        if (typeof genre === 'string' && isReasonableTag(genre)) tags.add(genre.trim());
        if (Array.isArray(genre)) genre.forEach((g) => { if (typeof g === 'string' && isReasonableTag(g)) tags.add(g.trim()); });
        const date = (obj as any).releaseDate || (obj as any).datePublished;
        if (!releaseDateMillis && typeof date === 'string') {
          const ms = Date.parse(date);
          if (!Number.isNaN(ms)) releaseDateMillis = ms;
        }
        const image = (obj as any).image;
        if (!imageUrl && typeof image === 'string' && image.startsWith('http')) imageUrl = image;
      }
    }
    catch { /* invalid JSON-LD */ }
  }

  // 3. Genre/feature links on the page
  if (tags.size < 3) {
    for (const a of doc.querySelectorAll<HTMLAnchorElement>('a[href*="tag="], a[href*="/tags/"], a[href*="genre"]')) {
      const t = (a.textContent || '').trim();
      if (isReasonableTag(t)) tags.add(t);
      if (tags.size >= 12) break;
    }
  }

  if (!imageUrl) {
    const og = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (og && og.startsWith('http')) imageUrl = og;
  }

  return { tags: [...tags].slice(0, 10), imageUrl, releaseDateMillis };
}

async function doResolve(key: string, title: string): Promise<GameMeta> {
  const map = await loadMetaMap();
  const existing: GameMeta = map[key] || {};
  const now = Date.now();

  const failedRecently = !!existing.failedAt && (now - existing.failedAt) < FAIL_TTL_MS;
  const coreFresh = isCoreFresh(existing);
  if (!coreFresh && failedRecently) return existing;

  const meta: GameMeta = { ...existing };

  if (!coreFresh) {
    let core: Partial<GameMeta> | null = null;
    try {
      core = await graphqlSearch(title);
      if (core) log(`Meta via GraphQL: ${title}`);
      else log(`GraphQL: no match for "${title}"`);
    }
    catch (e) {
      log(`GraphQL failed for "${title}": ${String(e)} — trying search page`);
    }

    if (!core || (!core.productUrl && !core.imageUrl)) {
      try {
        const scraped = await scrapeSearch(title);
        if (scraped) {
          core = { ...core, ...scraped };
          log(`Meta via search page: ${title}`);
        }
        else {
          log(`Search page: no match for "${title}"`);
        }
      }
      catch (e) {
        log(`Search page failed for "${title}": ${String(e)}`);
      }
    }

    if (core && (core.productUrl || core.imageUrl)) {
      Object.assign(meta, {
        ...core,
        tags: core.tags?.length ? core.tags : meta.tags,
        resolvedAt: now,
        failedAt: undefined,
      });
    }
    else {
      meta.failedAt = now;
    }
  }

  const tagsFresh = !!meta.tagsResolvedAt && (now - meta.tagsResolvedAt) < META_TTL_MS;
  if (meta.productUrl && !(meta.tags && meta.tags.length) && !tagsFresh) {
    try {
      const product = await scrapeProduct(meta.productUrl);
      if (product.tags.length) meta.tags = product.tags;
      if (!meta.imageUrl && product.imageUrl) meta.imageUrl = product.imageUrl;
      if (!meta.releaseDateMillis && product.releaseDateMillis) meta.releaseDateMillis = product.releaseDateMillis;
      log(`Tags for "${title}": ${product.tags.length ? product.tags.join(', ') : 'none found'}`);
    }
    catch (e) {
      log(`Product page failed for "${title}": ${String(e)}`);
    }
    meta.tagsResolvedAt = now;
  }

  map[key] = meta;
  scheduleSave();
  return meta;
}

// --- Throttled queue: max 2 concurrent lookups with a gap between starts ---

const CONCURRENCY = 2;
const GAP_MS = 350;
const pending = new Map<string, Promise<GameMeta>>();
let active = 0;
const waiters: Array<() => void> = [];

async function acquire() {
  while (active >= CONCURRENCY) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  active++;
}

function release() {
  active--;
  setTimeout(() => waiters.shift()?.(), GAP_MS);
}

export function resolveMetaQueued(key: string, title: string): Promise<GameMeta> {
  const existing = pending.get(key);
  if (existing) return existing;

  const p = (async () => {
    await acquire();
    try {
      return await doResolve(key, title);
    }
    finally {
      release();
      pending.delete(key);
    }
  })();

  pending.set(key, p);
  return p;
}
