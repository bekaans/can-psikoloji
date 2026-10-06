import type { Express, Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { whatsappLink, type SiteContent } from '../shared/content';
import legacy from './legacy/pages.json';

type Kind = 'about' | 'services' | 'service' | 'team' | 'expert' | 'gallery' | 'contact';
type PageDef = {
  slug: string;
  kind: Kind;
  ref?: string;
  h1: string;
  crumb: string;
  title: string;
  description: string;
};

const BRAND = 'Özel Sağlık Meslek Hizmet Birimi Klinik Psikolog Nurcan Ayday';
const SHORT = 'Klinik Psikolog Nurcan Ayday';
const legacyBodies = legacy as Record<string, string>;

export const PAGES: PageDef[] = [
  {
    slug: 'hakkimizda',
    kind: 'about',
    h1: 'Hakkımızda',
    crumb: 'Hakkımızda',
    title: `Hakkımızda | Gebze Psikoterapi - ${SHORT}`,
    description:
      'Özel Sağlık Meslek Hizmet Birimi Klinik Psikolog Nurcan Ayday’ın misyonu, değerleri ve çalışma biçimi. 2018’den beri Gebze’de bireylere, çocuklara, ergenlere, çiftlere ve ailelere hizmet veriyoruz.',
  },
  {
    slug: 'hizmetlerimiz',
    kind: 'services',
    h1: 'Hizmetlerimiz',
    crumb: 'Hizmetlerimiz',
    title: `Hizmetlerimiz | Gebze Terapi ve Psikolojik Test - ${SHORT}`,
    description:
      'Gebze’de bireysel terapi, çocuk ve ergen terapisi, çift ve aile terapisi ile psikolojik test ve değerlendirme hizmetleri. Randevu için WhatsApp’tan yazabilirsiniz.',
  },
  {
    slug: 'bireysel-terapiler',
    kind: 'service',
    ref: 'bireysel-terapi',
    h1: 'Bireysel Terapiler',
    crumb: 'Bireysel Terapiler',
    title: `Bireysel Terapiler | Gebze Psikolog - ${SHORT}`,
    description:
      'Gebze’de bireysel psikoterapi: amaçları, faydaları ve kimlere yardımcı olabileceği. Yetişkinler için terapi sürecini Klinik Psikolog Nurcan Ayday’dan öğrenin, arayın veya WhatsApp’tan randevu alın.',
  },
  {
    slug: 'cocuk-ve-ergen-terapileri',
    kind: 'service',
    ref: 'cocuk-ergen',
    h1: 'Çocuk ve Ergen Terapileri',
    crumb: 'Çocuk ve Ergen Terapileri',
    title: `Çocuk ve Ergen Terapileri | Gebze Oyun Terapisi - ${SHORT}`,
    description:
      'Gebze’de çocuk oyun terapisi, ergen psikoterapisi ve EMDR uygulamaları. Çocuğunuzun gelişim dönemine uygun destek için arayın veya WhatsApp’tan yazın.',
  },
  {
    slug: 'cift-ve-aile-terapileri',
    kind: 'service',
    ref: 'cift-aile',
    h1: 'Çift ve Aile Terapileri',
    crumb: 'Çift ve Aile Terapileri',
    title: `Çift ve Aile Terapileri | Gebze - ${SHORT}`,
    description:
      'Gebze’de çift ve aile terapisi: evlilik problemleri, iletişim güçlükleri, boşanma süreci ve ebeveynlik becerileri için uzman desteği. Randevu için hemen yazın.',
  },
  {
    slug: 'psikolojik-test-ve-degerlendirme',
    kind: 'service',
    ref: 'test-degerlendirme',
    h1: 'Psikolojik Test ve Değerlendirme',
    crumb: 'Psikolojik Test ve Değerlendirme',
    title: `Psikolojik Test ve Değerlendirme | WISC-IV, CAS, Moxo - Gebze`,
    description:
      'Gebze’de psikolojik test ve değerlendirme: WISC-IV zeka testi, CAS testi ve Moxo Dikkat Testi. Randevu için arayın veya WhatsApp’tan yazın.',
  },
  {
    slug: 'uzmanlarimiz-2',
    kind: 'team',
    h1: 'Uzmanlarımız',
    crumb: 'Uzmanlarımız',
    title: `Uzmanlarımız | Gebze Psikologlar - ${SHORT}`,
    description:
      'Klinik Psikolog Nurcan Ayday ve Psikolog Başak Cantürk: eğitimleri, deneyimleri ve çalışma alanları.',
  },
  {
    slug: 'psikolojik-danisman-psikoterapist-nurcan-ilkan',
    kind: 'expert',
    ref: 'nurcan-ayday',
    h1: 'Klinik Psikolog Nurcan İlkan Ayday',
    crumb: 'Nurcan İlkan Ayday',
    title: `Klinik Psikolog Nurcan İlkan Ayday | Gebze Psikoterapi`,
    description:
      'Klinik Psikolog Nurcan İlkan Ayday: eğitimleri, deneyimi ve çalışma alanları. Gebze’de bireysel psikoterapi, çocuk ve ergen terapisi için randevu alın.',
  },
  {
    slug: 'psikolog-basak-canturk',
    kind: 'expert',
    ref: 'basak-canturk',
    h1: 'Psikolog Başak Cantürk',
    crumb: 'Başak Cantürk',
    title: `Psikolog Başak Cantürk | Gebze Çocuk ve Ergen Psikoloğu`,
    description:
      'Psikolog Başak Cantürk: çocuk merkezli oyun terapisi, EMDR ve psikolojik değerlendirme eğitimleri. Gebze’de çocuk ve ergen görüşmeleri için randevu alın.',
  },
  {
    slug: 'galeri',
    kind: 'gallery',
    h1: 'Galeri',
    crumb: 'Galeri',
    title: `Galeri | Gebze - ${SHORT}`,
    description:
      'Özel Sağlık Meslek Hizmet Birimi Klinik Psikolog Nurcan Ayday’ın Gebze’deki görüşme alanlarından ve ortamından fotoğraflar.',
  },
  {
    slug: 'bize-ulasin',
    kind: 'contact',
    h1: 'İletişim',
    crumb: 'İletişim',
    title: `İletişim | Gebze Psikolog Randevu - ${SHORT}`,
    description:
      'Özel Sağlık Meslek Hizmet Birimi Klinik Psikolog Nurcan Ayday adres, telefon ve randevu bilgileri. Gebze / Kocaeli. Arayabilir veya WhatsApp’tan yazarak randevu planlayabilirsiniz.',
  },
];


type PageOverride = NonNullable<SiteContent['pages']>[string];
const withOverride = (def: PageDef, content: SiteContent): PageDef => {
  const o = content.pages?.[def.slug];
  return o ? { ...def, h1: o.h1, title: o.title, description: o.description } : def;
};
const pagesOf = (content: SiteContent) => PAGES.map((p) => withOverride(p, content));
export function defaultPages(): Record<string, PageOverride> {
  return Object.fromEntries(
    PAGES.filter((p) => p.kind !== 'contact').map((p) => [
      p.slug,
      { h1: p.h1, title: p.title, description: p.description, body: legacyBodies[p.slug] ?? '' },
    ]),
  );
}
const renderText = (text: string): string => {
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(esc).join('<br>')}</p>`);
    if (list.length) out.push(`<ul>${list.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
    para = [];
    list = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith('## ')) {
      flush();
      out.push(`<h2>${esc(line.slice(3))}</h2>`);
    } else if (line.startsWith('- ')) {
      if (para.length) flush();
      list.push(line.slice(2));
    } else {
      if (list.length) flush();
      para.push(line);
    }
  }
  flush();
  return out.join('\n');
};

