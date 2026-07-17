import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const FRONTEND_DIST_PATH = path.join(__dirname, '../../frontend/dist');

const SITEMAP_FILES = {
  homes: path.join(FRONTEND_DIST_PATH, 'sitemap-homes.xml'),
  hotels: path.join(FRONTEND_DIST_PATH, 'sitemap-hotels.xml'),
  temples: path.join(FRONTEND_DIST_PATH, 'sitemap-temples.xml'),
  services: path.join(FRONTEND_DIST_PATH, 'sitemap-services.xml'),
  index: path.join(FRONTEND_DIST_PATH, 'sitemap.xml'),
};

const BASE_URL = 'https://hosthaven.in';

function buildStaticUrlsXml(): string {
  const now = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/hotels</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/homes</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/temples</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/services</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/search</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
}

async function generateHomesSitemap(): Promise<string> {
  const properties = await prisma.property.findMany({
    where: { status: 'ACTIVE', isDeleted: false, type: 'HOME' },
    select: { slug: true, updatedAt: true },
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const prop of properties) {
    const lastmod = prop.updatedAt.toISOString().split('T')[0];
    xml += `  <url>\n    <loc>${BASE_URL}/homes/${prop.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
  xml += '</urlset>';
  return xml;
}

async function generateHotelsSitemap(): Promise<string> {
  const properties = await prisma.property.findMany({
    where: { status: 'ACTIVE', isDeleted: false, type: 'HOTEL' },
    select: { slug: true, updatedAt: true },
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const prop of properties) {
    const lastmod = prop.updatedAt.toISOString().split('T')[0];
    xml += `  <url>\n    <loc>${BASE_URL}/hotels/${prop.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
  xml += '</urlset>';
  return xml;
}

async function generateTemplesSitemap(): Promise<string> {
  const temples = await prisma.temple.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const temple of temples) {
    const lastmod = temple.updatedAt.toISOString().split('T')[0];
    xml += `  <url>\n    <loc>${BASE_URL}/temples/${temple.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
  xml += '</urlset>';
  return xml;
}

async function generateServicesSitemap(): Promise<string> {
  const services = await prisma.service.findMany({
    where: { isActive: true, isDeleted: false },
    select: { id: true, slug: true, updatedAt: true },
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const service of services) {
    const lastmod = service.updatedAt.toISOString().split('T')[0];
    const slugOrId = service.slug || service.id;
    xml += `  <url>\n    <loc>${BASE_URL}/services/${slugOrId}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  }
  xml += '</urlset>';
  return xml;
}

function generateSitemapIndexXml(): string {
  const now = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-homes.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-hotels.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-temples.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-services.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
}

async function main() {
  try {
    console.log('Generating sitemaps...');
    
    if (!fs.existsSync(FRONTEND_DIST_PATH)) {
      fs.mkdirSync(FRONTEND_DIST_PATH, { recursive: true });
    }

    const staticXml = buildStaticUrlsXml();
    fs.writeFileSync(path.join(FRONTEND_DIST_PATH, 'sitemap-static.xml'), staticXml, 'utf-8');
    console.log(`Static sitemap: ${(staticXml.match(/<url>/g) || []).length} URLs`);

    const homesXml = await generateHomesSitemap();
    fs.writeFileSync(SITEMAP_FILES.homes, homesXml, 'utf-8');
    console.log(`Homes sitemap: ${(homesXml.match(/<url>/g) || []).length} URLs`);

    const hotelsXml = await generateHotelsSitemap();
    fs.writeFileSync(SITEMAP_FILES.hotels, hotelsXml, 'utf-8');
    console.log(`Hotels sitemap: ${(hotelsXml.match(/<url>/g) || []).length} URLs`);

    const templesXml = await generateTemplesSitemap();
    fs.writeFileSync(SITEMAP_FILES.temples, templesXml, 'utf-8');
    console.log(`Temples sitemap: ${(templesXml.match(/<url>/g) || []).length} URLs`);

    const servicesXml = await generateServicesSitemap();
    fs.writeFileSync(SITEMAP_FILES.services, servicesXml, 'utf-8');
    console.log(`Services sitemap: ${(servicesXml.match(/<url>/g) || []).length} URLs`);

    const indexXml = generateSitemapIndexXml();
    fs.writeFileSync(SITEMAP_FILES.index, indexXml, 'utf-8');
    console.log(`Sitemap index generated`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();