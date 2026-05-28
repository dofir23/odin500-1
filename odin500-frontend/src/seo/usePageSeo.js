import { useEffect } from 'react';
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  SEO_BRAND_NAME,
  SITE_ORIGIN
} from './siteConfig.js';

function ensureMeta(attr, key, content) {
  if (typeof document === 'undefined') return;
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function ensureCanonical(url) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function ensureJsonLd(id, data) {
  if (typeof document === 'undefined' || !id || !data) return;
  let el = document.head.querySelector(`script[data-seo-jsonld="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo-jsonld', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Always https://www.odin500.com — not window.location (avoids apex/non-www drift). */
export function absoluteSiteUrl(path) {
  const p = path && path.startsWith('/') ? path : `/${String(path || '')}`;
  if (p === '/') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${p}`;
}

/** Strip query/hash so filter URLs canonicalize to the clean path. */
export function canonicalPathFromLocation(pathname, search = '') {
  const path = String(pathname || '/').split('?')[0].split('#')[0] || '/';
  return path.endsWith('/') && path.length > 1 ? path.replace(/\/+$/, '') || '/' : path;
}

export function useSitewideSeo() {
  useEffect(() => {
    ensureMeta('name', 'description', DEFAULT_SITE_DESCRIPTION);
    ensureMeta('name', 'robots', 'index,follow');
    ensureCanonical(absoluteSiteUrl('/'));
    ensureJsonLd('organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SEO_BRAND_NAME,
      url: SITE_ORIGIN
    });
    ensureJsonLd('website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SEO_BRAND_NAME,
      url: SITE_ORIGIN
    });
  }, []);
}

/**
 * @param {{
 *  title: string,
 *  description: string,
 *  canonicalPath?: string,
 *  noindex?: boolean,
 *  ogType?: string,
 *  breadcrumbItems?: Array<{ name: string, path: string }>
 * }} options
 */
export function usePageSeo({
  title,
  description,
  canonicalPath = '/',
  noindex = false,
  ogType = 'website',
  breadcrumbItems = []
}) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const canonicalUrl = absoluteSiteUrl(canonicalPath);
    document.title = title;
    ensureMeta('name', 'description', description);
    ensureMeta('name', 'robots', noindex ? 'noindex,follow' : 'index,follow');
    ensureCanonical(canonicalUrl);

    ensureMeta('property', 'og:title', title);
    ensureMeta('property', 'og:description', description);
    ensureMeta('property', 'og:type', ogType);
    ensureMeta('property', 'og:url', canonicalUrl);
    ensureMeta('property', 'og:site_name', SEO_BRAND_NAME);

    ensureMeta('name', 'twitter:card', 'summary_large_image');
    ensureMeta('name', 'twitter:title', title);
    ensureMeta('name', 'twitter:description', description);

    if (Array.isArray(breadcrumbItems) && breadcrumbItems.length) {
      ensureJsonLd('breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: absoluteSiteUrl(b.path)
        }))
      });
    }
  }, [title, description, canonicalPath, noindex, ogType, breadcrumbItems]);
}