export const pagePath = (slug: string) => `/index.php/${slug}/`;
const bySlug = new Map(PAGES.map((p) => [p.slug, p]));

const esc = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const jsonLd = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function nav(current?: string) {
  const items: [string, string][] = [
    ['/', 'Ana sayfa'],
    [pagePath('hakkimizda'), 'Hakkımızda'],
    [pagePath('hizmetlerimiz'), 'Hizmetlerimiz'],
    [pagePath('uzmanlarimiz-2'), 'Uzmanlarımız'],
    [pagePath('galeri'), 'Galeri'],
    [pagePath('bize-ulasin'), 'İletişim'],
  ];
  return `<nav class="seo-nav" aria-label="Ana gezinme">${items
    .map(
      ([href, label]) =>
        `<a href="${href}"${href === current ? ' aria-current="page"' : ''}>${esc(label)}</a>`,
    )
    .join('')}</nav>`;
}

function servicePage(content: SiteContent, id: string) {
  const svc = content.services.find((s) => s.id === id);
  const def = pagesOf(content).find((p) => p.kind === 'service' && p.ref === id);
  return svc && def ? { svc, def } : null;
}

function businessSchema(content: SiteContent, origin: string) {
  const c = content.contact;
  return {
    '@type': ['LocalBusiness', 'MedicalBusiness'],
    '@id': `${origin}/#business`,
    name: BRAND,
    url: `${origin}/`,
    telephone: `+${c.phone}`,
    image: `${origin}${content.hero.image}`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.address,
      addressLocality: 'Gebze',
      addressRegion: 'Kocaeli',
      postalCode: '41400',
      addressCountry: 'TR',
    },
    hasMap: c.mapUrl,
    sameAs: [c.mapUrl],
    areaServed: [
      { '@type': 'City', name: 'Gebze' },
      { '@type': 'AdministrativeArea', name: 'Kocaeli' },
    ],
    employee: content.team.map((t) => ({
      '@type': 'Person',
      name: t.name,
      jobTitle: t.role,
      image: `${origin}${t.image}`,
    })),
    makesOffer: content.services.map((s) => {
      const page = pagesOf(content).find((p) => p.kind === 'service' && p.ref === s.id);
      return {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.title,
          description: s.description,
          ...(page ? { url: `${origin}${pagePath(page.slug)}` } : {}),
        },
      };
    }),
  };
}

