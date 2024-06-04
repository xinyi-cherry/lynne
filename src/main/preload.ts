// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'ipc-example'
  | 'change-song'
  | 'search-song'
  | 'play'
  | 'pause'
  | 'speed-up'
  | 'slow-down'
  | 'qqmusic'
  | 'kgmusic'
  | 'sync-song';

const electronHandler = {
  ipcRenderer: {
    openSettingsWindow() {
      ipcRenderer.send('open-music-window');
    },
    changeSync(toggle: any) {
      ipcRenderer.send('change-sync', toggle);
    },
    changeSong(songid: any) {
      ipcRenderer.send('change-song', songid);
    },
    speedUp() {
      ipcRenderer.send('speed-up');
    },
    slowDown() {
      ipcRenderer.send('slow-down');
    },
    play() {
      ipcRenderer.send('play');
    },
    pause() {
      ipcRenderer.send('pause');
    },
    close() {
      ipcRenderer.send('close');
    },
    minus() {
      ipcRenderer.send('minus');
    },
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
