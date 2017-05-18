const fs = require('fs');
const path = require('path');
const request = require('request');
const mkdirp = require('mkdirp');
const getAlbums = require('./getAlbums');
const albumPhotos = require('./albumPhotos');
const savePhotos = require('./savePhotos');
const _ = require('lodash');

process.on('exit', (code) => {
  switch (code) {
    case 0:
      console.log('程式執行結束');
      break;
    case 1:
      console.log('請加入 --user=xxx 參數');
      break;
    case 2:
      console.log('--user=xxx 參數格式錯誤');
      break;
    case 3:
      console.log('讀取相簿發生錯誤，請確認使用者名稱!');
      break;
    case 4:
      console.log('儲存照片發生錯誤，請確認網路環境，並重新執行!');
      break;
    default:
      console.log('未知的錯誤');
      break;
  }
  console.log(`About to exit with code: ${code}`);
});

const args = process.argv.slice(2);
const userArg = _.find(args, (o) => /^--user=\w+/.test(o));
if (!userArg) process.exit(1);
const userName = userArg.split('=')[1];
if (!userName) process.exit(2);

const baseAlbumPath = path.resolve(__dirname, `./albums/${userName}`);
if (!fs.existsSync(baseAlbumPath)) mkdirp.sync(baseAlbumPath);

const tempConfig = path.resolve(__dirname, `./tempConfig`);
if (!fs.existsSync(tempConfig)) mkdirp.sync(tempConfig);

(async function () {
  const albumInfoFile = `${tempConfig}/${userName}AlbumInfo.json`;
  const backupCountFile = `${tempConfig}/${userName}FinishCount.txt`;
  let albumInfos;
  if (!fs.existsSync(albumInfoFile)) {
    try {
      albumInfos = await getAlbums(`http://${userName}.tian.yam.com`);
    }
    catch (e) {
      process.exit(3);
    }
    fs.writeFileSync(albumInfoFile, JSON.stringify(albumInfos), 'utf8');
  } else {
    albumInfos = JSON.parse(fs.readFileSync(albumInfoFile, 'utf8'));
  }
  const albumNumber = albumInfos.length;
  console.info(`讀取到 ${albumNumber} 本相簿，開始備份照片!`);
  let finishCount = 0;
  if (fs.existsSync(backupCountFile)) {
    finishCount = Number(fs.readFileSync(backupCountFile, 'utf8'));
  }
  let i = finishCount;
  try {
    for (; i < albumNumber; i++) {
      await savePhotos(albumInfos[i], baseAlbumPath);
      console.info(`已備份完成 ${i + 1} 本相簿`);
      fs.writeFileSync(`${tempConfig}/${userName}FinishCount.txt`, (i + 1).toString(), 'utf8');
    }
  }
  catch (e) {
    process.exit(4);
  }
}());
