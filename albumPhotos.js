const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

async function allPhotos(baseUrl, albumId) {
  let pageCount = 1;
  let result = [];
  let isLastPage = false;
  do {
    const data = await fetchImagesPath(`${baseUrl}/ajax/album/fetch`, albumId, pageCount);
    result = result.concat(data.photos.map((p) => {
      return {
        id: p.id,
        mUrl: p.url,
        name: p.name,
        lUrl: p.url.replace(/^(.+\/)(m)(_\w+.jpg)$/g, '$1l$3')
      };
    }));
    pageCount = pageCount + 1;
    isLastPage = data.lastPage;
  } while (!isLastPage);
  return result;
}

async function fetchImagesPath(url, albumId, page) {
  return new Promise((resolve, reject) => {
    request.post({ url, json: true, form: { page, albumId } }, function (error, response, body) {
      if (error) reject(error);
      resolve(body);
    });
  });
}

module.exports = { allPhotos };