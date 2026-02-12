# 📦 通过GitHub部署到Vercel（超详细步骤）

## 第一步：创建GitHub仓库

1. **打开GitHub**
   - 访问 https://github.com/new
   - 如果没有账号，先注册一个（免费）

2. **创建新仓库**
   - Repository name: `food-calorie-scanner`
   - Description: 食物热量扫描器
   - 选择 **Public**（公开）
   - **不要**勾选 "Add a README file"
   - 点击 "Create repository"

3. **复制仓库地址**
   - 创建后会看到一个页面
   - 找到类似这样的地址：
     ```
     https://github.com/你的用户名/food-calorie-scanner.git
     ```
   - 复制这个地址

## 第二步：推送代码到GitHub

在终端运行以下命令（我已经帮你准备好了）：

```bash
# 添加远程仓库（把下面的地址换成你复制的地址）
git remote add origin https://github.com/你的用户名/food-calorie-scanner.git

# 推送代码
git branch -M main
git push -u origin main
```

如果要求输入用户名和密码：
- 用户名：你的GitHub用户名
- 密码：需要使用Personal Access Token（不是GitHub密码）

**如何获取Token：**
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 勾选 "repo" 权限
4. 点击 "Generate token"
5. 复制token（只显示一次！）
6. 在密码处粘贴这个token

## 第三步：连接Vercel

1. **打开Vercel**
   - 访问 https://vercel.com/login
   - 点击 "Continue with GitHub"（用GitHub登录）
   - 授权Vercel访问你的GitHub

2. **导入项目**
   - 登录后，点击 "Add New..." → "Project"
   - 你会看到你的GitHub仓库列表
   - 找到 `food-calorie-scanner`
   - 点击 "Import"

3. **配置项目**
   - Project Name: 保持默认 `food-calorie-scanner`
   - Framework Preset: 选择 "Other"
   - Root Directory: 保持默认 `./`
   - **不要点击Deploy！先添加环境变量！**

4. **添加环境变量**
   - 在 "Environment Variables" 部分
   - Name: `GEMINI_API_KEY`
   - Value: 你的Gemini API密钥
   - 点击 "Add"

5. **部署**
   - 现在点击 "Deploy"
   - 等待2-3分钟

6. **获取网址**
   - 部署完成后，你会看到 "Congratulations!"
   - 点击 "Visit" 或复制显示的网址
   - 网址类似：`https://food-calorie-scanner-xxx.vercel.app`

## 第四步：在手机上测试

1. 复制你的Vercel网址
2. 在手机浏览器打开
3. 允许摄像头权限
4. 开始拍照识别！

## 🎯 完成！

以后每次修改代码，只需要：
```bash
git add .
git commit -m "更新说明"
git push
```

Vercel会自动重新部署！

## 💡 获取Gemini API密钥

如果还没有API密钥：
1. 访问 https://makersuite.google.com/app/apikey
2. 用Google账号登录
3. 点击 "Create API Key"
4. 复制密钥

完全免费！每分钟15次请求！
