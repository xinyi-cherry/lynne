import { createRoot } from 'react-dom/client';
import { Flex, Row, Col, Progress } from 'antd';
import './App.css';
import React from 'react';
import { parse } from 'clrc';
import cd from '../../assets/cd.png';
import album from '../../assets/musicdemo.jpg';

// 奇技淫巧，但是管用（x咱也不知道，咱也不敢问
let playSubscribe: Function = () => '';
let pauseSubscribe: Function = () => '';
let speedUpSubscribe: Function = () => '';
let slowDownSubscribe: Function = () => '';
let syncSong: Function = () => '';

const useInterval = (cb: Function, time = 1000) => {
  const cbRef = React.useRef<Function>();
  React.useEffect(() => {
    cbRef.current = cb;
  });
  React.useEffect(() => {
    const callback = () => {
      cbRef.current?.();
    };
    const timer = setInterval(() => {
      callback();
    }, time);
    return () => clearInterval(timer);
  }, []);
};

function App() {
  const [albumId, setAlbumId] = React.useState(0);
  const [songData, setSongData] = React.useState();
  const [nowPlayTime, setNowPlayTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [lyric, setLyric] = React.useState();
  const [nowLyric, setNowLyric] = React.useState();
  const parseTime = (time: number) => {
    const minute = Math.floor(time / 60);
    const second = time % 60;
    if (second < 10) {
      return `${minute}:0${second}`;
    }
    return `${minute}:${second}`;
  };
  React.useEffect(() => {
    window.electron.ipcRenderer.on('change-song', async (arg: any) => {
      setAlbumId(arg.albumid);
      setSongData(arg);
      if (arg.albumid === 0) {
        setPlaying(false);
        setNowPlayTime(0);
      } else {
        const lrcResponse = await fetch(
          `https://bemfa.kanosaikou.cn/lyric?songmid=${arg.songmid}`,
        );
        const lrcData = await lrcResponse.json();
        const parseData = parse(lrcData.data.lyric.replace(/\r\n/g, '\n'));
        const lyrics = parseData.filter(
          (item) => item.type === 'lyric' && item.content !== '',
        );
        setLyric(lyrics);
        setPlaying(true);
        setNowPlayTime(500);
      }
    });
  }, []);
  React.useEffect(() => {
    playSubscribe();
    playSubscribe = window.electron.ipcRenderer.on('play', async () => {
      if (albumId !== 0) {
        setPlaying(true);
      }
    });
    pauseSubscribe();
    pauseSubscribe = window.electron.ipcRenderer.on('pause', async () => {
      setPlaying(false);
    });
    speedUpSubscribe();
    speedUpSubscribe = window.electron.ipcRenderer.on('speed-up', async () => {
      if (albumId !== 0) {
        setNowPlayTime(nowPlayTime + 500);
      }
    });
    slowDownSubscribe();
    slowDownSubscribe = window.electron.ipcRenderer.on(
      'slow-down',
      async () => {
        if (albumId !== 0) {
          if (nowPlayTime >= 500) {
            setNowPlayTime(nowPlayTime - 500);
          } else {
            setNowPlayTime(0);
          }
        }
      },
    );
    syncSong();
    syncSong = window.electron.ipcRenderer.on('sync-song', async (arg: any) => {
      setNowPlayTime(arg);
    });
  }, [albumId, nowPlayTime]);
  useInterval(() => {
    if (playing) {
      if (Math.floor(nowPlayTime / 1000) === songData.interval) {
        setPlaying(false);
        return;
      }
      const nowLrc = lyric.filter(
        (item: { startMillisecond: number }) =>
          nowPlayTime >= item.startMillisecond,
      );
      if (nowLrc.length !== 0) {
        setNowLyric(nowLrc[nowLrc.length - 1].content);
      } else {
        setNowLyric('没有找到歌词喔');
      }
      setNowPlayTime(nowPlayTime + 10);
    }
  }, 10);
  return (
    <Row
      style={{
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        width: '100vw',
        height: '100vh',
      }}
      align="middle"
      justify="center"
      wrap={false}
    >
      <Col style={{ width: '90px', position: 'relative' }}>
        <img width="80" alt="icon" src={cd} style={{ marginLeft: 10 }} />
        <img
          className="content-play-cover"
          width="50"
          alt="album"
          src={
            albumId !== 0 && albumId !== -1
              ? `http://imgcache.qq.com/music/photo/album_300/76/300_albumpic_${albumId}_0.jpg`
              : album
          }
          style={{
            position: 'absolute',
            top: 15,
            left: 25,
            borderRadius: '100%',
          }}
        />
      </Col>
      <Col flex="auto" style={{ height: '100%', marginRight: 10 }}>
        <Flex
          vertical
          justify="center"
          align="center"
          style={{ height: '100%', width: '100%' }}
          gap={3}
        >
          <div
            className="marquee"
            style={{ fontSize: '16px', fontWeight: 'bold' }}
          >
            <div className="marquee-wrap">
              <div className="marquee-content ">
                {albumId !== 0 ? `${songData.songname}` : '还没有歌捏'}
              </div>
            </div>
          </div>
          <Row style={{ width: '100%' }} gutter={2}>
            <Col flex="40px" style={{ textAlign: 'center' }}>
              {albumId !== 0
                ? parseTime(Math.floor(nowPlayTime / 1000))
                : '0:00'}
            </Col>
            <Col flex="auto" style={{ bottom: '2px' }}>
              <Progress
                percent={
                  albumId !== 0 ? nowPlayTime / songData.interval / 10 : '0'
                }
                size="small"
                status="active"
                showInfo={false}
              />
            </Col>
            <Col flex="40px" style={{ textAlign: 'center' }}>
              {albumId !== 0 ? parseTime(songData.interval) : '0:00'}
            </Col>
          </Row>
          <div className="marquee" style={{ fontSize: '14px' }}>
            <div className="marquee-wrap">
              <div className="marquee-content ">
                {albumId !== 0 ? nowLyric : ''}
              </div>
            </div>
          </div>
        </Flex>
      </Col>
    </Row>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
