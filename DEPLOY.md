# 📦 Vercel 部署指南

## 🚀 快速部署步骤

### 方法一：通过Vercel网站部署（推荐，最简单）

1. **注册Vercel账号**
   - 访问 https://vercel.com
   - 点击 "Sign Up" 注册（可以用GitHub账号登录）

2. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **登录Vercel**
   ```bash
   vercel login
   ```

4. **部署项目**
   在项目根目录运行：
   ```bash
   vercel
   ```
   
   按照提示操作：
   - Set up and deploy? → Yes
   - Which scope? → 选择你的账号
   - Link to existing project? → No
   - What's your project's name? → food-calorie-scanner（或其他名字）
   - In which directory is your code located? → ./（直接回车）
   - Want to override the settings? → No

5. **配置环境变量**
   
   部署完成后，需要添加Gemini API密钥：
   
   **方式A：通过命令行**
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   然后输入你的API密钥
   
   **方式B：通过网页**
   - 访问 https://vercel.com/dashboard
   - 选择你的项目
   - 点击 "Settings" → "Environment Variables"
   - 添加变量：
     - Name: `GEMINI_API_KEY`
     - Value: 你的Gemini API密钥
   - 点击 "Save"

6. **重新部署**
   ```bash
   vercel --prod
   ```

7. **完成！**
   你会得到一个公网地址，比如：
   ```
   https://food-calorie-scanner.vercel.app
   ```
   
   直接在手机浏览器打开这个地址就能使用了！

---

### 方法二：通过GitHub自动部署

1. **创建GitHub仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/food-calorie-scanner.git
   git push -u origin main
   ```

2. **连接Vercel**
   - 访问 https://vercel.com/new
   - 点击 "Import Git Repository"
   - 选择你的GitHub仓库
   - 点击 "Import"

3. **配置环境变量**
   在部署设置页面添加：
   - `GEMINI_API_KEY`: 你的Gemini API密钥

4. **部署**
   点击 "Deploy"，等待部署完成

5. **自动更新**
   以后每次push代码到GitHub，Vercel会自动重新部署！

---

## 🔧 常见问题

### Q: 部署后显示404错误？
A: 检查vercel.json配置是否正确，确保routes配置正确。

### Q: API调用失败？
A: 检查环境变量GEMINI_API_KEY是否正确配置。

### Q: 图片上传失败？
A: Vercel Serverless函数有10MB的请求大小限制，确保图片压缩正常工作。

### Q: 如何查看日志？
A: 在Vercel Dashboard → 你的项目 → Functions → 点击函数查看日志

### Q: 如何更新代码？
A: 
- 方法一：运行 `vercel --prod` 重新部署
- 方法二：如果用GitHub，直接push代码即可自动部署

---

## 📱 使用部署后的应用

1. 复制Vercel给你的URL（比如 `https://your-app.vercel.app`）
2. 在手机浏览器中打开这个地址
3. 允许摄像头权限
4. 开始拍照识别食物！

---

## 🎯 优化建议

1. **自定义域名**
   - 在Vercel Dashboard → Settings → Domains
   - 添加你自己的域名

2. **性能监控**
   - 在Vercel Dashboard查看访问统计
   - 监控API调用次数

3. **成本控制**
   - Vercel免费版足够个人使用
   - Gemini API完全免费（每分钟15次请求）

---

## 🔒 安全提示

1. 不要把 `.env` 文件提交到Git
2. API密钥只在Vercel环境变量中配置
3. 定期检查API使用情况

---

## 📞 需要帮助？

- Vercel文档: https://vercel.com/docs
- Gemini API文档: https://ai.google.dev/docs
