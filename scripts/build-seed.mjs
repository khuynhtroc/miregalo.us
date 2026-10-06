// Builds data/seed.json – initial structure for the site.
//  • Taxonomy (hubs + recipients / occasions / interests / blog) – same URL architecture as the source site
//  • 1 author, a handful of sample affiliate products
//  • A few ORIGINAL sample posts (placeholder copy) so every template renders
//  • Keyword / content plan generated from the source URL map (data/source-url-map.txt, paths only)
//    -> Phase 2 AI Content Engine will research + write each planned URL.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const now = new Date();
const iso = (daysAgo = 0) => new Date(now.getTime() - daysAgo * 86400000).toISOString();
const ts = { created_at: iso(30), updated_at: iso(0) };

/* ───────────── Taxonomy ───────────── */
const cat = (slug, name, group, sort, extra = {}) => ({
  id: randomUUID(),
  slug,
  name,
  group,
  eyebrow: group === 'blog' || slug === 'blog' ? 'Stories and inspiration' : 'Gift guides',
  short_intro: '',
  description_html: '',
  hero_image: '',
  seo_title: '',
  seo_description: '',
  sort_order: sort,
  show_in_nav: true,
  show_in_footer: true,
  quick_link: false,
  ...ts,
  ...extra,
});

const categories = [
  // Hubs
  cat('gifts', 'Gifts Guide', 'hub', 0, { short_intro: 'Every gift guide in one place.', description_html: '<p>Browse every gift guide by person, occasion or interest.</p>' }),
  cat('recipients', 'Recipients', 'hub', 1, { short_intro: 'Thoughtful ideas for every person who matters.', description_html: '<p>Gift ideas organised by who you are shopping for.</p>' }),
  cat('occasions', 'Occasions', 'hub', 2, { short_intro: 'Celebrate milestones, holidays and everyday moments.', description_html: '<p>Gift ideas for every celebration on the calendar.</p>' }),
  cat('interests', 'Interests', 'hub', 3, { short_intro: 'Start with what they love and make it personal.', description_html: '<p>Gift ideas based on hobbies and passions.</p>' }),
  cat('blog', 'Blog', 'hub', 4, { short_intro: 'Stories, quotes and ideas for meaningful moments.', description_html: '<p>Relationship tips, quotes, holiday ideas and more.</p>' }),
  // Recipients
  cat('women', 'Women', 'recipients', 10, { quick_link: false }),
  cat('mom', 'Mom', 'recipients', 11, { quick_link: true }),
  cat('men', 'Men', 'recipients', 12, { quick_link: true }),
  cat('kids-teens', 'Kids & Teens', 'recipients', 13),
  cat('friends', 'Friends', 'recipients', 14),
  cat('dad', 'Dad', 'recipients', 15),
  cat('couples', 'Couples', 'recipients', 16, { quick_link: true }),
  cat('anyone', 'Anyone', 'recipients', 17, { show_in_footer: false }),
  // Occasions
  cat('wedding', 'Wedding', 'occasions', 20),
  cat('valentine', 'Valentine', 'occasions', 21),
  cat('housewarming', 'Housewarming', 'occasions', 22),
  cat('halloween', 'Halloween', 'occasions', 23),
  cat('graduation', 'Graduation', 'occasions', 24),
  cat('christmas', 'Christmas', 'occasions', 25, { quick_link: true, show_in_footer: true }),
  cat('birthday', 'Birthday', 'occasions', 26, { quick_link: true, show_in_footer: false }),
  cat('anniversary', 'Anniversary', 'occasions', 27, { quick_link: true, show_in_footer: false }),
  // Interests
  cat('popular', 'Popular', 'interests', 30),
  cat('outdoors-sports', 'Outdoors & Sports', 'interests', 31),
  cat('animals', 'Animal Lovers', 'interests', 32),
  // Blog categories
  cat('relationship', 'Relationship', 'blog', 40),
  cat('quotes', 'Quotes', 'blog', 41),
  cat('holiday', 'Holiday', 'blog', 42),
  cat('family', 'Family', 'blog', 43),
  cat('events', 'Events', 'blog', 44),
];
for (const c of categories) {
  if (c.group !== 'hub') {
    c.short_intro ||= `Hand-picked ${c.name.toLowerCase()} ideas and guides.`;
    c.description_html ||= `<p>Explore our latest ${c.name.toLowerCase()} guides and articles. This description is editable in Admin → Categories.</p>`;
  }
}
const C = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

/* ───────────── Author ───────────── */
const author = {
  id: randomUUID(),
  slug: 'editorial-team',
  name: 'Editorial Team',
  entity_type: 'Organization',
  job_title: '',
  bio_html: '<p>We research, test and curate thoughtful gift ideas for every person and occasion. Edit this bio in Admin → Authors.</p>',
  avatar: '',
  email: 'content@example.com',
  website: '',
  same_as: [],
  ...ts,
};

