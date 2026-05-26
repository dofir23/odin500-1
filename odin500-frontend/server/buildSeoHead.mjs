/**
 * Build SSR placeholder fragments for index.html (<!--SSR:TITLE-->, <!--SSR:META-->).
 */

export function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   canonical: string,
 *   noindex?: boolean,
 *   jsonLd?: object | null
 * }} meta
 */
export function buildSsrHead(meta) {
  const title = escapeHtmlAttr(meta.title);
  const description = escapeHtmlAttr(meta.description);
  const canonical = escapeHtmlAttr(meta.canonical);
  const robots = meta.noindex ? 'noindex,follow' : 'index,follow';

  const titleTag = `<title>${title}</title>`;

  const lines = [
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Odin500" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`
  ];

  if (meta.jsonLd) {
    lines.push(
      `<script type="application/ld+json">\n${JSON.stringify(meta.jsonLd, null, 2)}\n</script>`
    );
  }

  return {
    titleTag,
    metaBlock: lines.join('\n    ')
  };
}

/**
 * @param {string} html
 * @param {Parameters<typeof buildSsrHead>[0]} meta
 */
/**
 * @param {string} html
 * @param {string} appHtml
 */
export function injectAppIntoRoot(html, appHtml) {
  if (html.includes('<div id="root"></div>')) {
    return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  }
  return html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${appHtml}</div>`);
}

export function injectSeoIntoTemplate(html, meta) {
  const { titleTag, metaBlock } = buildSsrHead(meta);
  if (html.includes('<!--SSR:TITLE-->') && html.includes('<!--SSR:META-->')) {
    return html.replace('<!--SSR:TITLE-->', titleTag).replace('<!--SSR:META-->', metaBlock);
  }

  // Fallback when dist/index.html was baked by an older prerender (no placeholders).
  let out = html.replace(/<title>[^<]*<\/title>/i, titleTag);
  const bakedSeo =
    /<meta\s+name="description"[^>]*>[\s\S]*?<meta\s+name="twitter:description"[^>]*>/i;
  if (bakedSeo.test(out)) {
    out = out.replace(bakedSeo, metaBlock);
  } else {
    out = out.replace(/<meta\s+name="viewport"[^>]*>/i, `$&\n    ${metaBlock}`);
  }
  out = out.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '');
  if (meta.jsonLd) {
    const ld = `<script type="application/ld+json">\n${JSON.stringify(meta.jsonLd, null, 2)}\n</script>`;
    out = out.replace(/<\/head>/i, `    ${ld}\n  </head>`);
  }
  return out;
}
