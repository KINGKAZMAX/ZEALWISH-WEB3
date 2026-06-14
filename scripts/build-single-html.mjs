import fs from 'node:fs/promises';
import path from 'node:path';

const root = '/Users/mekzenx2/Documents/ZEALWISH/frontend-v4';
const outDir = '/Users/mekzenx2/Documents/ZEALWISH/outputs';
const out = path.join(outDir, 'zealwish-single.html');

function escapeScript(s) {
  return s.replace(/<\/script/gi, '<\\/script');
}
function bodyBetween(s, start, end) {
  const a = s.indexOf(start);
  const b = s.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`Cannot extract ${start}..${end}`);
  return s.slice(a + start.length, b);
}
function firstStyle(s) {
  return bodyBetween(s, '<style>', '</style>');
}
function dataUrl(file, mime) {
  return fs.readFile(file).then(buf => `data:${mime};base64,${buf.toString('base64')}`);
}

const indexHtml = await fs.readFile(path.join(root, 'index.html'), 'utf8');
const webHtml = await fs.readFile(path.join(root, 'web.html'), 'utf8');
const react = await fs.readFile(path.join(root, 'vendor/react.production.min.js'), 'utf8');
const reactDom = await fs.readFile(path.join(root, 'vendor/react-dom.production.min.js'), 'utf8');
const wallet = await fs.readFile(path.join(root, 'src/v4/wallet-service.js'), 'utf8');
let landing = await fs.readFile(path.join(root, 'src/v5/zealwish-landing.js'), 'utf8');
let webApp = await fs.readFile(path.join(root, 'src/v6/zealwish-web-app.js'), 'utf8');
const avatar = await dataUrl(path.join(root, 'assets/zealwish-main-character.png'), 'image/png');

// Inline local image assets used by both apps.
landing = landing.replaceAll('assets/zealwish-main-character.png', avatar);
webApp = webApp.replaceAll('assets/zealwish-main-character.png', avatar);

// Make in-app links point to the same single file hash routes.
for (const from of ['web.html#/home', 'web.html#/talk', 'web.html#/create', 'index.html#top', 'index.html']) {
  const to = from.startsWith('web.html#/') ? from.replace('web.html', '') : '#top';
  landing = landing.replaceAll(from, to);
  webApp = webApp.replaceAll(from, to);
}

// Prevent auto-mount in original bundles; expose mount functions instead.
landing = landing.replace(
  /ReactDOM\.createRoot\(document\.getElementById\("root"\)\)\.render\(React\.createElement\(I,null\)\);\}\)\(\);\s*$/,
  'window.__ZEALWISH_MOUNT_LANDING__ = function(){ ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(I,null)); };})();'
);
webApp = webApp.replace(
  'ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Ps,null));})();',
  'window.__ZEALWISH_MOUNT_WEB__ = function(){ ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Ps,null)); };})();'
);\}\)\(\);/,
  'window.__ZEALWISH_MOUNT_WEB__ = function(){ ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Cs,null)); };})();'
);

if (!landing.includes('__ZEALWISH_MOUNT_LANDING__')) throw new Error('landing mount patch failed');
if (!webApp.includes('__ZEALWISH_MOUNT_WEB__')) throw new Error('web mount patch failed');

const indexStyle = firstStyle(indexHtml);
const webStyle = firstStyle(webHtml);
const favicon = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Crect width=\'64\' height=\'64\' fill=\'%230A0A0B\'/%3E%3Cpath d=\'M10 12h12l5 23 8-23h10l8 23 5-23h6L52 52H40l-8-22-8 22H12z\' fill=\'%23FF2D2D\'/%3E%3C/svg%3E';

const router = `
(function(){
  function isWebRoute(){ return /^#\\/(home|create|talk|memory|world|rewind|settings)/.test(window.location.hash || ''); }
  function mount(){
    var root = document.getElementById('root');
    root.innerHTML = '';
    if (isWebRoute()) {
      document.body.className = 'single-web-mode';
      window.__ZEALWISH_MOUNT_WEB__();
    } else {
      document.body.className = 'single-landing-mode';
      window.__ZEALWISH_MOUNT_LANDING__();
    }
  }
  window.addEventListener('hashchange', function(){ location.reload(); });
  mount();
})();`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ZEALWISH — Single HTML Preview</title>
<meta name="description" content="ZEALWISH single-file offline preview containing the landing page and Web workspace." />
<link rel="icon" href="${favicon}" />
<style>
${indexStyle}

/* ---- ZEALWISH Web workspace styles, scoped by mode where necessary ---- */
${webStyle}
</style>
</head>
<body class="single-landing-mode">
<div id="root">
  <div class="boot-skeleton"><div><div class="boot-brand">ZEALWISH</div><p class="boot-tag">Loading single-file preview...</p></div></div>
</div>
<noscript><div class="noscript-note">JavaScript is required for this single-file ZEALWISH preview.</div></noscript>
<script>
${escapeScript(react)}
</script>
<script>
${escapeScript(reactDom)}
</script>
<script>
${escapeScript(wallet)}
</script>
<script>
${escapeScript(landing)}
</script>
<script>
${escapeScript(webApp)}
</script>
<script>
${escapeScript(router)}
</script>
</body>
</html>
`;

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(out, html);
console.log(out);
console.log(`${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
