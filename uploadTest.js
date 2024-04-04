
const { matchRoutes } = require("react-router-config"); //for sitemap.xml
const { SitemapStream, streamToPromise } = require("sitemap");
const fs = require('fs');
const sitemap = new SitemapStream({ hostname: "https://numbler.net" });

const routes = [
  { path: '/', exact: true, component: 'Home' },
  { path: '/digits2'},
  { path: '/digits3'},
  { path: '/digits4'},
  { path: '/digits5'},
  { path: '/digits6'},
  { path: '/digits7'},
  { path: '/login'},
  { path: '/signup'},
  { path: '/leaderboards'},
];


async function generateSitemap() {
  // Create a sitemap stream
  const sitemapStream = new SitemapStream({ hostname: "https://numbler.net" });

  // Add URLs to the sitemap
  routes.forEach(route => {
      const { path } = route;
      sitemapStream.write({ url: route.path, changefreq: "monthly", priority: 0.6 });
  });

  // End sitemap stream
  sitemapStream.end();

  // Convert the sitemap stream to a string
  const sitemap = await streamToPromise(sitemapStream);

  // Write sitemap to a file
  fs.writeFileSync('./client/public/sitemap.xml', sitemap);

  console.log('Sitemap generated successfully.');
}

generateSitemap();