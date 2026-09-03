import { browser } from '#imports';

// English is the default; Ukrainian is used when the browser UI language is Ukrainian.

const en = {
  appTitle: 'Epic Library',
  fabLabel: 'My Library',
  updated: 'updated {age}',
  justNow: 'just now',
  minAgo: '{n} min ago',
  hoursAgo: '{n} h ago',
  daysAgo: '{n} d ago',
  ariaRefresh: 'Refresh',
  ariaMenu: 'Menu',
  ariaClose: 'Close',
  searchPlaceholder: 'Search games…',
  ariaClearSearch: 'Clear search',
  sortLabel: 'Sort by',
  sortPurchase: 'Purchase date',
  sortName: 'Name',
  sortPrice: 'Price',
  sortRelease: 'Release date',
  ariaSortDir: 'Sort direction',
  tagsLabel: 'Tags',
  menuWishlist: 'Add all to wishlist',
  menuStopWishlist: 'Stop wishlist run',
  menuLogsOn: 'Enable logs',
  menuLogsOff: 'Disable logs',
  menuLightTheme: 'Light theme',
  menuDarkTheme: 'Dark theme',
  menuSettings: 'Settings',
  emptyTitle: 'No data yet',
  emptyText: 'Press the button to load your games. You need to be signed in to Epic Games in this browser.',
  loadBtn: 'Load library',
  loadingLib: 'Loading library…',
  nothingFound: 'Nothing found',
  resetFilters: 'Reset filters',
  ariaPrevPage: 'Previous page',
  ariaNextPage: 'Next page',
  gamesCount: '{n} games',
  refreshingMsg: 'Refreshing library…',
  loadedMsg: 'Loaded {n} games from your library',
  cacheWarn: 'Showing cache ({n} games). Refresh failed: {err}',
  loadFailed: 'Failed to load the library',
  wishlistConfirmTitle: 'Add everything to wishlist?',
  wishlistConfirmText: 'All {n} games from your library will be added to your Epic Store wishlist via search. This takes a while — progress is shown in the notification and logs.',
  cancel: 'Cancel',
  add: 'Add',
  wishlistProgress: 'Wishlist: {done}/{total} — added {added}, existing {skipped}, failed {failed}',
  wishlistDone: 'Wishlist done: added {added}, existing {skipped}, failed {failed}',
  wishlistPrefix: 'Wishlist: ',
  // Log overlay
  logsTitle: 'Logs',
  ariaShowLogs: 'Show logs',
  ariaLogsEnabled: 'Logging enabled',
  copy: 'Copy',
  copied: 'Copied',
  ariaClearLogs: 'Clear logs',
  ariaCloseLogs: 'Close logs',
  logsEmpty: '(empty for now)',
  // Welcome page
  welcomeName: 'Epic Library Mobile',
  welcomeTagline: 'Your Epic Games library right on the store page — paid games and all those claimed freebies. Optimized for phones: big cards, tags, direct links. No keyboard needed.',
  howToUse: 'How to use',
  step1Title: 'Open the Epic Games Store',
  step1Text: 'Go to store.epicgames.com in your browser',
  step2Title: 'Sign in to your Epic Games account',
  step2Text: 'The games list comes from your account order history — paid and free games alike',
  step3Title: 'Tap "My Library"',
  step3Text: 'The floating button in the bottom-right corner opens your library full screen',
  step4Title: 'Tap a game card',
  step4Text: 'The Epic Store game page opens with description, media and prices',
  featuresTitle: 'Features',
  featCardsTitle: 'Game cards',
  featCardsText: 'A 2-column grid, 10 per page: 16:9 cover, clean title and tags. Metadata loads in the background while placeholders are shown.',
  featCacheTitle: 'Smart cache',
  featCacheText: 'The games list is cached for 24 hours; covers, links and tags for 7 days. Refresh manually with the header button.',
  featFilterTitle: 'Search, filters, sorting',
  featFilterText: 'Search by title, filter by tags (tapping a tag on a card also filters), sort by name, price, purchase or release date.',
  featWishlistTitle: 'Add all to wishlist',
  featWishlistText: 'Menu ⋮ → "Add all to wishlist" adds every game you own to your Epic wishlist with progress and a stop option.',
  featLogsTitle: 'Logs',
  featLogsText: 'The terminal icon in the bottom-left corner opens a log panel with a Copy button. Can be disabled in the ⋮ menu (on by default).',
  featDesktopTitle: 'On desktop',
  featDesktopText: 'The classic Alt+G shortcut (Cmd+G on Mac) still works — the extension stays cross-platform.',
  disclaimer: 'This is an unofficial extension: it is not affiliated with or endorsed by Epic Games, Inc.',
  authorLabel: 'Author:',
};

