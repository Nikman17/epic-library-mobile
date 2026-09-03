import { log } from './logger';
import { LibraryGame } from './epic';
import { resolveMetaQueued } from './epicMeta';

export interface WishlistProgress {
  done: number;
  total: number;
  added: number;
  skipped: number;
  failed: number;
  current?: string;
}

const GET_WISHLIST_QUERY = `query getWishlist($start: Int, $count: Int) {
  Wishlist {
    wishlistItems(start: $start, count: $count) {
      elements { id offerId namespace }
    }
  }
}`;

const ADD_TO_WISHLIST_MUTATION = `mutation addToWishlistMutation($namespace: String!, $offerId: String!) {
  Wishlist {
    addToWishlist(namespace: $namespace, offerId: $offerId) {
      wishlistItem { id offerId namespace }
    }
  }
}`;

function graphqlUrl(): string {
  try {
    if (location.hostname === 'store.epicgames.com') return `${location.origin}/graphql`;
  }
  catch { /* not in a window context */ }
  return 'https://store.epicgames.com/graphql';
}

async function graphqlRequest(query: string, variables: Record<string, unknown>): Promise<any> {
  const res = await fetch(graphqlUrl(), {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json?.errors?.length && !json?.data) {
    throw new Error('GraphQL error: ' + (json.errors[0]?.message || 'unknown'));
  }
  return json;
}

async function fetchExistingWishlist(): Promise<Set<string>> {
  const json = await graphqlRequest(GET_WISHLIST_QUERY, { start: 0, count: 1000 });
  const elements: any[] = json?.data?.Wishlist?.wishlistItems?.elements || [];
  return new Set(elements.map((e) => `${e.namespace}:${e.offerId}`));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Adds every owned game to the wishlist (resolves namespace/offerId via store search).
export async function addAllToWishlist(
  games: LibraryGame[],
  onProgress: (p: WishlistProgress) => void,
  shouldStop?: () => boolean,
): Promise<WishlistProgress> {
  const progress: WishlistProgress = { done: 0, total: games.length, added: 0, skipped: 0, failed: 0 };

  let existing = new Set<string>();
  try {
    existing = await fetchExistingWishlist();
    log(`Wishlist: ${existing.size} items already present`);
  }
  catch (e) {
    log('Wishlist: could not fetch existing items, continuing anyway: ' + String(e));
  }

  for (const game of games) {
    if (shouldStop?.()) {
      log(`Wishlist run stopped at ${progress.done}/${progress.total}`);
      break;
    }
    progress.current = game.title;
    onProgress({ ...progress });

    try {
      const meta = await resolveMetaQueued(game.key, game.title);
      if (!meta.namespace || !meta.offerId) {
        progress.failed++;
        log(`Wishlist: no offer id for "${game.title}", skipped`);
      }
      else if (existing.has(`${meta.namespace}:${meta.offerId}`)) {
        progress.skipped++;
      }
      else {
        const json = await graphqlRequest(ADD_TO_WISHLIST_MUTATION, {
          namespace: meta.namespace,
          offerId: meta.offerId,
        });
        const item = json?.data?.Wishlist?.addToWishlist?.wishlistItem;
        if (item) {
          progress.added++;
          existing.add(`${meta.namespace}:${meta.offerId}`);
          log(`Wishlist: added "${game.title}"`);
        }
        else {
          const message = json?.errors?.[0]?.message || 'no wishlistItem in response';
          progress.failed++;
          log(`Wishlist: failed to add "${game.title}": ${message}`);
        }
        await sleep(800); // be gentle with the API
      }
    }
    catch (e) {
      progress.failed++;
      log(`Wishlist: error for "${game.title}": ${String(e)}`);
    }

    progress.done++;
    onProgress({ ...progress });
  }

  progress.current = undefined;
  onProgress({ ...progress });
  log(`Wishlist finished: +${progress.added} added, ${progress.skipped} already there, ${progress.failed} failed`);
  return progress;
}
