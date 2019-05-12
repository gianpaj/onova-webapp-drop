const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const httpServer = require('http');

const port = process.env.PORT || 3000;
const app = express();

axios.defaults.baseURL = 'https://onova.co';

const onovaImage = 'https://onova.co/img/logo-white-1200px-cropped.png';

// read in the index.html file
const filePath = path.resolve(__dirname, './dist', 'index.html');
const htmlFile = fs.readFileSync(filePath, 'utf8');

const defaultSchema = `<script data-schema="WebSite" type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "Organization",
  "logo": "https://onova.co/img/logo-white-1200px-cropped.png"
  "name": "Drop",
  "url": "https://drop.uno",
}
</script>
<script data-schema="SoftwareApplication" type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "SoftwareApplication",
  "name": "Drop - Купуй та продавай одяг та аксесуари з телефону",
  "operatingSystem": "ANDROID",
  "applicationCategory": "http://schema.org/MobileApplication",
  "installUrl": "https://play.google.com/store/apps/details?id=uno.drop.app&hl=uk",
  "description": "Купуй та продавай одяг та аксесуари з телефону Download Givebox for Android and iPhone today",
  "offers": {
    "@type": "Offer",
    "price": "0"
  }
}
</script>`;

app.get('/', (req, res) => {
  // replace the special strings with server generated strings
  let html = htmlFile;
  html = html.replace(/\$OG_TITLE\$/g, 'Drop - Купуй та продавай одяг та аксесуари з телефону');
  html = html.replace(/\$OG_DESCRIPTION\$/g, 'Мобільним додатком для купівлі та продажу одягу');
  html = html.replace(/\$OG_IMAGE\$/g, dropLogo);
  html = html.replace(/\$OG_IMAGE_WIDTH\$/g, '1200');
  html = html.replace(/\$OG_IMAGE_HEIGHT\$/g, '630');
  html = html.replace(/\$OG_CANONICAL\$/g, 'https://drop.uno/');
  html = html.replace('__$SCHEMA__', defaultSchema);
  html = html.replace(/__\$.*\$__/g, ''); // remove comments
  return res.status(200).send(html);
});

app.use(express.static(path.resolve(__dirname, './dist')));

/**
 * Redirect all trailing slashes
 */
app.use((req, res, next) => {
  if (req.path.substr(-1) === '/' && req.path.length > 1) {
    const query = req.url.slice(req.path.length);
    return res.redirect(301, req.path.slice(0, -1) + query);
  }
  return next();
});

// app.get('/uploader', (req, res) => {
//   res.redirect('https://onova.co/uploader');
// });

app.get('/:userName([a-zA-Z0-9_.]{3,30}$)', (req, res) => {
  axios(`/api/users/?username=${req.params.userName}`)
    .then(({ data }) => {
      let html = htmlFile;
      html = html.replace(
        /\$OG_TITLE\$/g,
        `${(data.displayName && htmlEscape(data.displayName)) || `@${htmlEscape(data.username)}`} shop`
      );
      html = html.replace(
        /\$OG_DESCRIPTION\$/g,
        data.bio && htmlEscape(data.bio) ? htmlEscape(data.bio.substring(0, 300)) : ''
      );
      html = html.replace(/\$OG_IMAGE\$/g, data.profilePic || dropLogo);
      html = html.replace(/\$OG_IMAGE_WIDTH\$/g, data.profilePic ? '200' : '1200');
      html = html.replace(/\$OG_IMAGE_HEIGHT\$/g, data.profilePic ? '200' : '630');
      html = html.replace(/\$OG_CANONICAL\$/g, `https://drop.uno/${req.params.userName}`);
      html = html.replace(/__\$.*\$__/g, ''); // remove comments
      html = html.replace('__$SCHEMA__', '');
      res.status(200).send(html);
    })
    .catch(e => {
      if (e.message === 'Request failed with status code 400') {
        return res.status(404).send('User not found');
      }
      console.error(e);
      return res.status(500).send(JSON.stringify(e));
    });
});

