import ReactDOM from "react-dom/client";
import GamesDialog from '@/components/GamesDialog';

export default defineContentScript({
  matches: ['https://*.epicgames.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'epic-games-library-ui',
      position: 'inline',
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<GamesDialog />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
