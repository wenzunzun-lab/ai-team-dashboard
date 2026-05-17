const express = require('express');
const cors = require('cors');
const app = express();

// 加载环境变量
require('dotenv').config();

const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ==================== API Key 配置 ====================
const API_KEYS = {
  deepseek: process.env.DEEPSEEK_API_KEY || '',
  qwen: process.env.QWEN_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  claude: process.env.CLAUDE_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY || ''
};

const API_ENDPOINTS = {
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    parse: (data) => data.choices?.[0]?.message?.content || '（无响应）'
  },
  qwen: {
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    parse: (data) => data.choices?.[0]?.message?.content || '（无响应）'
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    parse: (data) => data.choices?.[0]?.message?.content || '（无响应）'
  },
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }),
    body: (messages) => ({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages
    }),
    parse: (data) => data.content?.[0]?.text || '（无响应）'
  },
  gemini: {
    url: (key) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${key}`,
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (messages) => ({
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    }),
    parse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || '（无响应）'
  }
};

// ==================== POST /api/chat ====================
app.post('/api/chat', async (req, res) => {
  try {
    const { model, messages } = req.body;

    if (!model || !messages) {
      return res.status(400).json({ error: '缺少参数：model 和 messages 为必填' });
    }

    // 本地模拟
    if (model === 'local') {
      await sleep(1500 + Math.random() * 1500);
      return res.json({
        content: `[本地模拟响应]\n\n收到消息：${JSON.stringify(messages.slice(-1)[0]?.content || '').substring(0, 100)}...\n\n（这是模拟输出，请配置真实API Key以获取有效响应）`
      });
    }

    const config = API_ENDPOINTS[model];
    if (!config) {
      return res.status(400).json({ error: `不支持的大模型：${model}` });
    }

    const apiKey = API_KEYS[model];
    if (!apiKey) {
      return res.status(400).json({
        error: `${model} 的API Key未配置`,
        hint: '请联系管理员在 .env 文件中配置 API Key'
      });
    }

    // 构建请求
    const url = typeof config.url === 'function' ? config.url(apiKey) : config.url;
    const headers = config.headers(apiKey);
    const body = config.body ? config.body(messages) : {
      model: model === 'deepseek' ? 'deepseek-chat' :
             model === 'qwen' ? 'qwen-turbo' :
             model === 'openai' ? 'gpt-4o' : 'gpt-4o',
      messages,
      max_tokens: 4096
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败 (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = config.parse(data);

    res.json({ content });

  } catch (err) {
    console.error('Chat error:', err.message);
    // 降级到模拟
    await sleep(1000);
    res.json({
      content: `[${req.body.model} 调用失败 - 已降级为模拟]\n\n错误信息：${err.message}\n\n（请检查API Key是否正确配置）`,
      error: err.message
    });
  }
});

// ==================== GET /api/models ====================
app.get('/api/models', (req, res) => {
  const models = [
    { id: 'deepseek', name: 'DeepSeek Chat', avatar: '🧑‍💼', available: !!API_KEYS.deepseek },
    { id: 'qwen', name: '通义千问 Turbo', avatar: '🎨', available: !!API_KEYS.qwen },
    { id: 'openai', name: 'OpenAI GPT-4o', avatar: '🤖', available: !!API_KEYS.openai },
    { id: 'claude', name: 'Claude Sonnet 4', avatar: '🔮', available: !!API_KEYS.claude },
    { id: 'gemini', name: 'Gemini 2.5 Pro', avatar: '✨', available: !!API_KEYS.gemini },
    { id: 'local', name: '本地模拟', avatar: '🖥️', available: true }
  ];
  res.json(models);
});

// ==================== 健康检查 ====================
app.get('/api/health', (req, res) => {
  const status = {};
  for (const [key, val] of Object.entries(API_KEYS)) {
    status[key] = val ? '已配置' : '未配置';
  }
  res.json({ status: 'ok', apis: status });
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

app.listen(PORT, () => {
  console.log(`🤖 AI Team Server 启动成功！`);
  console.log(`   端口: ${PORT}`);
  console.log(`   API状态: ${Object.entries(API_KEYS).filter(([,v]) => v).length}/${Object.keys(API_KEYS).length} 已配置`);
});