/* ───────────── Products (affiliate library samples) ───────────── */
const prod = (slug, name, merchant, price, tags) => ({
  id: randomUUID(),
  slug,
  name,
  url: `https://example.com/products/${slug}?ref=giftblog`,
  merchant,
  image: '',
  price,
  currency: 'USD',
  description: '',
  tags,
  clicks: 0,
  active: true,
  ...ts,
});
const products = [
  prod('engraved-star-map-print', 'Engraved Star Map Print', 'Example Store', '$39', ['anniversary', 'couples']),
  prod('custom-name-necklace', 'Custom Name Necklace', 'Example Store', '$45', ['women', 'mom']),
  prod('leather-travel-wallet', 'Leather Travel Wallet', 'Example Store', '$49', ['men', 'dad']),
  prod('photo-memory-blanket', 'Photo Memory Blanket', 'Example Store', '$59', ['mom', 'family']),
  prod('desk-plant-kit', 'Desk Plant Starter Kit', 'Example Store', '$25', ['anyone', 'popular']),
  prod('hiking-daypack', 'Lightweight Hiking Daypack', 'Example Store', '$65', ['outdoors-sports', 'men']),
];
const P = Object.fromEntries(products.map((p) => [p.slug, p.id]));

/* ───────────── Sample posts (original placeholder copy) ───────────── */
const basePost = {
  intro_html: '',
  content_html: '',
  items: [],
  faqs: [],
  hero_image: '',
  hero_alt: '',
  author_id: author.id,
  status: 'published',
  featured: false,
  editor_pick: false,
  focus_keyword: '',
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  robots: '',
  og_image: '',
};

const item = (heading, productSlug, desc, pros) => ({
  product_id: productSlug ? P[productSlug] : null,
  heading,
  image: '',
  url: '',
  merchant: '',
  price: '',
  description_html: `<p>${desc}</p>`,
  pros,
  button_label: '',
});

const giftPost = (slug, title, primary, cats, daysAgo, extra = {}) => ({
  id: randomUUID(),
  ...basePost,
  type: 'gift',
  slug,
  title,
  excerpt: `Sample gift guide placeholder for “${title}”. Replace with AI-generated content in Phase 2.`,
  intro_html:
    '<p>This is placeholder introduction copy. In Phase 2 the AI Content Engine will research the keyword, write an original introduction and match products automatically.</p><p>Use <strong>Admin → Posts</strong> to edit any field of this guide.</p>',
  content_html:
    '<h2>Bottom Line</h2><p>Placeholder conclusion paragraph. Summarise the best picks and link to related guides here.</p>',
  items: [
    item('Engraved Star Map Print', 'engraved-star-map-print', 'Placeholder description of the pick and why it works as a gift.', ['Personalised', 'Ready to frame', 'Ships fast']),
    item('Custom Name Necklace', 'custom-name-necklace', 'Placeholder description of the pick and why it works as a gift.', ['Everyday wear', 'Gift box included']),
    item('Photo Memory Blanket', 'photo-memory-blanket', 'Placeholder description of the pick and why it works as a gift.', ['Soft fleece', 'Upload any photo']),
    item('Desk Plant Starter Kit', 'desk-plant-kit', 'Placeholder description of the pick and why it works as a gift.', ['Low maintenance', 'Under $30']),
  ],
  faqs: [
    { q: 'How do I choose the right gift?', a: 'Placeholder answer. Phase 2 will generate FAQs from real search questions.' },
    { q: 'Can these gifts be personalised?', a: 'Placeholder answer about personalisation options.' },
  ],
  primary_category_id: C[primary],
  category_ids: cats.map((s) => C[s]),
  published_at: iso(daysAgo),
  focus_keyword: title.toLowerCase(),
  ...extra,
});

const blogPost = (slug, title, primary, daysAgo, extra = {}) => ({
  id: randomUUID(),
  ...basePost,
  type: 'blog',
  slug,
  title,
  excerpt: `Sample blog article placeholder for “${title}”.`,
  content_html:
    '<p>This is placeholder body copy for a blog article.</p><h2>Section heading</h2><p>Phase 2 will replace this with researched, original content and internal links.</p><h2>Another section</h2><p>Headings (H2/H3) automatically build the “In this article” table of contents.</p>',
  primary_category_id: C[primary],
  category_ids: [C[primary], C.blog].filter(Boolean),
  published_at: iso(daysAgo),
  ...extra,
});

