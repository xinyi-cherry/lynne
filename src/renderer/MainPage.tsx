import React from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Layout,
  Row,
  Space,
  Switch,
  Tooltip,
} from 'antd';
import {
  PlayCircleOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  CaretRightOutlined,
  PauseOutlined,
  MinusCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

import album from '../../assets/musicdemo.jpg';

const { Header, Content, Footer } = Layout;
const { Search } = Input;

type songType = {
  singer: any;
  id: string;
  songname: string;
  albumid: number;
};

type songResultType = {
  curnum: number;
  list: songType[];
};

interface SongItemProps {
  data: songType;
}

// eslint-disable-next-line react/function-component-definition
const SongItem = ({ data }: SongItemProps) => {
  const onPlay = () => {
    if (data.albumid === 0) {
      data.albumid = -1;
    }
    window.electron.ipcRenderer.changeSong(data);
  };
  return (
    <>
      <Space split="-">
        <span style={{ fontWeight: 'bold' }}>{data.songname}</span>
        <span style={{ color: 'gray' }}>
          {data.singer.map((item: { name: any }) => item.name).join('/')}
        </span>
      </Space>
      <Tooltip title="播放">
        <Button
          size="small"
          shape="circle"
          type="link"
          icon={<PlayCircleOutlined />}
          onClick={onPlay}
        />
      </Tooltip>
    </>
  );
};

// eslint-disable-next-line react/function-component-definition
const MainPage: React.FC = () => {
  const [haveResult, setHaveResult] = React.useState(false);
  const [songResult, setSongResult] = React.useState<songResultType>({
    curnum: 0,
    list: [],
  });
  const onSyncChange = (checked: boolean) => {
    window.electron.ipcRenderer.changeSync(checked);
  };
  const onSearch = async (song: string) => {
    const response = await fetch(
      `https://bemfa.kanosaikou.cn/song?name=${song}`,
    );
    const result = await response.json();
    if (result.success) {
      setHaveResult(true);
      setSongResult(result.data.data.song);
    } else {
      setHaveResult(false);
    }
  };
  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          WebkitAppRegion: 'drag',
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          marginBottom: '10px',
          width: '100%',
        }}
      >
        <Row
          align="middle"
          justify="center"
          gutter={8}
          style={{ width: '100%' }}
        >
          <Col
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              width="50"
              alt="album"
              src={album}
              style={{
                borderRadius: '5px',
                margin: 'auto',
              }}
            />
          </Col>
          <Col flex="auto" style={{ fontWeight: 'bold', fontSize: '18px' }}>
            玲奈的歌曲显示机~
          </Col>
          <Col>
            <Button
              style={{ WebkitAppRegion: 'no-drag' }}
              onClick={() => window.electron.ipcRenderer.minus()}
              icon={<MinusCircleOutlined />}
              shape="circle"
            />
          </Col>
          <Col>
            <Button
              style={{ WebkitAppRegion: 'no-drag' }}
              onClick={() => window.electron.ipcRenderer.close()}
              icon={<CloseCircleOutlined />}
              shape="circle"
              danger
            />
          </Col>
        </Row>
      </Header>
      <Content style={{ margin: '0 50px', overflow: 'auto' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card title="搜索歌曲" bordered={false} style={{ width: '100%' }}>
            <Search placeholder="歌曲名称" onSearch={onSearch} enterButton />
          </Card>
          {haveResult && (
            <Card title="搜索结果" bordered={false} style={{ width: '100%' }}>
              <Space
                direction="vertical"
                style={{ width: '100%' }}
                split={
                  <Divider type="horizontal" style={{ margin: '4px 0' }} />
                }
              >
                {songResult.curnum === 0
                  ? '没有结果捏'
                  : songResult.list.map((song, index) => {
                      return (
                        <SongItem
                          // eslint-disable-next-line react/no-array-index-key
                          key={`${song.songname}-${index}`}
                          data={song}
                        />
                      );
                    })}
              </Space>
            </Card>
          )}
        </Space>
      </Content>
      <Footer>
        <Card title="控制面板" bordered={false} style={{ width: '100%' }}>
          <Space wrap>
            <Button
              onClick={() =>
                window.electron.ipcRenderer.changeSong({ albumid: 0 })
              }
            >
              清空当前歌曲
            </Button>
            <Button
              onClick={() => window.electron.ipcRenderer.slowDown()}
              icon={<DoubleLeftOutlined />}
            >
              减慢0.5秒
            </Button>
            <Button
              onClick={() => window.electron.ipcRenderer.speedUp()}
              icon={<DoubleRightOutlined />}
            >
              加快0.5秒
            </Button>
            <Button
              onClick={() => window.electron.ipcRenderer.play()}
              icon={<CaretRightOutlined />}
            >
              播放
            </Button>
            <Button
              onClick={() => window.electron.ipcRenderer.pause()}
              icon={<PauseOutlined />}
            >
              暂停
            </Button>
          </Space>
          <Divider />
          <Space direction="vertical">
            <Space wrap style={{ width: '100%' }}>
              <Switch onChange={onSyncChange} defaultChecked />
              实验性功能：自动同步播放进度
            </Space>
          </Space>
        </Card>
      </Footer>
    </Layout>
  );
};

export default MainPage;
