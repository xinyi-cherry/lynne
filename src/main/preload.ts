// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'ipc-example'
  | 'change-song'
  | 'change-offset'
  | 'search-song'
  | 'play'
  | 'pause'
  | 'speed-up'
  | 'slow-down'
  | 'qqmusic'
  | 'kgmusic'
  | 'sync-song'
  | 'control';

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
    changeOffset(offset: any) {
      ipcRenderer.send('change-offset', offset);
    },
    speedUp() {
      ipcRenderer.send('control', 'speed-up');
    },
    slowDown() {
      ipcRenderer.send('control', 'slow-down');
    },
    play() {
      ipcRenderer.send('control', 'play');
    },
    pause() {
      ipcRenderer.send('control', 'pause');
    },
    close() {
      ipcRenderer.send('window', 'close');
    },
    minus() {
      ipcRenderer.send('window', 'minus');
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
