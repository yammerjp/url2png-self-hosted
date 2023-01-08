const express = require('express');
const app = express();
const { Cluster } = require('puppeteer-cluster');
const fs = require('fs/promises')
const path = require('path')

const IMAGE_CACHE_DIR = path.join(process.cwd(), 'img');

const main = async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 10,
        puppeteerOptions: {
          headless: true,
          defaultViewport: {
              width: 1440,
              height: 900,
          },
          args: [
            "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36", '--no-sandbox', '--disable-setuid-sandbox'
          ],
        }
    });
    await cluster.task(async ({ page, data: url}) => {
        await page.goto(url);
        await page.waitForTimeout(2000);
        const screen = await page.screenshot({path: cachePath(url)});
        return screen;
    });

    app.get('/', async function (req, res) {
      const url = decodeBase64Url(req.query.url_base64url)
        if (!url) {
            return res.end('Please specify url like this: ?url=example.com');
        }
        try {
          let data = await readFromCache(url)
          if (!data) {
            data = await cluster.execute(url);
          }

          res.writeHead(200, {
              'Content-Type': 'image/jpg',
              'Content-Length': data.length
          });
          res.end(data);

        } catch (err) {
            res.end('Error: ' + err.message);
        }
    });

    app.listen(3000, function () {
        console.log('Screenshot server listening on port 3000.');
    });
}

const readFromCache = async (url) => {
    const path = cachePath(url);
    try {
        return await fs.readFile(path)
    } catch(_) {
        return null
    }
}

function encodeBase64Url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(base64url) {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString()
}

const cachePath = (url) => path.join(IMAGE_CACHE_DIR, encodeBase64Url(url) + '.png')

main()