function breadcrumb(origin: string, def: PageDef) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: `${origin}/` },
      ...(def.kind === 'service' || def.kind === 'expert'
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: def.kind === 'service' ? 'Hizmetlerimiz' : 'Uzmanlarımız',
              item: `${origin}${pagePath(def.kind === 'service' ? 'hizmetlerimiz' : 'uzmanlarimiz-2')}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: def.kind === 'service' || def.kind === 'expert' ? 3 : 2,
        name: def.crumb,
        item: `${origin}${pagePath(def.slug)}`,
      },
    ],
  };
}

function articleBody(def: PageDef, content: SiteContent, origin: string): string {
  const wa = whatsappLink(content, def.kind === 'service' ? def.h1.toLowerCase() : undefined);
  const cta = `<a class="button" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp ile randevu planlayın</a>`;
  const cleanBody = renderText(content.pages?.[def.slug]?.body ?? legacyBodies[def.slug] ?? '');
  switch (def.kind) {
    case 'about':
      return `<p class="seo-lead">${esc(content.about.description)}</p>
<h2>${esc(content.about.title)}</h2>
<div class="seo-prose">${cleanBody}</div>
<p>${esc(content.about.note)}</p>${cta}`;
    case 'services':
      return `<p class="seo-lead">${esc(content.hero.description)}</p>
<ul class="seo-cards">${content.services
        .map((s) => {
          const page = pagesOf(content).find((p) => p.kind === 'service' && p.ref === s.id);
          const heading = page
            ? `<a href="${pagePath(page.slug)}">${esc(page.h1)}</a>`
            : esc(s.title);
          return `<li><h2>${heading}</h2><p class="seo-sub">${esc(s.subtitle)}</p><p>${esc(s.description)}</p></li>`;
        })
        .join('')}</ul>${cta}`;
    case 'service': {
      const sp = servicePage(content, def.ref!);
      const lead = sp?.svc.description ?? def.description;
      const tags = sp
        ? `<ul class="seo-tags">${sp.svc.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
        : '';
      const others = pagesOf(content).filter((p) => p.kind === 'service' && p.slug !== def.slug)
        .map((p) => `<li><a href="${pagePath(p.slug)}">${esc(p.h1)}</a></li>`)
        .join('');
      const experts = content.team
        .map((t) => {
          const page = pagesOf(content).find((p) => p.kind === 'expert' && p.ref === t.id);
          return `<li>${page ? `<a href="${pagePath(page.slug)}">${esc(t.name)}</a>` : esc(t.name)} · ${esc(t.role)}</li>`;
        })
        .join('');
      return `<p class="seo-lead">${esc(lead)}</p>${tags}
<div class="seo-prose">${cleanBody}</div>${cta}
<aside class="seo-related"><h2>Diğer hizmetlerimiz</h2><ul>${others}</ul><h2>Uzmanlarımız</h2><ul>${experts}</ul></aside>`;
    }
    case 'team':
      return `<p class="seo-lead">Görüşmeleri alanında eğitimli psikologlar yürütür.</p>
<ul class="seo-cards">${content.team
        .map((t) => {
          const page = pagesOf(content).find((p) => p.kind === 'expert' && p.ref === t.id);
          return `<li><img src="${esc(t.image)}" alt="${esc(`${t.role} ${t.name}`)}" width="160" height="160" loading="lazy" decoding="async"><div><h2>${page ? `<a href="${pagePath(page.slug)}">${esc(`${t.role} ${t.name}`)}</a>` : esc(`${t.role} ${t.name}`)}</h2><p class="seo-sub">${esc(t.focus)}</p><p>${esc(t.bio)}</p></div></li>`;
        })
        .join('')}</ul>${cta}`;
    case 'expert': {
      const t = content.team.find((m) => m.id === def.ref);
      const head = t
        ? `<figure class="seo-portrait"><img src="${esc(t.image)}" alt="${esc(`${t.role} ${t.name}`)}" width="320" height="320" decoding="async"></figure><p class="seo-lead">${esc(t.bio)}</p>`
        : '';
      return `${head}<div class="seo-prose">${cleanBody}</div>${cta}
<aside class="seo-related"><h2>Hizmetlerimiz</h2><ul>${pagesOf(content).filter((p) => p.kind === 'service')
        .map((p) => `<li><a href="${pagePath(p.slug)}">${esc(p.h1)}</a></li>`)
        .join('')}</ul></aside>`;
    }
    case 'gallery':
      return `<p class="seo-lead">Görüşme alanlarımızdan ve merkezimizden kareler.</p>
<ul class="seo-gallery">${content.gallery
        .map(
          (g) =>
            `<li><figure><img src="${esc(g.image)}" alt="${esc(g.title)}" loading="lazy" decoding="async" width="640" height="440"><figcaption>${esc(g.caption)}</figcaption></figure></li>`,
        )
        .join('')}</ul>${cta}`;
    case 'contact': {
      const c = content.contact;
      return `<p class="seo-lead">Randevu için WhatsApp’tan yazabilir veya bizi arayabilirsiniz.</p>
<dl class="seo-contact">
<dt>Adres</dt><dd><address>${esc(BRAND)}<br>${esc(c.address)}</address><a href="${esc(c.mapUrl)}" target="_blank" rel="noopener noreferrer">Google Haritalar’da aç</a></dd>
<dt>Telefon</dt><dd><a href="tel:+${c.phone}">${esc(c.phoneDisplay)}</a></dd>
<dt>Görüşme saatleri</dt><dd>${esc(c.hours)}</dd>
</dl>${cta}`;
    }
  }
}

