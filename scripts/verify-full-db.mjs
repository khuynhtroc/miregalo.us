import fs from 'fs';

const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));

console.log('=== VERIFICATION SUMMARY ===');
console.log('Total posts:', db.posts.length);
console.log('Total products:', db.products.length);
console.log('Total redirects:', db.redirects.length);

const blogs = db.posts.filter(p => p.type === 'blog');
const gifts = db.posts.filter(p => p.type === 'gift');
console.log('Blog posts count:', blogs.length);
console.log('Gift posts count:', gifts.length);

// Category distribution for blogs
const blogCats = {};
blogs.forEach(b => {
  const cat = db.categories.find(c => c.id === b.primary_category_id);
  const slug = cat ? cat.slug : 'unknown';
  blogCats[slug] = (blogCats[slug] || 0) + 1;
});
console.log('\nBlog posts by category:');
console.table(blogCats);

// Category distribution for gifts
const giftCats = {};
gifts.forEach(g => {
  const cat = db.categories.find(c => c.id === g.primary_category_id);
  const slug = cat ? cat.slug : 'unknown';
  giftCats[slug] = (giftCats[slug] || 0) + 1;
});
console.log('\nGift posts by category:');
console.table(giftCats);

// Check sample blog
const sampleBlog = blogs[5];
console.log('\nSample Blog Post:');
console.log(' - Title:', sampleBlog.title);
console.log(' - Slug:', sampleBlog.slug);
console.log(' - Hero Image:', sampleBlog.hero_image);
console.log(' - Content HTML Length:', sampleBlog.content_html.length);
const bHeadings = [...sampleBlog.content_html.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => m[2].replace(/<[^>]+>/g, '').trim());
console.log(' - Headings in Content:', bHeadings.slice(0, 5));
const bImgs = [...sampleBlog.content_html.matchAll(/<img[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]);
console.log(' - In-content images:', bImgs.slice(0, 3));

// Check sample gift
const sampleGift = gifts[5];
console.log('\nSample Gift Post:');
console.log(' - Title:', sampleGift.title);
console.log(' - Slug:', sampleGift.slug);
console.log(' - Hero Image:', sampleGift.hero_image);
console.log(' - Intro HTML Length:', sampleGift.intro_html.length);
console.log(' - Content HTML Length:', sampleGift.content_html.length);
console.log(' - Items count:', sampleGift.items.length);
console.log(' - Item 1 Heading:', sampleGift.items[0]?.heading);
console.log(' - Item 1 Image:', sampleGift.items[0]?.image);
console.log(' - Item 1 Desc:', sampleGift.items[0]?.description_html?.slice(0, 150));
console.log(' - Item 1 Pros:', sampleGift.items[0]?.pros);

// Check products sample
const sampleProd = db.products[10];
console.log('\nSample Product Table Row:');
console.log(' - Name:', sampleProd.name);
console.log(' - Image:', sampleProd.image);
console.log(' - URL:', sampleProd.url);
console.log(' - Desc:', sampleProd.description.slice(0, 150));
