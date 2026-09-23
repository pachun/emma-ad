import { sign } from 'node:crypto';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const appId = '6747730134';
const territories = JSON.parse(await readFile(new URL('review-territories.json', import.meta.url), 'utf8'));
const featuredIds = ['00000192-3230-d603-63ff-092400000000', '00000192-3230-d603-1e3c-a8b000000000', '00000192-3230-d603-18fe-815500000000'];
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const token = () => {
  const now = Math.floor(Date.now() / 1000);
  const lifetimeSeconds = 600;
  const payload = `${encode({ alg: 'ES256', kid: process.env.ASC_KEY_ID, typ: 'JWT' })}.${encode({ iss: process.env.ASC_ISSUER_ID, iat: now, exp: now + lifetimeSeconds, aud: 'appstoreconnect-v1' })}`;
  const signature = sign('sha256', Buffer.from(payload), { key: process.env.ASC_PRIVATE_KEY_PEM, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${payload}.${signature}`;
};

const fetchPages = async (url, authorization, visited = []) => {
  if (new URL(url).origin !== 'https://api.appstoreconnect.apple.com' || visited.includes(url)) throw new Error('Invalid Apple pagination URL');
  const response = await fetch(url, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(30000), redirect: 'error' });
  if (!response.ok) throw new Error(`Apple reviews request failed (${response.status}); existing reviews retained`);
  const page = await response.json();
  if (!Array.isArray(page.data)) throw new Error('Invalid Apple reviews response');
  return [...page.data, ...(page.links?.next ? await fetchPages(page.links.next, authorization, [...visited, url]) : [])];
};

const reviewMarkup = (review, featured = false) => {
  const country = territories[review.territory];
  const countryName = country ? regionNames.of(country) : review.territory;
  const sourceUrl = `https://apps.apple.com/${country?.toLowerCase() || 'us'}/app/emma-email/id${appId}?see-all=reviews`;
  return `<figure class="reader-review${featured ? ' reader-review-featured' : ''}">
    <p class="review-stars" aria-label="${review.rating} out of 5 stars"><span aria-hidden="true">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span></p>
    <blockquote><p>${escape(review.body.replace(/[ \t]+(?=\n)/g, ""))}</p></blockquote>
    <figcaption><span class="review-author">${escape(review.reviewerNickname)}</span><span>${escape(countryName)} · <time datetime="${escape(review.createdDate)}">${dateFormat.format(new Date(review.createdDate.slice(0, 10)))}</time></span><a href="${escape(sourceUrl)}" target="_blank" rel="noopener">App Store review<span class="review-sr-only">: ${escape(review.title)}</span></a></figcaption>
  </figure>`;
};

const render = reviews => {
  const featured = featuredIds.flatMap(id => reviews.filter(review => review.id === id && review.rating >= 4));
  return `<section class="reader-reviews" aria-labelledby="reader-reviews-title">
    <div class="reviews-heading"><div><h2 id="reader-reviews-title">App Store Reviews</h2></div><div class="review-navigation" hidden><button type="button" data-review-direction="-1" aria-label="Previous testimonial" aria-controls="selected-reviews">←</button><button type="button" data-review-direction="1" aria-label="Next testimonial" aria-controls="selected-reviews">→</button></div></div>
    <div class="selected-reviews" id="selected-reviews" tabindex="0" role="region" aria-label="Selected testimonials">${featured.map(review => reviewMarkup(review, true)).join('\n')}</div>
  </section>`;
};

const refresh = async () => {
  const credentials = ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_PRIVATE_KEY_PEM'];
  if (credentials.some(name => !process.env[name])) throw new Error('Missing App Store Connect credentials');
  const raw = await fetchPages(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/customerReviews?limit=200&sort=-createdDate`, `Bearer ${token()}`);
  const reviews = raw.map(({ id, attributes }) => ({ id, rating: attributes.rating, title: attributes.title, body: attributes.body, reviewerNickname: attributes.reviewerNickname, createdDate: attributes.createdDate, territory: attributes.territory }));
  if (reviews.some(review => !review.id || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5 || ['title', 'body', 'reviewerNickname', 'territory'].some(field => typeof review[field] !== 'string') || !Number.isFinite(Date.parse(review.createdDate)))) throw new Error('Invalid review; existing reviews retained');
  const sorted = [...new Map(reviews.map(review => [review.id, review])).values()].sort((a, b) => Date.parse(b.createdDate) - Date.parse(a.createdDate) || a.id.localeCompare(b.id));
  const indexPath = new URL('index.html', root);
  const html = await readFile(indexPath, 'utf8');
  const section = /<div class="spine" id="app-store-reviews">[\s\S]*?<!-- end-app-store-reviews -->/;
  if (!section.test(html)) throw new Error('Review section not found');
  const updated = html.replace(section, () => `<div class="spine" id="app-store-reviews">\n${render(sorted)}\n</div><!-- end-app-store-reviews -->`);
  const tempPath = fileURLToPath(indexPath) + '.reviews-tmp';
  await writeFile(tempPath, updated);
  await rename(tempPath, indexPath);
  console.log(`Refreshed ${sorted.length} written reviews across ${new Set(sorted.map(review => review.territory)).size} storefronts`);
};

await refresh().catch(error => { console.error(error.message); process.exitCode = 1; });