function pageSchema(def: PageDef, content: SiteContent, origin: string) {
  const url = `${origin}${pagePath(def.slug)}`;
  const graph: unknown[] = [breadcrumb(origin, def)];
  if (def.kind === 'service') {
    const sp = servicePage(content, def.ref!);
    graph.push({
      '@type': 'Service',
      name: def.h1,
      description: def.description,
      url,
      areaServed: { '@type': 'City', name: 'Gebze' },
      provider: { '@id': `${origin}/#business` },
      ...(sp ? { serviceType: sp.svc.subtitle } : {}),
    });
  } else if (def.kind === 'expert') {
    const t = content.team.find((m) => m.id === def.ref);
    if (t)
      graph.push({
        '@type': 'Person',
        '@id': `${url}#person`,
        name: t.name,
        jobTitle: t.role,
        description: t.bio,
        image: `${origin}${t.image}`,
        url,
        worksFor: { '@id': `${origin}/#business` },
      });
  } else if (def.kind === 'contact') {
    graph.push({ '@type': 'ContactPage', url, name: def.h1, about: { '@id': `${origin}/#business` } });
  } else if (def.kind === 'about') {
    graph.push({ '@type': 'AboutPage', url, name: def.h1, about: { '@id': `${origin}/#business` } });
  } else if (def.kind === 'gallery') {
    graph.push({
      '@type': 'ImageGallery',
      url,
      name: def.h1,
      image: content.gallery.map((g) => `${origin}${g.image}`),
    });
  }
  graph.push(businessSchema(content, origin));
  return { '@context': 'https://schema.org', '@graph': graph };
}

