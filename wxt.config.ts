import { defineConfig, UserManifest } from 'wxt';

const perBrowserManifest: Record<string, Record<number, UserManifest>> = ({
  chrome: {
    3: {
      permissions: [
        'storage',
      ],
      host_permissions: [
        'https://*.epicgames.com/*',
      ],
      commands: {
        toggleDialog: {
          description: 'Toggle the dialog',
          suggested_key: {
            default: 'Alt+G',
            mac: 'Command+G',
          },
        },
      },
    },
  },
  firefox: {
    2: {
      permissions: [
        'storage',
        'https://*.epicgames.com/*',
      ],
      commands: {
        toggleDialog: {
          description: 'Toggle the dialog',
          suggested_key: {
            default: 'Alt+G',
            mac: 'Command+G',
          },
        },
      },
      browser_specific_settings: {
        gecko: {
          id: 'epic-games-library-android@nikman17',
          // data_collection_permissions is supported since Firefox 140 (desktop)
          strict_min_version: '140.0',
          data_collection_permissions: {
            required: ['none'],
          },
        },
        gecko_android: {
          // ...and since Firefox for Android 142
          strict_min_version: '142.0',
        },
      },
    },
  },
});

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser, manifestVersion }) => ({
    name: 'Epic Library Mobile',
    description: 'Your Epic Games library on any screen: floating button, game cards with covers and tags, direct store links.',
    version: '0.4.3',
    author: 'Nikman17',
    homepage_url: 'https://github.com/Nikman17/epic-library-mobile',
    ...perBrowserManifest[browser][manifestVersion],
  }),
});







