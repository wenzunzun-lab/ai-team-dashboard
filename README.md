# AI 团队协作面板 🤖

像老板一样管理你的AI员工团队！

## 功能亮点

- **聘用/解雇AI员工** — 每个AI可以接入不同的大模型
- **👑 指定领导** — 领导负责拆解任务、分配工作、汇总成果
- **👀 过程透明** — 每个AI的工作过程、日志、输出全部可见
- **🔒 API Key 安全** — 所有Key在服务器端，前端不暴露

## 部署方式

### 1. 后端服务

```bash
cd server
cp .env.example .env
# 编辑 .env 填入你的 API Key
npm install
npm start
```

### 2. 前端页面

把 `index.html` 放到任意静态服务器即可。

默认前端会自动连接同域名的后端API（`/api/chat`）。
如果需要跨域，修改 `index.html` 中的 `API_BASE` 为后端地址。

## 支持的大模型

| 模型 | 环境变量 | 状态 |
|------|---------|------|
| DeepSeek Chat | `DEEPSEEK_API_KEY` | ✅ 已配 |
| 通义千问 | `QWEN_API_KEY` | ✅ 已配 |
| OpenAI GPT-4o | `OPENAI_API_KEY` | 可选 |
| Claude Sonnet 4 | `CLAUDE_API_KEY` | 可选 |
| Gemini 2.5 Pro | `GEMINI_API_KEY` | 可选 |
| 本地模拟 | 无需Key | ✅ 已配 |

## 技术栈

- 前端：纯原生 HTML + CSS + JS（无框架依赖）
- 后端：Node.js + Express