const uk: Record<keyof typeof en, string> = {
  appTitle: 'Epic бібліотека',
  fabLabel: 'Моя бібліотека',
  updated: 'оновлено {age}',
  justNow: 'щойно',
  minAgo: '{n} хв тому',
  hoursAgo: '{n} год тому',
  daysAgo: '{n} дн тому',
  ariaRefresh: 'Оновити',
  ariaMenu: 'Меню',
  ariaClose: 'Закрити',
  searchPlaceholder: 'Пошук ігор…',
  ariaClearSearch: 'Очистити пошук',
  sortLabel: 'Сортування',
  sortPurchase: 'Дата покупки',
  sortName: 'Назва',
  sortPrice: 'Ціна',
  sortRelease: 'Дата виходу',
  ariaSortDir: 'Напрямок сортування',
  tagsLabel: 'Теги',
  menuWishlist: 'Все у вішліст',
  menuStopWishlist: 'Зупинити вішліст',
  menuLogsOn: 'Увімкнути логи',
  menuLogsOff: 'Вимкнути логи',
  menuLightTheme: 'Світла тема',
  menuDarkTheme: 'Темна тема',
  menuSettings: 'Налаштування',
  emptyTitle: 'Даних поки немає',
  emptyText: 'Натисніть кнопку, щоб завантажити список ваших ігор. Потрібен вхід в Epic Games у цьому браузері.',
  loadBtn: 'Завантажити бібліотеку',
  loadingLib: 'Завантажую бібліотеку…',
  nothingFound: 'Нічого не знайдено',
  resetFilters: 'Скинути фільтри',
  ariaPrevPage: 'Попередня сторінка',
  ariaNextPage: 'Наступна сторінка',
  gamesCount: '{n} ігор',
  refreshingMsg: 'Оновлюю бібліотеку…',
  loadedMsg: 'Завантажено {n} ігор з бібліотеки',
  cacheWarn: 'Показую кеш ({n} ігор). Оновлення не вдалося: {err}',
  loadFailed: 'Не вдалося завантажити бібліотеку',
  wishlistConfirmTitle: 'Додати все у вішліст?',
  wishlistConfirmText: 'Всі {n} ігор з вашої бібліотеки буде додано у вішліст Epic Store через пошук. Це займе якийсь час — прогрес видно у сповіщенні та логах.',
  cancel: 'Скасувати',
  add: 'Додати',
  wishlistProgress: 'Вішліст: {done}/{total} — додано {added}, вже було {skipped}, помилок {failed}',
  wishlistDone: 'Вішліст готово: додано {added}, вже було {skipped}, помилок {failed}',
  wishlistPrefix: 'Вішліст: ',
  logsTitle: 'Логи',
  ariaShowLogs: 'Показати логи',
  ariaLogsEnabled: 'Логи увімкнені',
  copy: 'Copy',
  copied: 'Скопійовано',
  ariaClearLogs: 'Очистити логи',
  ariaCloseLogs: 'Закрити логи',
  logsEmpty: '(поки порожньо)',
  welcomeName: 'Epic Library Mobile',
  welcomeTagline: 'Ваша бібліотека ігор Epic — і платні, і всі нафармлені роздачі — прямо на сторінці магазину. Оптимізовано для телефона: великі картки, теги, прямі посилання. Без клавіатури.',
  howToUse: 'Як користуватись',
  step1Title: 'Відкрийте Epic Games Store',
  step1Text: 'Перейдіть на store.epicgames.com у браузері',
  step2Title: 'Увійдіть в акаунт Epic Games',
  step2Text: 'Список ігор береться з історії замовлень акаунта — і платні, і безкоштовні ігри',
  step3Title: 'Натисніть «Моя бібліотека»',
  step3Text: 'Плаваюча кнопка знизу праворуч відкриває бібліотеку на весь екран',
  step4Title: 'Тапніть по картці гри',
  step4Text: 'Відкриється сторінка гри в Epic Store з описом, медіа та цінами',
  featuresTitle: 'Можливості',
  featCardsTitle: 'Картки ігор',
  featCardsText: 'Сітка 2 колонки по 10 на сторінку: обкладинка 16:9, чиста назва і теги. Метадані підтягуються у фоні, поки видно плейсхолдери.',
  featCacheTitle: 'Розумний кеш',
  featCacheText: 'Список ігор кешується на 24 години, обкладинки/лінки/теги — на 7 днів. Оновити вручну можна кнопкою в шапці.',
  featFilterTitle: 'Пошук, фільтри, сортування',
  featFilterText: 'Пошук за назвою, фільтр по тегах (тап по тегу на картці теж фільтрує), сортування за назвою, ціною, датою покупки чи виходу.',
  featWishlistTitle: 'Все у вішліст',
  featWishlistText: 'Меню ⋮ → «Все у вішліст» додає всі ваші ігри у вішліст Epic з прогресом і можливістю зупинити.',
  featLogsTitle: 'Логи',
  featLogsText: 'Іконка термінала знизу ліворуч відкриває панель логів з кнопкою Copy. Вимикаються в меню ⋮ (типово увімкнені).',
  featDesktopTitle: 'На комп\'ютері',
  featDesktopText: 'Класичний шорткат Alt+G (Cmd+G на Mac) далі працює — розширення лишається кросплатформним.',
  disclaimer: 'Це неофіційне розширення: воно не пов\'язане з Epic Games, Inc. і не підтримується нею.',
  authorLabel: 'Автор:',
};

export type I18nKey = keyof typeof en;

function detectUk(): boolean {
  try {
    const lang = browser?.i18n?.getUILanguage?.() || navigator.language || '';
    return lang.toLowerCase().startsWith('uk');
  }
  catch {
    try {
      return (navigator.language || '').toLowerCase().startsWith('uk');
    }
    catch {
      return false;
    }
  }
}

const dict = detectUk() ? uk : en;

export function t(key: I18nKey): string {
  return dict[key] ?? en[key];
}

export function tf(key: I18nKey, vars: Record<string, string | number>): string {
  let s = t(key);
  for (const [name, value] of Object.entries(vars)) {
    s = s.replaceAll(`{${name}}`, String(value));
  }
  return s;
}
