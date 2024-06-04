/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import cp from 'child_process';
import { resolveHtmlPath } from './util';
import {
  changeSong,
  closeMusic,
  createWindow as createMusicWindow,
  musicPause,
  musicPlay,
  slowDown,
  speedUp,
  syncSong,
} from '../music-main/music-main';

let mainWindow: BrowserWindow | null = null;
let doSync = false;
let lastQQMusic = -1;
let lastKgMusic = -1;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('change-song', async (event, arg) => {
  changeSong(arg);
});

ipcMain.on('change-sync', async (event, arg) => {
  doSync = arg;
});

ipcMain.on('open-music-window', async () => {
  createMusicWindow();
});

ipcMain.on('play', async () => {
  musicPlay();
});

ipcMain.on('pause', async () => {
  musicPause();
});

ipcMain.on('speed-up', async () => {
  speedUp();
});

ipcMain.on('slow-down', async () => {
  slowDown();
});

ipcMain.on('close', async () => {
  mainWindow?.close();
  closeMusic();
});

ipcMain.on('minus', async () => {
  mainWindow?.minimize();
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

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

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  setInterval(() => {
    const qqmusic = cp.spawn(getAssetPath(`qqmusic_hack/qqmusic_hack.exe`));
    qqmusic.stdout.on('data', (data) => {
      const nowMs = parseInt(data.toString(), 10);
      if (nowMs === -1 || nowMs === lastQQMusic) {
        lastQQMusic = nowMs;
      } else {
        lastQQMusic = nowMs;
        if (doSync) {
          syncSong(nowMs);
        }
      }
      mainWindow?.webContents.send('qqmusic', `${data}`);
    });
    const kgmusic = cp.spawn(getAssetPath(`kg_hack/kg_hack.exe`));
    kgmusic.stdout.on('data', (data) => {
      const nowMs = Math.floor(parseFloat(data.toString()) * 1000);
      if (nowMs === -1000 || nowMs === lastKgMusic) {
        lastKgMusic = nowMs;
      } else {
        lastKgMusic = nowMs;
        if (doSync) {
          syncSong(nowMs);
        }
      }
      mainWindow?.webContents.send('kgmusic', `${data}`);
    });
  }, 1000);

  mainWindow = new BrowserWindow({
    show: false,
    titleBarStyle: 'hidden',
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      backgroundThrottling: false,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('main.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  createMusicWindow();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
