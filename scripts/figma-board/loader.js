/*
 * Draws the board in a Figma file without any plugin. Figma exposes its plugin API as the global
 * `figma` to scripts run in the tab of an open design file, and renderer.js uses it.
 *
 * 1. `pnpm board:build` (writes scripts/figma-board/out/board.json and out/renderer.js).
 * 2. Open the Figma design file in a desktop browser, on the page the board should be drawn on.
 * 3. Open the browser's JavaScript console on that tab, paste this whole file and press Enter.
 * 4. Click the button that appears at the bottom left and choose both files from out/.
 *
 * The renderer removes every section named "<number> · <title>" on that page and draws the board
 * again, so anything edited by hand inside those sections is lost. It also updates the local
 * styles named "Color/…" and "Type/…".
 */
(() => {
  'use strict';

  if (typeof figma === 'undefined') {
    console.error(
      'Open a Figma design file in this tab first: the `figma` object is not available here.',
    );
    return;
  }

  const panel = document.createElement('label');
  panel.textContent = 'Choose board.json and renderer.js ';
  panel.style.cssText =
    'position:fixed;left:16px;bottom:16px;z-index:2147483647;padding:12px 16px;border-radius:8px;' +
    'background:#0A0A0F;color:#F4F4F8;font:14px/20px system-ui,sans-serif;box-shadow:0 4px 24px #0008;';
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = '.json,.js';
  panel.appendChild(input);
  document.body.appendChild(panel);

  input.addEventListener('change', async () => {
    const files = {};
    for (const file of input.files) {
      files[file.name] = await file.text();
    }
    if (files['board.json'] === undefined || files['renderer.js'] === undefined) {
      panel.firstChild.textContent = 'Both files are needed: board.json and renderer.js ';
      return;
    }
    panel.textContent = 'Drawing the board…';
    try {
      // renderer.js defines window.__gog.render; an indirect eval runs it in the page's global scope.
      (0, eval)(files['renderer.js']);
      const status = await window.__gog.render(JSON.parse(files['board.json']));
      const failed = status.phase !== 'done' || status.errors.length > 0;
      console[failed ? 'error' : 'log']('Figma board:', status);
      panel.textContent = failed
        ? 'The board did not draw cleanly: see the console.'
        : `Done: ${status.done} frames, ${status.layers} layers.`;
    } catch (error) {
      console.error('Figma board:', error);
      panel.textContent = 'The board could not be drawn: see the console.';
    }
    setTimeout(() => {
      panel.remove();
    }, 8000);
  });
})();
