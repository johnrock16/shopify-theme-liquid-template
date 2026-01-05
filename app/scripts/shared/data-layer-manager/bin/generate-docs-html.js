#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';

/**
 * Utility: slugify a string for anchors/ids
 */
function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Fill empty string fields in template with example values if available
 */
function fillEmptyFields(template, example = {}, simplifiedReturn = false) {
  if (Array.isArray(template)) {
    return template.map((t, i) => fillEmptyFields(t, (Array.isArray(example) ? example[i] : example[0]) || {}, simplifiedReturn));
  } else if (template && typeof template === 'object') {
    const res = {};
    for (const key of Object.keys(template)) {
      if (key === 'docs') continue;
      const tVal = template[key];
      const eVal = example ? example[key] : undefined;

      if (Array.isArray(tVal)) {
        res[key] = fillEmptyFields(tVal, Array.isArray(eVal) ? eVal : [], simplifiedReturn);
      } else if (tVal && typeof tVal === 'object' && !('type' in tVal || 'required' in tVal || 'default' in tVal)) {
        // nested structure (not schema leaf)
        res[key] = fillEmptyFields(tVal, eVal || {}, simplifiedReturn);
      } else if (typeof tVal === 'string' && tVal === '' && eVal !== undefined) {
        res[key] = simplifiedReturn ? eVal : `(${tVal?.type || typeof eVal}) ${tVal?.required ? '✅ required' : ''}`;
      } else if (tVal && typeof tVal === 'object' && ('type' in tVal || 'required' in tVal || 'default' in tVal)) {
        // schema leaf: include default if exists, otherwise use example value if provided
        if (eVal !== undefined) {
          res[key] = simplifiedReturn ? eVal : `(${tVal?.type || typeof eVal}) ${tVal?.required ? '✅ required' : ''}`;
        } else if (tVal.default !== undefined) {
          res[key] = simplifiedReturn ? tVal.default : `${tVal.default} (${tVal?.type || typeof eVal}) ${tVal?.required ? '✅ required' : ''}`;
        } else {
          res[key] = simplifiedReturn ? '' : `(${tVal?.type || typeof eVal}) ${tVal?.required ? '✅ required' : ''}`
        }
      } else {
        res[key] = simplifiedReturn ? tVal : `${tVal} (${tVal?.type || typeof tVal}) ${tVal?.required ? '✅ required' : ''}`;
      }
    }
    return res;
  }
  return template;
}

/**
 * Pretty render of a JSON structure as HTML list (recursive)
 */
function renderStructureHtml(obj, level = 0) {
  const indent = '  '.repeat(level);
  let html = '<ul class="struct-list">';
  if (Array.isArray(obj)) {
    // html += `<li><strong>Array</strong>`;
    if (obj.length > 0) {
      html += renderStructureHtml(obj[0], level + 1);
    }
    // html += `</li>`;
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && ('type' in v || 'required' in v || 'default' in v)) {
        const type = v.type || 'any';
        const req = v.required ? 'required' : 'optional';
        html += `<li><code>${k}</code> <span class="meta">(${type}, ${req})</span>`;
        // render nested non-schema props if exist
        const nestedKeys = Object.keys(v).filter(x => !['type','required','default'].includes(x));
        if (nestedKeys.length) {
          const nested = {};
          nestedKeys.forEach(nk => nested[nk] = v[nk]);
          html += renderStructureHtml(nested, level + 1);
        }
        html += `</li>`;
      } else if (Array.isArray(v)) {
        html += `<li><code>${k} (Array)</code>`;
        html += renderStructureHtml(v, level + 1);
        html += `</li>`;
      } else if (v && typeof v === 'object') {
        html += `<li><code>${k} (Object)</code>`;
        html += renderStructureHtml(v, level + 1);
        html += `</li>`;
      } else {
        html += `<li><code>${k}</code>: <span class="val">${String(v)}</span></li>`;
      }
    }
  } else {
    html += `<li>${String(obj)}</li>`;
  }
  html += '</ul>';
  return html;
}

/**
 * Escape HTML for safe insertion
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Build the full HTML page
 */