app.get('/:userName([a-zA-Z0-9_.]{3,30})/:itemId([a-zA-Z0-9_-]{7,14})', (req, res) => {
  const { itemId, userName } = req.params;

  return axios(`/api/products/${itemId}`)
    .then(({ data: d }) => {
      const { data } = d;
      if (data.seller.username !== userName) {
        throw new Error();
      }
      let html = htmlFile;
      let title,
        trimDescription,
        brand = '';

      const description = htmlEscape(data.description.replace(/\r?\n|\r/g, ' ').replace('  ', ' '));
      if (!data.tags) {
        title = description.substring(0, 50);
        trimDescription = description.substring(0, 300);
      } else {
        const tags = data.tags.join(' ');
        title = `${description.substring(0, 50 - tags.length)} - ${tags}`;
        trimDescription = `${description.substring(0, 300 - tags.length)} - ${tags}`;
        html = html.replace('__$OG_BRAND$__', `<meta property="og:brand" content="${data.tags[0]}"/>`);
        brand = `"brand": {
    "@type": "Thing",
    "name": "${data.tags[0]}"
  },`;
      }
      html = html.replace(/\$OG_TITLE\$/g, title);
      html = html.replace(/\$OG_DESCRIPTION\$/g, trimDescription);
      html = html.replace('__$OG_PRICE$__', `<meta property="og:price:amount" content="${data.price}"/>`);
      html = html.replace('__$OG_PRICE_CURRENCY$__', '<meta property="og:price:currency" content="UAH"/>');
      html = html.replace('__$OG_AVAILABILITY$__', '<meta property="og:availability" content="instock"/>');
      html = html.replace(/\$OG_IMAGE\$/g, changeToThumb(data.photoURIs[0], true));
      html = html.replace(/\$OG_IMAGE_WIDTH\$/g, '350');
      html = html.replace(
        '<meta property="og:type" content="website"/>',
        '<meta property="og:type" content="product"/>'
      );
      html = html.replace(/\$OG_IMAGE_HEIGHT\$/g, '350');
      html = html.replace(
        '__$SCHEMA__',
        `<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "${title}",
  "image": [ "${changeToThumb(data.photoURIs[0], true)}"],
  "description": "${trimDescription}",
  ${brand}
  "offers": {
    "@type": "Offer",
    "itemOffered": "Product",
    "url": "https://drop.uno/${userName}/${itemId}",
    "priceCurrency": "UAH",
    "price": "${data.price}",
    "priceValidUntil": "2020-11-05",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "${data.seller.displayName.trim()}"
    }
  }
}
</script>`
      );
      html = html.replace(/\$OG_CANONICAL\$/g, `https://drop.uno/${userName}/${itemId}`);
      res.status(200).send(html);
    })
    .catch(e => {
      if (e.message === 'Request failed with status code 400') {
        return res.status(404).send('Item not found');
      }
      console.error(e);
      return res.status(500).send(JSON.stringify(e));
    });
});

app.get('*', (req, res) => {
  let html = htmlFile;
  html = html.replace(/\$OG_TITLE\$/g, 'Not Found - Drop - Купуй та продавай одяг та аксесуари з телефону');
  html = html.replace(/\$OG_DESCRIPTION\$/g, 'Мобільним додатком для купівлі та продажу одягу');
  html = html.replace(/\$OG_IMAGE\$/g, dropLogo);
  html = html.replace(/\$OG_IMAGE_WIDTH\$/g, '1200');
  html = html.replace(/\$OG_IMAGE_HEIGHT\$/g, '630');
  html = html.replace(/\$OG_CANONICAL\$/g, 'https://drop.uno/');
  return res.status(404).send(html);
});

/**
 * @param {string} url
 * @param {bool} higherRes
 */
function changeToThumb(url, higherRes = false) {
  if (higherRes) return url.replace('.jpg', '-thumb@2x.jpg');
  return url.replace('.jpg', '-thumb.jpg');
}

const server = httpServer.createServer(app);

server.listen(port, () => {
  console.log('Listening on port', port);

  // pm2 graceful start
  if (process.send) process.send('ready');
});

process.on('SIGINT', () => {
  console.info('SIGINT signal received.');

  // Stops the server from accepting new connections and finishes existing connections.
  server.close(err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log('Closed out remaining connections');
    process.exit(0);
  });
});

const htmlEscape = string =>
  string
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
