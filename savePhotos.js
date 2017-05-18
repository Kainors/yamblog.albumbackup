const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');
const ProgressBar = require('progress');

async function saveAlbum(albumInfo, baseSavePath) {
  const albumPath = `${albumInfo.id}_${albumInfo.title}`;
  const albumSavePath = path.resolve(baseSavePath, albumPath);
  if (!fs.existsSync(albumSavePath)) {
    mkdirp.sync(albumSavePath);
  }
  const totalPhoto = albumInfo.photoDatas.length;
  let i = 0;
  const bar = new ProgressBar(`${albumInfo.id}_${albumInfo.title}下載中 [:bar] :current/:total :percent`, {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: totalPhoto
  });
  for (; i < totalPhoto; i++){
    await savePhoto(albumSavePath, albumInfo.photoDatas[i]);
    bar.tick();
  }
}

async function savePhoto(albumSavePath, photoData) {
  return new Promise((resolve, reject) => {
    request({ url: photoData.lUrl, encoding: null },
      function (error, response, buffer) {
        if (error) reject(error);
        var saveName = photoData.name || `${photoData.id}.jpg`;
        fs.writeFileSync(path.resolve(albumSavePath, saveName), buffer, 'binary');
        resolve();
      });
  });
}

module.exports = saveAlbum;