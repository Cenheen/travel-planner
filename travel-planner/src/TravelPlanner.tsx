import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Checkbox, Radio, Button, Card, Typography, Space, ConfigProvider, theme, Modal, message, Drawer, List, Popconfirm, Tabs } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { GlobalOutlined, RocketOutlined, ScheduleOutlined, KeyOutlined, PictureOutlined, SaveOutlined, HistoryOutlined, DeleteOutlined, UserOutlined, LockOutlined, LogoutOutlined } from '@ant-design/icons';
import './TravelPlanner.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface TravelFormValues {
  destination: string;
  dates: [Dayjs, Dayjs];
  includes: string[];
  detailLevel: 'detailed' | 'rough';
  openaiApiKey?: string;
  unsplashAccessKey?: string;
}

const TravelPlanner: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  
  // Modals state
  const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  
  // User state
  const [user, setUser] = useState<{email: string, token: string} | null>(null);
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  
  const [pendingValues, setPendingValues] = useState<TravelFormValues | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2021&q=80');

  // Amap State
  const [placeSearchVisible, setPlaceSearchVisible] = useState(false);
  const [placeKeyword, setPlaceKeyword] = useState('');
  const [placeResult, setPlaceResult] = useState<any>(null);

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user_auth');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch trips when user logs in or history opens
  useEffect(() => {
    if (user && isHistoryVisible) {
      fetchSavedTrips();
    }
  }, [user, isHistoryVisible]);

  const fetchSavedTrips = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/trips', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedTrips(data.trips);
      } else {
        if (response.status === 403 || response.status === 401) {
          handleLogout();
        }
      }
    } catch (error) {
      console.error('Failed to fetch trips', error);
    }
  };

  const handleLogin = async (values: any, isRegister: boolean) => {
    const endpoint = isRegister ? '/api/register' : '/api/login';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const userData = { email: data.user.email, token: data.token };
        setUser(userData);
        localStorage.setItem('user_auth', JSON.stringify(userData));
        setIsLoginModalVisible(false);
        message.success(isRegister ? '注册成功！已自动登录' : '登录成功！');
      } else {
        message.error(data.error || '操作失败');
      }
    } catch (e) {
      message.error('网络错误，请重试');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user_auth');
    setSavedTrips([]);
    message.info('已退出登录');
  };

  const fetchDestinationImage = async (destination: string, accessKey: string) => {
    try {
      const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination)}&client_id=${accessKey}&per_page=1&orientation=landscape`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const imageUrl = data.results[0].urls.regular;
        setBackgroundImage(imageUrl);
      }
    } catch (error) {
      console.error('Failed to fetch Unsplash image', error);
    }
  };

  const handleGenerate = async (values: TravelFormValues, openaiKey: string, unsplashKey?: string) => {
    setLoading(true);
    setResult(null);

    if (unsplashKey) {
      fetchDestinationImage(values.destination, unsplashKey);
    }

    try {
      const detailLevelMap = {
        detailed: '详细的 (detailed)',
        rough: '粗略的 (rough/flexible)'
      };

      const includesMap: Record<string, string> = {
        flight: '机票建议',
        hotel: '酒店推荐',
        attractions: '必游景点',
        restaurant: '当地美食'
      };

      const selectedIncludes = values.includes.map(k => includesMap[k] || k).join(', ');

      const prompt = `
        请为我生成一份去 ${values.destination} 的旅行计划。
        时间范围：${values.dates[0].format('YYYY-MM-DD')} 到 ${values.dates[1].format('YYYY-MM-DD')}。
        规划风格：${detailLevelMap[values.detailLevel]}。
        请包含以下方面：${selectedIncludes}。
        
        输出必须是有效的 JSON 格式，且所有文本内容必须使用简体中文 (Simplified Chinese)。结构如下：
        {
          "destination": "城市, 国家",
          "summary": "一段关于这次旅行风格的简要概述",
          "daily_itinerary": [
            {
              "day": 1,
              "date": "YYYY-MM-DD",
              "theme": "当日主题 (例如：抵达与探索)",
              "activities": [
                {"time": "10:00", "activity": "活动描述", "location": "地点名称"}
              ]
            }
          ],
          "tips": ["贴士 1", "贴士 2"]
        }
        请不要包含任何 markdown 格式 (如 \`\`\`json)，只返回纯 JSON 字符串。
      `;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: openaiKey, prompt })
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const data = await response.json();
      const content = data.content;

      if (content) {
        try {
          const parsedResult = JSON.parse(content);
          setResult(parsedResult);
          message.success('行程生成成功！');
          
          setTimeout(() => {
            const resultElement = document.getElementById('itinerary-result');
            if (resultElement) {
              resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        } catch (e) {
          console.error('JSON Parse Error', e);
          message.error('解析 AI 响应失败，请重试。');
        }
      }
    } catch (error: any) {
      console.error('API Error', error);
      message.error(`API 错误: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = (values: TravelFormValues) => {
    const storedApiKey = localStorage.getItem('dashscope_api_key');
    const storedUnsplashKey = localStorage.getItem('unsplash_access_key');

    if (storedApiKey) {
      handleGenerate(values, storedApiKey, storedUnsplashKey || undefined);
    } else {
      setPendingValues(values);
      setIsApiKeyModalVisible(true);
    }
  };

  const handleApiKeySubmit = (values: { openaiApiKey: string; unsplashAccessKey?: string }) => {
    localStorage.setItem('dashscope_api_key', values.openaiApiKey);
    if (values.unsplashAccessKey) {
      localStorage.setItem('unsplash_access_key', values.unsplashAccessKey);
    }
    
    setIsApiKeyModalVisible(false);
    if (pendingValues) {
      handleGenerate(pendingValues, values.openaiApiKey, values.unsplashAccessKey);
    }
  };

  const handleSave = async () => {
    if (!user) {
      message.warning('请先登录后再保存行程');
      setIsLoginModalVisible(true);
      return;
    }

    if (result) {
      try {
        const response = await fetch('/api/trips', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            destination: result.destination,
            summary: result.summary,
            full_json: result
          })
        });

        if (response.ok) {
          message.success('行程已保存到云端数据库！');
        } else {
          message.error('保存失败');
        }
      } catch (e) {
        console.error(e);
        message.error('保存错误');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`/api/trips/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      message.success('已删除行程记录');
      fetchSavedTrips();
    } catch (e) {
      console.error(e);
      message.error('删除失败');
    }
  };

  const handleViewHistory = (item: any) => {
    setResult(item.full_json);
    setIsHistoryVisible(false);
    setTimeout(() => {
      const resultElement = document.getElementById('itinerary-result');
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSearchPlace = async () => {
    if (!placeKeyword) {
      message.warning('请输入地点名称');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/place?keyword=${encodeURIComponent(placeKeyword)}`);
      if (response.ok) {
        const data = await response.json();
        setPlaceResult(data);
      } else {
        const error = await response.json();
        message.error(error.error || '未找到该地点信息');
        setPlaceResult(null);
      }
    } catch (error) {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1b4a4e', // Deep Teal
          borderRadius: 8,
          fontFamily: "'Playfair Display', 'Songti SC', 'SimSun', serif, system-ui",
          colorBgContainer: 'rgba(255, 255, 255, 0.9)',
        },
        components: {
          Button: {
            colorPrimary: '#1b4a4e',
            algorithm: true,
            fontWeight: 600,
          },
          Card: {
            headerBg: 'transparent',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          }
        }
      }}
    >
      <div 
        className="travel-planner-container"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      >
        <div className="glass-panel">
          <div className="header-section" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', right: 0, top: 0 }}>
              {user ? (
                <Space>
                  <Button 
                    type="text" 
                    icon={<HistoryOutlined />} 
                    onClick={() => setIsHistoryVisible(true)}
                    style={{ color: '#1b4a4e' }}
                  >
                    我的行程
                  </Button>
                  <Button 
                    type="text" 
                    icon={<LogoutOutlined />} 
                    onClick={handleLogout}
                    style={{ color: '#1b4a4e' }}
                  >
                    退出
                  </Button>
                </Space>
              ) : (
                <Button 
                  type="primary" 
                  icon={<UserOutlined />} 
                  onClick={() => setIsLoginModalVisible(true)}
                >
                  登录 / 注册
                </Button>
              )}
            </div>
            <GlobalOutlined style={{ fontSize: 48, color: '#1b4a4e', marginBottom: 16 }} />
            <Title level={1} style={{ margin: 0, color: '#1b4a4e', fontWeight: 300, letterSpacing: '2px' }}>
              奢华 · 旅程
            </Title>
            <Text type="secondary" style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: 12 }}>
              AI 智能旅行管家
            </Text>
          </div>

          <Card variant="borderless" className="form-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              initialValues={{
                includes: ['flight', 'hotel'],
                detailLevel: 'detailed',
              }}
              size="large"
            >
              <Form.Item
                name="destination"
                label={<span className="form-label">目的地</span>}
                rules={[{ required: true, message: '请输入您想去的地方' }]}
              >
                <Input prefix={<RocketOutlined style={{ color: '#bfbfbf' }} />} placeholder="巴黎, 马尔代夫, 京都..." />
              </Form.Item>

              <Form.Item
                name="dates"
                label={<span className="form-label">出行日期</span>}
                rules={[{ required: true, message: '请选择出行日期' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }} 
                  format="YYYY-MM-DD"
                  placeholder={['开始日期', '结束日期']}
                />
              </Form.Item>

              <Form.Item
                name="includes"
                label={<span className="form-label">包含服务</span>}
              >
                <Checkbox.Group className="custom-checkbox-group">
                  <Space wrap>
                    <Checkbox value="flight">机票</Checkbox>
                    <Checkbox value="hotel">酒店</Checkbox>
                    <Checkbox value="attractions">景点</Checkbox>
                    <Checkbox value="restaurant">餐饮</Checkbox>
                  </Space>
                </Checkbox.Group>
              </Form.Item>

              <Form.Item
                name="detailLevel"
                label={<span className="form-label">规划风格</span>}
                rules={[{ required: true, message: '请选择规划风格' }]}
              >
                <Radio.Group className="style-radio-group">
                  <Radio.Button value="detailed">
                    <ScheduleOutlined /> 深度游
                  </Radio.Button>
                  <Radio.Button value="rough">
                    <GlobalOutlined /> 随性游
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item style={{ marginTop: 32 }}>
                <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ height: 50, fontSize: 16 }}>
                  生成定制行程
                </Button>
              </Form.Item>
              
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <Space>
                  <Button type="link" size="small" icon={<PictureOutlined />} onClick={() => setPlaceSearchVisible(true)}>
                    查评分
                  </Button>
                  <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => setIsApiKeyModalVisible(true)}>
                    配置 API 密钥
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>

        {result && (
          <div id="itinerary-result" className="result-panel glass-panel" style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={3} style={{ color: '#1b4a4e', margin: 0 }}>{result.destination}</Title>
              <Space>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={handleSave}
                  style={{ backgroundColor: '#1b4a4e' }}
                >
                  保存行程
                </Button>
              </Space>
            </div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{result.summary}</Text>
            
            <div className="itinerary-timeline">
              {result.daily_itinerary?.map((day: any, index: number) => (
                <div key={index} className="day-card">
                  <div className="day-header">
                    <Text strong style={{ fontSize: 16, color: '#1b4a4e' }}>第 {day.day} 天</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{day.date}</Text>
                  </div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>{day.theme}</Text>
                  <ul className="activity-list">
                    {day.activities?.map((act: any, idx: number) => (
                      <li key={idx}>
                        <Text strong>{act.time}</Text> - {act.activity} <Text type="secondary">@{act.location}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {result.tips && (
              <div className="tips-section" style={{ marginTop: 20, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <Text strong>旅行贴士:</Text>
                <ul>
                  {result.tips.map((tip: string, idx: number) => <li key={idx}>{tip}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <Modal
          title="配置 API Key"
          open={isApiKeyModalVisible}
          onCancel={() => setIsApiKeyModalVisible(false)}
          footer={null}
        >
          <Form onFinish={handleApiKeySubmit} layout="vertical">
            <Form.Item
              name="openaiApiKey"
              label="阿里云 DashScope API Key"
              rules={[{ required: true, message: '请输入 API Key' }]}
            >
              <Input.Password prefix={<KeyOutlined />} placeholder="sk-..." />
            </Form.Item>
            
            <Form.Item
              name="unsplashAccessKey"
              label="Unsplash Access Key (可选)"
            >
              <Input.Password prefix={<PictureOutlined />} placeholder="Unsplash Access Key" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                保存并继续
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Login / Register Modal */}
        <Modal
          open={isLoginModalVisible}
          onCancel={() => setIsLoginModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          <Tabs
            defaultActiveKey="login"
            items={[
              {
                key: 'login',
                label: '登录',
                children: (
                  <Form onFinish={(v) => handleLogin(v, false)} layout="vertical">
                    <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
                      <Input prefix={<UserOutlined />} placeholder="邮箱" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>登录</Button>
                  </Form>
                )
              },
              {
                key: 'register',
                label: '注册',
                children: (
                  <Form onFinish={(v) => handleLogin(v, true)} layout="vertical">
                    <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
                      <Input prefix={<UserOutlined />} placeholder="邮箱" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>注册并登录</Button>
                  </Form>
                )
              }
            ]}
          />
        </Modal>

        {/* Place Search Modal */}
        <Modal
          title="地点评分查询 (基于高德地图)"
          open={placeSearchVisible}
          onCancel={() => {
            setPlaceSearchVisible(false);
            setPlaceResult(null);
            setPlaceKeyword('');
          }}
          footer={null}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Input 
              placeholder="输入地点名称 (如: 故宫)" 
              value={placeKeyword}
              onChange={e => setPlaceKeyword(e.target.value)}
              onPressEnter={handleSearchPlace}
            />
            <Button type="primary" onClick={handleSearchPlace} loading={loading}>查询</Button>
          </div>

          {placeResult && (
            <Card size="small" title={placeResult.name}>
               <p><strong>评分:</strong> <span style={{ color: '#faad14', fontSize: '1.2em' }}>{placeResult.rating}</span> / 5.0</p>
               <p><strong>类型:</strong> {placeResult.type}</p>
               <p><strong>地址:</strong> {placeResult.address}</p>
               {placeResult.photos && placeResult.photos.length > 0 && (
                 <div style={{ marginTop: 10 }}>
                   <img 
                     src={placeResult.photos[0].url} 
                     alt={placeResult.name} 
                     style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} 
                   />
                 </div>
               )}
            </Card>
          )}
          <div style={{ marginTop: 16, fontSize: '12px', color: '#999' }}>
            注: 需要在服务器 .env 文件中配置 AMAP_KEY 才能正常使用。
          </div>
        </Modal>

        <Drawer
          title="我的行程历史"
          placement="right"
          onClose={() => setIsHistoryVisible(false)}
          open={isHistoryVisible}
          width={400}
        >
          <List
            itemLayout="horizontal"
            dataSource={savedTrips}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Popconfirm
                    title="确定删除这条记录吗？"
                    onConfirm={() => handleDelete(item.id)}
                    okText="是"
                    cancelText="否"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={<a onClick={() => handleViewHistory(item)}>{item.destination}</a>}
                  description={
                    <div>
                      <div>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                      <div style={{ fontSize: 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {item.summary}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无保存的行程' }}
          />
        </Drawer>
      </div>
    </ConfigProvider>
  );
};

export default TravelPlanner;