function head(template: string) {
  const css = [...template.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map(
    (m) => m[1],
  );
  const icon = /<link rel="icon"[^>]*>/.exec(template)?.[0] ?? '';
  return { css, icon };
}

export function renderPage(
  def: PageDef,
  content: SiteContent,
  origin: string,
  template: string,
): string {
  def = withOverride(def, content);
  const url = `${origin}${pagePath(def.slug)}`;
  const { css, icon } = head(template);
  const image = `${origin}${content.hero.image}`;
  const c = content.contact;
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(def.title)}</title>
<meta name="description" content="${esc(def.description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
${icon}
<meta property="og:type" content="website">
<meta property="og:locale" content="tr_TR">
<meta property="og:site_name" content="${esc(BRAND)}">
<meta property="og:title" content="${esc(def.title)}">
<meta property="og:description" content="${esc(def.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
${css.map((href) => `<link rel="stylesheet" href="${esc(href)}">`).join('\n')}
<link rel="stylesheet" href="/seo.css">
${jsonLd(pageSchema(def, content, origin))}
</head>
<body class="seo-page">
<a class="skip-link" href="#icerik">İçeriğe geç</a>
<header class="seo-header"><a class="seo-brand" href="/" aria-label="${esc(BRAND)} ana sayfa"><small>Özel Sağlık Meslek Hizmet Birimi</small>${esc(SHORT)}</a>${nav(pagePath(def.slug))}</header>
<main id="icerik" class="seo-main">
<nav class="seo-crumbs" aria-label="Sayfa yolu"><a href="/">Ana sayfa</a>${
    def.kind === 'service'
      ? ` / <a href="${pagePath('hizmetlerimiz')}">Hizmetlerimiz</a>`
      : def.kind === 'expert'
        ? ` / <a href="${pagePath('uzmanlarimiz-2')}">Uzmanlarımız</a>`
        : ''
  } / <span>${esc(def.crumb)}</span></nav>
<article>
<h1>${esc(def.h1)}</h1>
${articleBody(def, content, origin)}
</article>
</main>
<footer class="seo-footer">
<p><strong>${esc(BRAND)}</strong><br>${esc(c.address)}<br><a href="tel:+${c.phone}">${esc(c.phoneDisplay)}</a></p>
<ul>${pagesOf(content).filter((p) => p.kind === 'service')
    .map((p) => `<li><a href="${pagePath(p.slug)}">${esc(p.h1)}</a></li>`)
    .join('')}</ul>
<p class="seo-copy">© ${new Date().getFullYear()} ${esc(BRAND)}</p>
</footer>
</body>
</html>`;
}

export function renderHome(content: SiteContent, origin: string, template: string): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      businessSchema(content, origin),
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: `${origin}/`,
        name: BRAND,
        inLanguage: 'tr-TR',
        publisher: { '@id': `${origin}/#business` },
      },
    ],
  };
  const fallback = `<div class="seo-static"><header>${nav('/')}</header><main><h1>${esc(content.hero.title)} ${esc(content.hero.accent)}</h1><p>${esc(content.hero.description)}</p>
<h2>Hizmetlerimiz</h2><ul>${content.services
    .map((s) => {
      const page = pagesOf(content).find((p) => p.kind === 'service' && p.ref === s.id);
      return `<li>${page ? `<a href="${pagePath(page.slug)}">${esc(page.h1)}</a>` : esc(s.title)}: ${esc(s.description)}</li>`;
    })
    .join('')}</ul>
<h2>Uzmanlarımız</h2><ul>${content.team
    .map((t) => {
      const page = pagesOf(content).find((p) => p.kind === 'expert' && p.ref === t.id);
      return `<li>${page ? `<a href="${pagePath(page.slug)}">${esc(`${t.role} ${t.name}`)}</a>` : esc(t.name)}</li>`;
    })
    .join('')}</ul>
<h2>${esc(content.about.title)}</h2><p>${esc(content.about.description)}</p>
<h2>İletişim</h2><p>${esc(content.contact.address)} · <a href="tel:+${content.contact.phone}">${esc(content.contact.phoneDisplay)}</a></p></main></div>`;
  return template
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLd(graph))
    .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
}