const posts = [
  giftPost('sample-anniversary-gifts', 'Sample Anniversary Gift Ideas', 'anniversary', ['anniversary', 'couples', 'popular'], 1, { featured: true }),
  giftPost('sample-gifts-for-mom', 'Sample Gift Ideas for Mom', 'mom', ['mom', 'women', 'popular'], 2, { editor_pick: true }),
  giftPost('sample-gifts-for-dad', 'Sample Gift Ideas for Dad', 'dad', ['dad', 'men'], 3, { editor_pick: true }),
  giftPost('sample-christmas-gifts', 'Sample Christmas Gift Ideas', 'christmas', ['christmas', 'anyone', 'popular'], 4, { featured: true }),
  giftPost('sample-birthday-gifts', 'Sample Birthday Gift Ideas', 'birthday', ['birthday', 'anyone'], 5, { featured: true }),
  giftPost('sample-outdoor-gifts', 'Sample Gifts for Outdoor Lovers', 'outdoors-sports', ['outdoors-sports', 'men'], 6, { editor_pick: true }),
  giftPost('sample-wedding-gifts', 'Sample Wedding Gift Ideas', 'wedding', ['wedding', 'couples'], 7, { featured: true }),
  giftPost('sample-pet-lover-gifts', 'Sample Gifts for Animal Lovers', 'animals', ['animals', 'anyone'], 8),
  giftPost('sample-graduation-gifts', 'Sample Graduation Gift Ideas', 'graduation', ['graduation', 'kids-teens'], 9, { featured: true }),
  giftPost('sample-gifts-for-her', 'Sample Gift Ideas for Her', 'women', ['women', 'valentine'], 10, { editor_pick: true }),
  giftPost('sample-friend-gifts', 'Sample Gifts for Friends', 'friends', ['friends', 'anyone'], 11),
  giftPost('sample-housewarming-gifts', 'Sample Housewarming Gift Ideas', 'housewarming', ['housewarming', 'anyone'], 12),
  blogPost('sample-date-night-ideas', 'Sample Date Night Ideas', 'relationship', 2, { editor_pick: true }),
  blogPost('sample-birthday-wishes', 'Sample Birthday Wishes', 'quotes', 3),
  blogPost('sample-holiday-traditions', 'Sample Holiday Traditions', 'holiday', 4),
  blogPost('sample-family-activities', 'Sample Family Activities at Home', 'family', 5),
  blogPost('sample-party-planning', 'Sample Party Planning Guide', 'events', 6),
  {
    id: randomUUID(),
    ...basePost,
    type: 'page',
    slug: 'about-us',
    title: 'About Us',
    excerpt: 'Who we are and how we choose the gift ideas we recommend.',
    content_html:
      '<p>Placeholder About page. Explain your editorial process, how affiliate links work and how readers can contact you.</p><h2>How we choose products</h2><p>Placeholder copy.</p><h2>Contact</h2><p>Placeholder copy.</p>',
    primary_category_id: null,
    category_ids: [],
    author_id: null,
    published_at: iso(30),
  },
].map((p) => ({ ...p, created_at: p.published_at, updated_at: p.published_at }));

/* ───────────── Keyword / URL plan from source URL map ───────────── */
const taxonomySlugs = new Set(categories.map((c) => c.slug));
const mapFile = path.join(root, 'data', 'source-url-map.txt');
const keywords = [];
if (existsSync(mapFile)) {
  const lines = readFileSync(mapFile, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set();
  for (const p of lines) {
    if (p === '/' || p.includes('/page/') || p.startsWith('/author/')) continue;
    const parts = p.split('/').filter(Boolean);
    let type = 'gift';
    let slug = parts[0];
    if (parts[0] === 'blog' && parts[1]) { type = 'blog'; slug = parts[1]; }
    else if (parts.length !== 1) continue;
    if (taxonomySlugs.has(slug) || slug === 'blog') continue;
    if (slug === 'about-us') type = 'page';
    const key = `${type}:${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const phrase = slug.replace(/-/g, ' ');
    // naive cluster guess from slug tokens
    const cluster =
      ['anniversary', 'birthday', 'christmas', 'wedding', 'valentine', 'halloween', 'graduation', 'housewarming', 'mom', 'dad', 'men', 'women', 'wife', 'husband', 'girlfriend', 'boyfriend', 'kids', 'teen', 'friend', 'quotes', 'wishes']
        .find((t) => slug.includes(t)) || (type === 'blog' ? 'blog' : 'general');
    keywords.push({
      id: randomUUID(),
      keyword: phrase,
      target_path: type === 'blog' ? `/blog/${slug}/` : `/${slug}/`,
      post_type: type,
      cluster,
      intent: type === 'gift' ? 'commercial' : 'informational',
      volume: 0,
      difficulty: 0,
      priority: 0,
      status: 'planned',
      post_id: null,
      notes: '',
      ...ts,
    });
  }
}

/* ───────────── Redirect example ───────────── */
const redirects = [
  { id: randomUUID(), source: '/old-sample-url/', destination: '/sample-anniversary-gifts/', code: 301, hits: 0, active: true, ...ts },
];

const seed = { settings: {}, categories, authors: [author], products, posts, redirects, keywords };
writeFileSync(path.join(root, 'data', 'seed.json'), JSON.stringify(seed, null, 1));
console.log(
  `seed.json written: ${categories.length} categories, ${posts.length} posts, ${products.length} products, ${keywords.length} planned URLs/keywords`
);
