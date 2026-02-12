# 🚀 快速部署指南（5分钟搞定）

## 方法一：通过Vercel网站部署（最简单，推荐！）

### 不需要安装任何东西，直接在网页上操作：

1. **访问Vercel网站**
   - 打开 https://vercel.com/new
   - 用GitHub、GitLab或Email注册/登录

2. **上传项目**
   - 点击 "Browse" 或拖拽整个项目文件夹
   - 或者先把代码推送到GitHub，然后导入GitHub仓库

3. **配置项目**
   - Project Name: `food-calorie-scanner`（或你喜欢的名字）
   - Framework Preset: 选择 "Other"
   - Root Directory: `./`
   - 点击 "Deploy"

4. **添加环境变量**
   部署完成后：
   - 进入项目的 Settings → Environment Variables
   - 添加：
     - Name: `GEMINI_API_KEY`
     - Value: 你的Gemini API密钥（从 https://makersuite.google.com/app/apikey 获取）
   - 点击 "Save"

5. **重新部署**
   - 回到 Deployments 页面
   - 点击最新的部署
   - 点击右上角的三个点 → "Redeploy"

6. **获取你的网址**
   - 部署完成后，你会看到类似这样的网址：
     ```
     https://food-calorie-scanner-你的用户名.vercel.app
     ```
   - 复制这个网址，在手机浏览器打开！

---

## 方法二：通过命令行部署

### 步骤1：安装Vercel CLI

```bash
npm install -g vercel
```

### 步骤2：登录

```bash
vercel login
```

会打开浏览器让你登录。

### 步骤3：部署

在项目根目录运行：

```bash
vercel
```

按照提示操作：
- Set up and deploy? → **Yes**
- Which scope? → 选择你的账号
- Link to existing project? → **No**
- What's your project's name? → **food-calorie-scanner**
- In which directory is your code located? → **./（直接回车）**
- Want to override the settings? → **No**

### 步骤4：添加API密钥

```bash
vercel env add GEMINI_API_KEY
```

输入你的Gemini API密钥。

### 步骤5：生产部署

```bash
vercel --prod
```

完成！你会得到一个网址。

---

## 🎯 部署完成后

你会得到一个类似这样的网址：
```
https://food-calorie-scanner-abc123.vercel.app
```

**这才是你的真实网址！** 在手机浏览器打开它。

---

## ⚠️ 常见问题

### Q: 显示404错误
**A:** 检查vercel.json文件是否存在，确保routes配置正确。

### Q: 显示500错误
**A:** 检查环境变量GEMINI_API_KEY是否正确配置。

### Q: 图片上传后没反应
**A:** 
1. 打开浏览器开发者工具（F12）查看错误
2. 检查API密钥是否有效
3. 确认Gemini API配额没有用完

### Q: 摄像头打不开
**A:** 
1. 确保使用HTTPS（Vercel自动提供）
2. 在浏览器设置中允许摄像头权限
3. 某些浏览器可能不支持，试试Chrome或Safari

---

## 📱 测试步骤

1. 在手机浏览器打开你的Vercel网址
2. 点击"拍照识别"按钮
3. 允许摄像头权限
4. 对准食物拍照
5. 等待识别结果

---

## 🔄 如何更新代码

### 方法A：通过网站
1. 修改代码后，重新上传到Vercel
2. 或者推送到GitHub，Vercel会自动重新部署

### 方法B：通过命令行
```bash
vercel --prod
```

---

## 💡 获取Gemini API密钥

1. 访问 https://makersuite.google.com/app/apikey
2. 用Google账号登录
3. 点击 "Create API Key"
4. 复制密钥
5. 在Vercel环境变量中添加

**完全免费！每分钟15次请求！**

---

## 🆘 还是不行？

请提供以下信息：
1. 你的Vercel部署网址
2. 浏览器控制台的错误信息（按F12查看）
3. 手机型号和浏览器版本

我会帮你解决！
