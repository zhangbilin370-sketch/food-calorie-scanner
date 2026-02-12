# 🍎 食物热量扫描器

一个简单的手机网页应用，通过拍照识别食物并估算热量。

## ✨ 功能特点

- 📷 手机浏览器直接打开使用
- 🎯 调用手机摄像头拍照
- 🤖 使用Google Gemini AI识别食物（完全免费！）
- 📊 显示食物名称、热量和健康建议
- 📱 移动端友好的界面设计

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置Google Gemini API密钥（完全免费！）

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填入你的Gemini API密钥：

```
GEMINI_API_KEY=your-gemini-api-key-here
```

**如何获取免费的Gemini API密钥：**
1. 访问 https://makersuite.google.com/app/apikey
2. 使用Google账号登录
3. 点击 "Create API Key" 创建新密钥
4. 复制密钥并粘贴到 `.env` 文件中

**注意：** Gemini API完全免费，每分钟可以调用15次，足够个人使用！

### 3. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 4. 在手机上访问

**方法一：同一WiFi网络**
1. 确保手机和电脑连接到同一个WiFi
2. 查看电脑的IP地址（Windows: `ipconfig`，Mac/Linux: `ifconfig`）
3. 在手机浏览器中访问 `http://你的IP地址:3000`

**方法二：使用ngrok（推荐）**
1. 安装ngrok: https://ngrok.com/download
2. 运行: `ngrok http 3000`
3. 使用ngrok提供的HTTPS地址在手机上访问

## 📖 使用说明

1. 在手机浏览器中打开应用
2. 点击"拍照识别"按钮
3. 允许浏览器访问摄像头
4. 对准食物拍照
5. 等待识别结果
6. 查看食物名称、热量和健康建议

## 🛠️ 技术栈

**前端：**
- HTML5 + CSS3
- 原生JavaScript
- MediaStream API（摄像头）

**后端：**
- Node.js + Express
- Google Gemini AI（免费）
- Multer（文件上传）
- Sharp（图片处理）

## 📁 项目结构

```
food-calorie-scanner/
├── public/              # 前端文件
│   ├── index.html      # 主页面
│   ├── style.css       # 样式文件
│   └── app.js          # 前端逻辑
├── server/             # 后端文件
│   └── index.js        # 服务器代码
├── .env.example        # 环境变量示例
├── package.json        # 项目配置
└── README.md          # 说明文档
```

## ⚠️ 注意事项

1. **HTTPS要求**：摄像头API需要HTTPS或localhost环境
2. **浏览器兼容性**：建议使用Chrome、Safari或Firefox最新版本
3. **API费用**：Google Gemini API完全免费，每分钟15次请求
4. **网络要求**：需要稳定的网络连接

## 🐛 常见问题

**Q: 无法打开摄像头？**
A: 请检查浏览器权限设置，确保允许网站访问摄像头。

**Q: 识别失败？**
A: 请确保照片清晰，食物在画面中心，光线充足。

**Q: 服务器启动失败？**
A: 请检查是否正确配置了GEMINI_API_KEY环境变量。

## 📝 开发说明

**开发模式：**
```bash
npm run dev
```

**修改API地址：**
编辑 `public/app.js` 中的 `API_URL` 变量。

## 🌐 部署到Vercel

想要部署到公网让手机直接访问？查看详细的部署指南：

👉 [DEPLOY.md](./DEPLOY.md)

简单步骤：
```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 配置API密钥
vercel env add GEMINI_API_KEY

# 5. 生产部署
vercel --prod
```

完成后你会得到一个公网地址，直接在手机浏览器打开即可使用！

## 📄 许可证

MIT License
