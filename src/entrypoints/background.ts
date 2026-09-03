export default defineBackground(() => {
  const onInstalled = () => {
    browser.runtime.openOptionsPage()?.catch?.((e) => console.log('openOptionsPage failed:', e));
  };

  browser.runtime.onInstalled.addListener(onInstalled);

  // Keyboard commands are desktop-only; browser.commands does not exist on Firefox for Android.
  if (browser.commands?.onCommand) {
    browser.commands.onCommand.addListener((command) => {
      if (command === 'toggleDialog') {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          if (tabs[0]?.id) {
            browser.tabs.sendMessage(tabs[0].id, { type: 'toggleDialog' }, (response) => {
              if (browser.runtime.lastError) {
                console.log('Error sending message:', browser.runtime.lastError);
              }
            });
          }
        });
      }
    });
  }

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'openSettings') {
      browser.runtime.openOptionsPage();
    }

    if (message.type === 'needLogin') {
      fetch("https://www.epicgames.com/id/api/login?redirect_uri=https%3A%2F%2Fwww.epicgames.com%2Faccount%2Fpersonal%3Flang%3Den-US%26productName%3Degs", {
        credentials: "include",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.5",
          "x-requested-with": "XMLHttpRequest",
          "Content-Type": "application/json;charset=utf-8",
          "Sec-GPC": "1",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
        },
        referrer: "https://www.epicgames.com/",
        method: "GET",
        mode: "cors",
      })
        .then(res => {
          sendResponse(!!res.ok);
        });

      return true;
    }
  });
});
