/* eslint global-require: off, no-console: off, promise/always-return: off, import/prefer-default-export: off */

import path from 'path';
import { app, BrowserWindow, shell } from 'electron';
import { resolveHtmlPath } from '../main/util';

let settingsWindow: BrowserWindow | null = null;
const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

export const changeSong = (songid: string) => {
  settingsWindow?.webContents.send('change-song', songid);
};

export const syncSong = (songMs: number) => {
  settingsWindow?.webContents.send('sync-song', songMs);
};

export const musicPlay = () => {
  settingsWindow?.webContents.send('play');
};

export const musicPause = () => {
  settingsWindow?.webContents.send('pause');
};

export const speedUp = () => {
  settingsWindow?.webContents.send('speed-up');
};

export const slowDown = () => {
  settingsWindow?.webContents.send('slow-down');
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

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

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

  // Open urls in the user's browser
  settingsWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};
