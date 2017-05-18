const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');
const ProgressBar = require('progress');
const albumPhotos = require('./albumPhotos');

let bar;

async function getPageAlbums(baseUrl, page) {
  return new Promise((resolve, reject) => {
    request(`${baseUrl}/albums?page=${page}`, function (error, response, html) {
      if (error) reject(error);
      const $ = cheerio.load(html);
      const albumBlocks = $('.album-block');
      const albumInfos = _.map(albumBlocks, function (element) {
        const id = $(element).data('id');
        const title = $(element).find('.album-title').text().replace(/[\/\\:\*\?".<>|]/g, '_');
        return { id, title };
      });
      resolve(albumInfos);
    });
  }).then(async (results) => {
    const result = await Promise.all(results.map(async (data) => {
      const photoDatas = await albumPhotos.allPhotos(baseUrl, data.id);
      return { id: data.id, title: data.title, photoDatas };
    }));
    bar.tick();
    return result;
  });
}

async function getAlbums(baseUrl) {
  return new Promise((resolve, reject) => {
    request(`${baseUrl}/albums`, function (error, response, html) {
      if (error) reject(error);
      const $ = cheerio.load(html);
      const lastPageNumber = Number($('ul.pagination li:last-child a').attr('href').replace(/^\/\w+\?page=(\d+)/g, '$1'));
      bar = new ProgressBar(`擷取相簿資訊中 [:bar] :percent`, {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: lastPageNumber
      });
      
      Promise.all(_.times(lastPageNumber, Number).map((n) => getPageAlbums(baseUrl, n + 1))).then((results) => {
        const result = results.reduce((prev, curr) => prev.concat(curr), []);
        resolve(result);
      });
    });
  });
}
module.exports = getAlbums;