function buildHtmlPage(allTemplates, configPathString = '') {
  // allTemplates => array of { fileName, events: { eventName: eventObj } }
  let tocHtml = '';
  let bodyHtml = '';

  for (const tpl of allTemplates) {
    const fileLabel = tpl.fileName;
    for (const [eventName, eventObj] of Object.entries(tpl.events)) {
      const id = slugify(`${tpl.fileName}-${eventName}`);
      const docs = eventObj.docs || {};
      const description = docs.description || '';
      const structureExample = docs.structureExpected || fillEmptyFields(eventObj, docs.structureExpected || {}, true);
      const structureForRender = fillEmptyFields(eventObj, docs.structureExpected || {}, false);

      tocHtml += `<li><a href="#${id}">${escapeHtml(eventName)}</a> <small class="source">(${escapeHtml(tpl.fileName)})</small></li>\n`;

      bodyHtml += `<article id="${id}" class="event-card">
  <header class="event-header">
    <h2>${escapeHtml(eventName)}</h2>
    <div class="meta">
      <span class="badge">${escapeHtml(eventObj.event_type || '')}</span>
      <span class="source">Source: <code>${escapeHtml(tpl.fileName)}</code></span>
    </div>
  </header>
  ${description ? `<p class="desc">${escapeHtml(description)}</p>` : ''}
  <section class="section">
    <h3>Structure</h3>
    ${renderStructureHtml(structureForRender)}
  </section>
  <section class="section">
    <h3>Example Payload</h3>
    <pre class="json-block" id="json-${id}">${escapeHtml(JSON.stringify(structureExample, null, 2))}</pre>
    <div class="actions">
      <button data-copy-target="json-${id}" class="btn copy-btn">Copy JSON</button>
      <a class="btn link-btn" href="#" data-open-console='${escapeHtml(JSON.stringify(structureExample))}'>Log to Console</a>
      <button data-payload='${escapeHtml(JSON.stringify(structureExample))}' class="btn push-btn">Push Event</button>
    </div>
  </section>
</article>\n`;
    }
  }

  let scriptContent = '';
  let scriptConfig = '';
  let templateEvents = [];
  let templateEventsObject = null;

  if (configPathString) {
    scriptContent = fs.readFileSync('./src/dataLayerManager.js', 'utf8');
    scriptConfig = fs.readFileSync(configPathString, 'utf8');
    templateEvents = allTemplates.map((template) => template.events);
    templateEventsObject = Object.assign({}, ...templateEvents);
  }

  let scriptConfigModule = scriptConfig ? `
    <script type="module" defer>
      ${scriptConfig}
      window.DATA_LAYER_MANAGER_CONFIG = DATA_LAYER_MANAGER_CONFIG;
    </script>
  ` : '';

  let scriptDataLayerModule = scriptContent ? `
    <script type="module" defer>
      ${scriptContent}
      window.DataLayerManager = DataLayerManager;
    </script>
  ` : '';

  let scriptPushModule = templateEventsObject && scriptConfig && scriptContent ? `
    <script type="module" defer>
      document.addEventListener('DOMContentLoaded', () => {
        const templates = ${JSON.stringify(templateEventsObject)};
        window.dataLayer = [];
        window.dataLayerManager = new window.DataLayerManager(templates, window.DATA_LAYER_MANAGER_CONFIG);

        const pushButtonElements = document.querySelectorAll('.push-btn');

        pushButtonElements.forEach((pushButtonElement) => {
          pushButtonElement.addEventListener('click', (event) => {
            const payload = JSON.parse(event.target.getAttribute('data-payload'));
            window.dataLayerManager.pushToDataLayer(payload.event, payload);
            console.log(window.dataLayer)
          });
        });
      });
    </script>
  ` : '';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Events Documentation</title>
<style>
  :root{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial; color:#222}
  body{margin:0;padding:24px;background:#f7fafc}
  .container{max-width:1100px;margin:0 auto}
  header.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
  h1{margin:0;font-size:20px}
  .search{margin-left:12px}
  .layout{display:grid;grid-template-columns:320px 1fr;gap:20px}
  nav.toc{background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 4px rgba(16,24,40,0.04)}
  nav.toc h3{margin-top:0}
  nav.toc ul{list-style:none;padding-left:0;margin:0;max-height:72vh;overflow:auto}
  nav.toc li{margin:8px 0}
  nav.toc a{color:#0b5fff;text-decoration:none}
  main.content{min-height:60vh}
  .event-card{background:#fff;padding:18px;border-radius:8px;margin-bottom:16px;box-shadow:0 1px 6px rgba(16,24,40,0.04)}
  .event-header{display:flex;justify-content:space-between;align-items:flex-start}
  .event-header h2{margin:0;font-size:16px}
  .meta{display:flex;gap:8px;align-items:center}
  .badge{background:#eef2ff;color:#1e3a8a;padding:4px 8px;border-radius:6px;font-size:12px}
  .source code{background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px}
  .desc{margin:12px 0 8px;color:#374151}
  .section h3{margin:0 0 8px 0;font-size:14px}
  .struct-list{margin:0 0 8px 0;padding-left:18px}
  .struct-list li{margin:6px 0}
  .struct-list .meta{color:#6b7280;font-size:12px;margin-left:6px}
  .json-block{background:#0f172a;color:#e6eef8;padding:12px;border-radius:6px;overflow:auto}
  .actions{margin-top:8px;display:flex;gap:8px}
  .btn{border:0;padding:8px 12px;border-radius:6px;cursor:pointer;background:#0b5fff;color:#fff;font-size:13px;text-decoration:none;}
  .link-btn{background:#10b981}
  .copy-btn{background:#0b5fff}
  .push-btn{background:#dc7c03}
  .source.small{font-size:12px;color:#6b7280}
  footer{margin-top:24px;color:#6b7280;font-size:13px}
  @media(max-width:900px){.layout{grid-template-columns:1fr}}
  .search-input{width:100%;padding:8px;border-radius:6px;border:1px solid #e5e7eb}
</style>
</head>
<body>
  ${scriptConfigModule}
  ${scriptDataLayerModule}
  ${scriptPushModule}
  <div class="container">
    <header class="page-header">
      <h1>Data Layer Manager - Events Documentation</h1>
      <div>
        <input id="search" class="search-input" placeholder="Search events or fields..." />
      </div>
    </header>

    <div class="layout">
      <nav class="toc" aria-label="table of contents">
        <h3>Index</h3>
        <ul id="toc-list">
          ${tocHtml}
        </ul>
      </nav>

      <main class="content" id="content">
        ${bodyHtml}
      </main>
    </div>

    <footer>
      Generated by Data Layer Manager — ${new Date().toLocaleString()}
    </footer>
  </div>

<script>
  // Search/filter
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.event-card');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      if (!q || text.includes(q)) card.style.display = '';
      else card.style.display = 'none';
    });
    // also hide toc entries not matching
    const tocItems = document.querySelectorAll('#toc-list li');
    tocItems.forEach(li => {
      const t = li.innerText.toLowerCase();
      li.style.display = (!q || t.includes(q)) ? '' : 'none';
    });
  });

  // Copy JSON button
  document.body.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button.copy-btn');
    if (!btn) return;
    const targetId = btn.getAttribute('data-copy-target');
    const el = document.getElementById(targetId);
    if (!el) return;
    const text = el.innerText;
    navigator.clipboard?.writeText(text).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(()=> btn.textContent = 'Copy JSON', 1200);
    }).catch(()=> {
      btn.textContent = 'Copy failed';
      setTimeout(()=> btn.textContent = 'Copy JSON', 1200);
    });
  });

  // Open to console (logs example)
  document.body.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[data-open-console]');
    if (!a) return ev.preventDefault();
    const json = JSON.parse(a.getAttribute('data-open-console'));
    console.log('Example payload:', json);
    // alert('Payload logged to console');
  });

  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length > 1) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });
</script>
</body>
</html>`;

  return html;
}

/**
 * Main CLI logic
 */
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node scripts/generate-html-docs.js <templates-folder> [--out ./docs/events.html] [--config ./config.js]');
    process.exit(1);
  }

  const templatesDir = path.resolve(args[0]);
  if (!fs.existsSync(templatesDir) || !fs.statSync(templatesDir).isDirectory()) {
    console.error('Templates folder not found:', templatesDir);
    process.exit(1);
  }

  // find optional --out flag
  const outIndex = args.indexOf('--out');
  let outPath = path.resolve('./docs/events.html');
  if (outIndex !== -1 && args[outIndex + 1]) {
    outPath = path.resolve(args[outIndex + 1]);
  } else {
    const docDir = path.dirname(outPath);
    if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
  }

  // find optional --config flag
  const configIndex = args.indexOf('--config');
  let configPathString = '';
  if (configIndex !== -1 && args[configIndex + 1]) {
    const configPath = path.resolve(args[configIndex + 1]);
    if (fs.existsSync(configPath)) {
      configPathString = configPath;
      console.log('✅ Loaded config from', configPath);
    } else {
      console.warn('⚠️  Config file not found:', configPath);
    }
  }

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.warn('No JSON template files found in', templatesDir);
    process.exit(0);
  }

  const allTemplates = [];
  for (const file of files) {
    try {
      const filePath = path.join(templatesDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(raw);
      allTemplates.push({ fileName: file, events: json });
    } catch (err) {
      console.warn('Skipping file (parse error):', file, err.message);
    }
  }

  const html = buildHtmlPage(allTemplates, configPathString); // pass config if needed later
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log('✅ HTML documentation generated at', outPath);
}

main();
