const express = require('express');
const app = express();
const { Cluster } = require('puppeteer-cluster');
const fs = require('fs/promises')
const path = require('path')

const IMAGE_CACHE_DIR = path.join(process.cwd(), 'img');

const main = async () => {

    app.get('/', async function (req, res) {
      const url = decodeBase64Url(req.query.url_base64url)
          let data = await readFromCache(url)

          res.writeHead(200, {
              'Content-Type': 'image/jpg',
              'Content-Length': 0
          });
          res.end('');
    });

    app.listen(3000, '0.0.0.0');
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