export function renderSitemap(origin: string, updatedAt: string): string {
  const lastmod = updatedAt.slice(0, 10);
  const urls = [
    { loc: `${origin}/`, priority: '1.0' },
    ...PAGES.map((p) => ({
      loc: `${origin}${pagePath(p.slug)}`,
      priority: p.kind === 'service' || p.kind === 'services' ? '0.9' : '0.7',
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
}

type Reader = () => { content: SiteContent; updatedAt: string };

export function registerSeoRoutes(
  app: Express,
  opts: { origin: string; distDir: string; read: Reader },
) {
  const template = () => readFileSync(resolve(opts.distDir, 'index.html'), 'utf8');
  const html = (res: Response, body: string) => {
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    res.type('html').send(body);
  };
  app.get('/', (_req: Request, res: Response) => html(res, renderHome(opts.read().content, opts.origin, template())));
  app.get('/sitemap.xml', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    res.type('application/xml').send(renderSitemap(opts.origin, opts.read().updatedAt));
  });
  app.get(['/sitemap_index.xml', '/wp-sitemap.xml', '/page-sitemap.xml', '/index.php/page-sitemap.xml'], (_req, res) =>
    res.redirect(301, '/sitemap.xml'),
  );
  app.get('/index.php', (_req, res) => res.redirect(301, '/'));
  app.get(/^\/(?:index\.php\/)?([a-z0-9-]+)\/?$/, (req, res, next) => {
    const def = bySlug.get(req.params[0] as string);
    if (!def) return next();
    const canonical = pagePath(def.slug);
    if (req.path !== canonical) return res.redirect(301, canonical);
    html(res, renderPage(def, opts.read().content, opts.origin, template()));
  });
}
