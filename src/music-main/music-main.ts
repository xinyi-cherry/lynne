/* eslint global-require: off, no-console: off, promise/always-return: off, import/prefer-default-export: off */

import path from 'path';
import { app, BrowserWindow, Menu, shell } from 'electron';
import cp from 'child_process';
import { resolveHtmlPath } from '../main/util';

// const fs = require('fs');

let settingsWindow: BrowserWindow | null = null;
let doSync = true;
let lastQQMusic = -1;
let lastKgMusic = -1;
let lastQQSong = -1;
let isKg = false;

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

export const changeSync = (flag: boolean) => {
  doSync = flag;
};

export const changeSong = (songid: string) => {
  settingsWindow?.webContents.send('change-song', songid);
};

export const syncSong = (songMs: number) => {
  settingsWindow?.webContents.send('sync-song', songMs);
};

export const sendControl = (control: string) => {
  settingsWindow?.webContents.send('control', control);
};

export const closeMusic = () => {
  settingsWindow?.close();
};

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

export const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  // const MAIN_PATH = app.isPackaged
  //   ? path.join(process.resourcesPath, '..')
  //   : path.join(__dirname, '../..');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };
  // const qqPath = path.join(MAIN_PATH, `qq_time.txt`);
  // const kgPath = path.join(MAIN_PATH, `kg_time.txt`);
  setInterval(() => {
    // fs.readFile(qqPath, 'utf8', function (err: any, dataStr: string) {
    //   const nowMs = parseInt(dataStr, 10);
    //   if (Number.isNaN(nowMs)) {
    //     return;
    //   }
    //   if (nowMs === -1 || nowMs === lastQQMusic) {
    //     lastQQMusic = nowMs;
    //   } else {
    //     lastQQMusic = nowMs;
    //     if (doSync) {
    //       syncSong(nowMs);
    //     }
    //   }
    // });
    // fs.readFile(kgPath, 'utf8', function (err: any, dataStr: string) {
    //   const nowMs = parseInt(dataStr, 10);
    //   if (Number.isNaN(nowMs)) {
    //     return;
    //   }
    //   if (nowMs === -1 || nowMs === lastKgMusic) {
    //     lastKgMusic = nowMs;
    //   } else {
    //     lastKgMusic = nowMs;
    //     if (doSync) {
    //       syncSong(nowMs);
    //     }
    //   }
    // });
    const qqmusic = cp.spawn(getAssetPath(`qq_time.exe`));
    qqmusic.stdout.on('data', (data) => {
      const nowMs = parseInt(data.toString(), 10);
      if (nowMs === -1 || nowMs === lastQQMusic) {
        lastQQMusic = nowMs;
      } else {
        lastQQMusic = nowMs;
        if (doSync) {
          isKg = false;
          syncSong(nowMs);
        }
      }
    });
    const kgmusic = cp.spawn(getAssetPath(`kg_time.exe`));
    kgmusic.stdout.on('data', (data) => {
      const nowMs = parseInt(data.toString(), 10);
      if (nowMs === -1 || nowMs === lastKgMusic) {
        lastKgMusic = nowMs;
      } else {
        lastKgMusic = nowMs;
        if (doSync) {
          isKg = true;
          syncSong(nowMs);
        }
      }
    });
    const qqsong = cp.spawn(getAssetPath(`qq_song.exe`));
    qqsong.stdout.on('data', async (data) => {
      const nowSong = parseInt(data.toString(), 10);
      if (nowSong !== -1 && nowSong !== lastQQSong && !isKg) {
        lastQQSong = nowSong;
        settingsWindow?.webContents.send('sync-songid', nowSong);
        const res = await (
          await fetch(
            `https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songid=${nowSong}&tpl=yqq_song_detail&format=json&callback=getOneSongInfoCallback`,
          )
        ).json();
        const payload = {
          albumid: res.data[0].album.id === 0 ? -1 : res.data[0].album.id,
          interval: res.data[0].interval,
          songmid: res.data[0].mid,
          songname: res.data[0].name,
        };
        settingsWindow?.webContents.send('change-song', payload);
      }
    });
  }, 2000);

  settingsWindow = new BrowserWindow({
    show: false,
    titleBarStyle: 'hidden',
    width: 360,
    height: 100,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      backgroundThrottling: false,
    },
  });

  settingsWindow.loadURL(resolveHtmlPath('music.html'));

  settingsWindow.on('ready-to-show', () => {
    if (!settingsWindow) {
      throw new Error('"settingsWindow" is not defined');
    }

    settingsWindow.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  Menu.setApplicationMenu(null);
  // Open urls in the user's browser
  settingsWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};
