# 设计文档：食物热量扫描器

## 概述

食物热量扫描器是一个渐进式网页应用（PWA），采用前后端分离架构。前端使用原生HTML/CSS/JavaScript构建，通过MediaStream API调用手机摄像头，后端使用Node.js + Express提供RESTful API接口，集成OpenAI Vision API进行食物识别。

### 技术栈选择

**前端：**
- HTML5 + CSS3（响应式设计）
- 原生JavaScript（ES6+）
- MediaStream API（摄像头访问）
- Fetch API（HTTP请求）

**后端：**
- Node.js 18+
- Express.js（Web框架）
- Multer（文件上传处理）
- OpenAI SDK（Vision API集成）
- Sharp（图片压缩）

**部署：**
- 前端：静态文件托管（Vercel/Netlify/GitHub Pages）
- 后端：Node.js服务器（Vercel Serverless/Railway/Render）

### 设计原则

1. **移动优先**：所有UI组件优先考虑移动端体验
2. **渐进增强**：基础功能在所有浏览器可用，高级功能按需启用
3. **快速响应**：优化加载时间和交互响应速度
4. **错误容错**：优雅处理各种错误场景
5. **安全性**：API密钥服务端存储，HTTPS传输

## 架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                     移动端浏览器                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              前端应用 (SPA)                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────┐  │  │
│  │  │ UI组件      │  │ 摄像头模块    │  │ 状态管理 │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │         HTTP客户端 (Fetch API)              │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    后端服务器                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Express.js API                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────┐  │  │
│  │  │ 路由层      │  │ 文件上传处理  │  │ 错误处理 │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │         OpenAI Vision 服务层                │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  OpenAI Vision API                       │
└─────────────────────────────────────────────────────────┘
```

### 数据流

1. **拍照流程**：
   - 用户点击拍照按钮 → 请求摄像头权限 → 打开摄像头预览 → 捕获图片 → 显示预览

2. **识别流程**：
   - 压缩图片 → 上传到后端 → 后端调用OpenAI API → 解析结果 → 返回前端 → 展示结果

3. **错误处理流程**：
   - 捕获错误 → 分类错误类型 → 显示用户友好提示 → 提供重试选项

## 组件和接口

### 前端组件

#### 1. CameraModule（摄像头模块）

**职责**：管理摄像头访问和图片捕获

**接口**：
```javascript
class CameraModule {
  /**
   * 请求摄像头权限并打开摄像头
   * @returns {Promise<MediaStream>} 媒体流对象
   * @throws {CameraError} 权限被拒绝或摄像头不可用
   */
  async openCamera()

  /**
   * 从当前视频流捕获图片
   * @returns {Promise<Blob>} 图片Blob对象
   * @throws {CameraError} 捕获失败
   */
  async capturePhoto()

  /**
   * 关闭摄像头并释放资源
   */
  closeCamera()

  /**
   * 检查浏览器是否支持摄像头API
   * @returns {boolean} 是否支持
   */
  static isSupported()
}
```

**实现要点**：
- 使用`navigator.mediaDevices.getUserMedia()`获取摄像头访问
- 优先使用后置摄像头（`facingMode: 'environment'`）
- 使用Canvas API从video元素捕获图片
- 正确处理权限拒绝和设备不可用错误

#### 2. ImageUploader（图片上传器）

**职责**：处理图片压缩和上传

**接口**：
```javascript
class ImageUploader {
  /**
   * 压缩图片到指定大小
   * @param {Blob} imageBlob - 原始图片
   * @param {number} maxSizeMB - 最大文件大小（MB）
   * @returns {Promise<Blob>} 压缩后的图片
   */
  async compressImage(imageBlob, maxSizeMB = 2)

  /**
   * 上传图片到服务器
   * @param {Blob} imageBlob - 图片数据
   * @param {Function} onProgress - 进度回调函数
   * @returns {Promise<RecognitionResult>} 识别结果
   * @throws {UploadError} 上传失败
   */
  async uploadImage(imageBlob, onProgress)
}
```

**实现要点**：
- 使用Canvas API进行客户端图片压缩
- 使用FormData构建multipart/form-data请求
- 实现上传进度监控（XMLHttpRequest或Fetch with ReadableStream）
- 设置合理的超时时间（30秒）

#### 3. UIController（UI控制器）

**职责**：管理用户界面状态和交互

**接口**：
```javascript
class UIController {
  /**
   * 显示加载状态
   * @param {string} message - 加载提示文字
   */
  showLoading(message)

  /**
   * 隐藏加载状态
   */
  hideLoading()

  /**
   * 显示识别结果
   * @param {RecognitionResult} result - 识别结果对象
   */
  displayResult(result)

  /**
   * 显示错误信息
   * @param {Error} error - 错误对象
   */
  showError(error)

  /**
   * 更新上传进度
   * @param {number} percentage - 进度百分比（0-100）
   */
  updateProgress(percentage)

  /**
   * 重置UI到初始状态
   */
  reset()
}
```

**实现要点**：
- 使用状态机管理UI状态（idle, camera, uploading, result, error）
- 实现平滑的状态转换动画
- 确保按钮大小符合移动端触摸标准（44x44px）
- 使用语义化HTML和ARIA属性提升可访问性

#### 4. AppState（应用状态管理）

**职责**：集中管理应用状态

**接口**：
```javascript
class AppState {
  /**
   * 获取当前状态
   * @returns {string} 当前状态
   */
  getCurrentState()

  /**
   * 切换到新状态
   * @param {string} newState - 新状态
   * @param {Object} data - 状态相关数据
   */
  setState(newState, data)

  /**
   * 订阅状态变化
   * @param {Function} callback - 状态变化回调
   * @returns {Function} 取消订阅函数
   */
  subscribe(callback)
}
```

**状态定义**：
- `IDLE`: 初始状态，显示拍照按钮
- `CAMERA_OPEN`: 摄像头已打开，显示预览
- `UPLOADING`: 图片上传中
- `PROCESSING`: 等待API识别结果
- `RESULT`: 显示识别结果
- `ERROR`: 显示错误信息

### 后端组件

#### 1. API路由层

**端点定义**：

```javascript
POST /api/analyze
Content-Type: multipart/form-data

Request:
- image: File (JPEG/PNG/WebP, max 10MB)

Response (Success):
{
  "success": true,
  "data": {
    "foodName": "苹果",
    "calories": 52,
    "unit": "kcal/100g",
    "healthAdvice": "苹果富含膳食纤维和维生素C，是健康的低热量水果。建议作为加餐食用。",
    "confidence": "high"
  }
}

Response (Error):
{
  "success": false,
  "error": {
    "code": "RECOGNITION_FAILED",
    "message": "无法识别图片中的食物，请重新拍摄更清晰的照片"
  }
}
```

**健康检查端点**：
```javascript
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 2. FileUploadHandler（文件上传处理器）

**职责**：验证和处理上传的图片文件

**实现**：
```javascript
const multer = require('multer');
const sharp = require('sharp');

// Multer配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的图片格式'));
    }
  }
});

// 图片预处理
async function preprocessImage(buffer) {
  return await sharp(buffer)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}
```

#### 3. OpenAIVisionService（OpenAI视觉服务）

**职责**：封装OpenAI Vision API调用

**接口**：
```javascript
class OpenAIVisionService {
  /**
   * 分析食物图片
   * @param {Buffer} imageBuffer - 图片数据
   * @returns {Promise<FoodAnalysisResult>} 分析结果
   * @throws {APIError} API调用失败
   */
  async analyzeFood(imageBuffer)

  /**
   * 构建提示词
   * @returns {string} 优化的提示词
   */
  buildPrompt()
}
```

**提示词设计**：
```javascript
const SYSTEM_PROMPT = `你是一个专业的营养分析助手。请分析图片中的食物并提供以下信息：
1. 食物名称（中文）
2. 估算热量（kcal/100g或每份）
3. 简短的健康建议（50字以内）

请以JSON格式返回结果：
{
  "foodName": "食物名称",
  "calories": 数值,
  "unit": "kcal/100g",
  "healthAdvice": "健康建议",
  "confidence": "high/medium/low"
}

如果图片中没有食物或无法识别，请返回：
{
  "error": "无法识别食物"
}`;
```

**实现要点**：
- 使用`gpt-4-vision-preview`或`gpt-4o`模型
- 将图片转换为base64编码
- 设置合理的token限制（max_tokens: 500）
- 实现重试机制（最多3次）
- 添加超时控制（30秒）

#### 4. ErrorHandler（错误处理器）

**职责**：统一处理和格式化错误响应

**错误类型定义**：
```javascript
const ErrorCodes = {
  INVALID_FILE: 'INVALID_FILE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  RECOGNITION_FAILED: 'RECOGNITION_FAILED',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT'
};

const ErrorMessages = {
  INVALID_FILE: '图片格式不正确，请上传JPEG、PNG或WebP格式的图片',
  FILE_TOO_LARGE: '图片文件过大，请上传小于10MB的图片',
  RECOGNITION_FAILED: '无法识别图片中的食物，请重新拍摄更清晰的照片',
  API_ERROR: 'OpenAI服务暂时不可用，请稍后重试',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT: '请求超时，请重试'
};
```

## 数据模型

### 前端数据模型

#### RecognitionResult（识别结果）

```typescript
interface RecognitionResult {
  foodName: string;        // 食物名称
  calories: number;        // 热量值
  unit: string;           // 单位（如"kcal/100g"）
  healthAdvice: string;   // 健康建议
  confidence: 'high' | 'medium' | 'low';  // 置信度
}
```

#### AppError（应用错误）

```typescript
interface AppError {
  code: string;           // 错误代码
  message: string;        // 用户友好的错误消息
  originalError?: Error;  // 原始错误对象（用于调试）
}
```

#### CameraConfig（摄像头配置）

```typescript
interface CameraConfig {
  video: {
    facingMode: 'environment';  // 后置摄像头
    width: { ideal: 1920 };
    height: { ideal: 1080 };
  };
  audio: false;
}
```

### 后端数据模型

#### UploadedFile（上传文件）

```typescript
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
```

#### OpenAIRequest（OpenAI请求）

```typescript
interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  max_tokens: number;
  temperature: number;
}
```

#### APIResponse（API响应）

```typescript
interface APIResponse {
  success: boolean;
  data?: RecognitionResult;
  error?: {
    code: string;
    message: string;
  };
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*


### 属性列表

**属性 1：响应式布局适配**
*对于任意*手机屏幕尺寸（宽度320px-428px），页面加载后所有UI元素应当正确适配并保持可用性，不出现横向滚动条或元素溢出。
**验证需求：1.2**

**属性 2：摄像头权限请求触发**
*对于任意*用户点击拍照按钮的操作，系统应当调用`navigator.mediaDevices.getUserMedia()`请求摄像头权限。
**验证需求：2.1**

**属性 3：后置摄像头配置**
*对于任意*摄像头打开请求，系统应当在getUserMedia参数中包含`facingMode: 'environment'`以优先使用后置摄像头。
**验证需求：2.2**

**属性 4：视频流预览显示**
*对于任意*成功获取的MediaStream对象，系统应当将其绑定到video元素并显示实时预览。
**验证需求：2.3**

**属性 5：图片捕获生成**
*对于任意*拍照操作，系统应当从video元素捕获当前帧并生成有效的Blob对象（MIME类型为image/jpeg或image/png）。
**验证需求：2.4**

**属性 6：拍照后自动上传**
*对于任意*成功捕获的图片，系统应当立即调用上传函数，无需用户额外操作。
**验证需求：3.1**

**属性 7：上传进度显示**
*对于任意*图片上传过程，系统应当显示进度指示器并实时更新上传百分比（0-100）。
**验证需求：3.2**

**属性 8：上传成功状态转换**
*对于任意*上传成功的响应，系统应当从UPLOADING状态转换到PROCESSING状态，触发结果等待流程。
**验证需求：3.3**

**属性 9：图片自动压缩**
*对于任意*大于2MB的图片，系统应当在上传前自动压缩，确保最终上传的文件大小不超过2MB。
**验证需求：3.5, 9.5**

**属性 10：OpenAI API调用流程**
*对于任意*上传成功的图片，后端应当调用OpenAI Vision API，发送包含食物识别提示词的请求，并解析返回的JSON结果。
**验证需求：4.1, 4.2, 4.3**

**属性 11：识别结果完整性**
*对于任意*成功的食物识别响应，UI应当显示所有必需字段：食物名称、热量值（带kcal单位）、健康建议（不超过100字）、以及重新拍照按钮。
**验证需求：5.1, 5.2, 5.3, 5.5**

**属性 12：按钮触摸尺寸标准**
*对于任意*可交互按钮元素，其可点击区域应当至少为44x44像素，符合移动端触摸标准。
**验证需求：6.2**

**属性 13：字体大小可读性**
*对于任意*文本内容元素，其font-size应当至少为16px，确保移动端可读性。
**验证需求：6.3**

**属性 14：交互视觉反馈**
*对于任意*用户点击或触摸操作，系统应当在100ms内提供视觉反馈（如CSS类变化、动画效果或状态更新）。
**验证需求：6.5**

**属性 15：错误消息中文显示**
*对于任意*错误情况，系统应当显示中文错误消息，并在适用时提供重试按钮。
**验证需求：7.1, 7.4**

**属性 16：后端图片格式验证**
*对于任意*上传到后端的文件，系统应当验证其MIME类型，仅接受image/jpeg、image/png、image/webp格式，拒绝其他格式并返回错误。
**验证需求：8.2**

**属性 17：后端API处理流程**
*对于任意*有效的图片上传请求，后端应当验证格式、调用OpenAI API、解析结果并返回符合APIResponse接口的标准JSON响应。
**验证需求：8.3, 8.4**

**属性 18：API密钥安全性**
*对于任意*前端请求和响应，OpenAI API密钥不应当出现在客户端代码、网络请求参数或响应体中。
**验证需求：8.5**

## 错误处理

### 错误分类和处理策略

#### 1. 摄像头相关错误

**NotAllowedError（权限拒绝）**
- 触发条件：用户拒绝摄像头权限
- 处理策略：显示友好提示，说明需要摄像头权限才能使用功能
- 用户操作：提供"重新授权"按钮，引导用户在浏览器设置中启用权限

**NotFoundError（设备不存在）**
- 触发条件：设备没有摄像头
- 处理策略：显示设备不兼容提示
- 用户操作：建议使用其他设备

**NotReadableError（设备被占用）**
- 触发条件：摄像头被其他应用占用
- 处理策略：提示关闭其他使用摄像头的应用
- 用户操作：提供重试按钮

**OverconstrainedError（约束不满足）**
- 触发条件：请求的摄像头配置不支持
- 处理策略：降级到基础配置（移除facingMode约束）
- 用户操作：自动重试，无需用户干预

#### 2. 网络相关错误

**NetworkError（网络连接失败）**
- 触发条件：无网络连接或服务器不可达
- 处理策略：显示网络错误提示
- 用户操作：提供"重试"按钮，建议检查网络连接

**TimeoutError（请求超时）**
- 触发条件：上传或API调用超过30秒
- 处理策略：终止请求，显示超时提示
- 用户操作：提供"重试"按钮

#### 3. 文件相关错误

**FileTooLargeError（文件过大）**
- 触发条件：压缩后文件仍超过10MB
- 处理策略：提示文件过大，建议重新拍摄
- 用户操作：返回拍照界面

**InvalidFileTypeError（文件类型无效）**
- 触发条件：上传的不是图片文件
- 处理策略：提示文件格式错误
- 用户操作：重新拍照

#### 4. API相关错误

**APIError（OpenAI API错误）**
- 触发条件：OpenAI API返回错误（如配额用尽、服务不可用）
- 处理策略：显示服务暂时不可用提示
- 用户操作：提供"重试"按钮，记录错误日志供开发者排查

**RecognitionFailedError（识别失败）**
- 触发条件：API返回"无法识别食物"
- 处理策略：提示重新拍摄更清晰的照片
- 用户操作：返回拍照界面，提供拍摄建议

**ParseError（响应解析失败）**
- 触发条件：API返回的JSON格式不正确
- 处理策略：记录错误日志，显示通用错误提示
- 用户操作：提供"重试"按钮

### 错误处理实现

#### 前端错误处理器

```javascript
class ErrorHandler {
  static handle(error) {
    let userMessage = '';
    let showRetry = false;
    
    if (error.name === 'NotAllowedError') {
      userMessage = '需要摄像头权限才能使用拍照功能。请在浏览器设置中允许访问摄像头。';
      showRetry = true;
    } else if (error.name === 'NotFoundError') {
      userMessage = '未检测到摄像头设备。请使用带有摄像头的设备。';
      showRetry = false;
    } else if (error.name === 'NotReadableError') {
      userMessage = '摄像头正在被其他应用使用。请关闭其他应用后重试。';
      showRetry = true;
    } else if (error.code === 'NETWORK_ERROR') {
      userMessage = '网络连接失败。请检查网络设置后重试。';
      showRetry = true;
    } else if (error.code === 'TIMEOUT') {
      userMessage = '请求超时。请重试。';
      showRetry = true;
    } else if (error.code === 'FILE_TOO_LARGE') {
      userMessage = '图片文件过大。请重新拍摄。';
      showRetry = false;
    } else if (error.code === 'RECOGNITION_FAILED') {
      userMessage = '无法识别图片中的食物。请确保照片清晰，食物在画面中心，然后重新拍摄。';
      showRetry = false;
    } else if (error.code === 'API_ERROR') {
      userMessage = '服务暂时不可用。请稍后重试。';
      showRetry = true;
    } else {
      userMessage = '发生未知错误。请重试。';
      showRetry = true;
    }
    
    return { userMessage, showRetry };
  }
}
```

#### 后端错误处理中间件

```javascript
function errorMiddleware(err, req, res, next) {
  console.error('Error:', err);
  
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = '服务器内部错误';
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorCode = 'FILE_TOO_LARGE';
    message = '图片文件过大，请上传小于10MB的图片';
  } else if (err.message === '不支持的图片格式') {
    statusCode = 400;
    errorCode = 'INVALID_FILE';
    message = '图片格式不正确，请上传JPEG、PNG或WebP格式的图片';
  } else if (err.code === 'OPENAI_API_ERROR') {
    statusCode = 503;
    errorCode = 'API_ERROR';
    message = 'OpenAI服务暂时不可用，请稍后重试';
  } else if (err.code === 'RECOGNITION_FAILED') {
    statusCode = 422;
    errorCode = 'RECOGNITION_FAILED';
    message = '无法识别图片中的食物，请重新拍摄更清晰的照片';
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message
    }
  });
}
```

### 重试机制

**前端重试策略**：
- 网络错误：允许用户手动重试，不自动重试
- 超时错误：允许用户手动重试
- API错误：允许用户手动重试

**后端重试策略**：
- OpenAI API调用失败：自动重试最多3次，指数退避（1s, 2s, 4s）
- 临时网络错误：自动重试最多2次
- 其他错误：不重试，直接返回错误

## 测试策略

### 测试方法概述

本项目采用**双重测试方法**：单元测试和基于属性的测试（Property-Based Testing, PBT）。两种测试方法互补，共同确保系统的正确性和健壮性。

- **单元测试**：验证特定示例、边界情况和错误条件，确保具体场景下的正确行为
- **属性测试**：验证跨所有输入的通用属性，通过随机生成大量测试用例发现边界情况

### 前端测试

#### 测试框架选择

- **测试运行器**：Vitest（快速、现代、支持ES模块）
- **属性测试库**：fast-check（JavaScript/TypeScript的属性测试库）
- **DOM测试**：@testing-library/dom（测试DOM交互）
- **模拟工具**：Vitest的内置mock功能

#### 测试配置

```javascript
// vitest.config.js
export default {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js'
  }
};
```

#### 属性测试配置

每个属性测试必须：
- 运行至少100次迭代（通过fast-check配置）
- 使用注释标记引用设计文档中的属性
- 标记格式：`// Feature: food-calorie-scanner, Property X: [属性描述]`

#### 测试用例组织

```
tests/
├── unit/                    # 单元测试
│   ├── camera.test.js      # 摄像头模块测试
│   ├── uploader.test.js    # 上传模块测试
│   ├── ui.test.js          # UI控制器测试
│   └── state.test.js       # 状态管理测试
├── properties/             # 属性测试
│   ├── camera.prop.test.js
│   ├── upload.prop.test.js
│   └── ui.prop.test.js
└── integration/            # 集成测试
    └── app.test.js
```

#### 关键测试场景

**CameraModule测试**：
- 单元测试：测试权限拒绝、设备不存在等具体错误场景
- 属性测试：
  - 属性2：验证任意点击操作都触发getUserMedia调用
  - 属性3：验证任意摄像头请求都包含正确的facingMode配置
  - 属性5：验证任意拍照操作都生成有效的Blob对象

**ImageUploader测试**：
- 单元测试：测试特定大小的图片压缩、上传失败重试
- 属性测试：
  - 属性9：验证任意大于2MB的图片都被正确压缩到2MB以下

**UIController测试**：
- 单元测试：测试特定状态转换、错误消息显示
- 属性测试：
  - 属性12：验证所有按钮尺寸都符合44x44px标准
  - 属性13：验证所有文本元素字体大小都至少16px
  - 属性14：验证任意用户操作都在100ms内提供视觉反馈

### 后端测试

#### 测试框架选择

- **测试运行器**：Vitest
- **属性测试库**：fast-check
- **HTTP测试**：supertest（测试Express路由）
- **模拟工具**：Vitest的内置mock功能

#### 测试用例组织

```
tests/
├── unit/                        # 单元测试
│   ├── fileHandler.test.js     # 文件处理测试
│   ├── openaiService.test.js   # OpenAI服务测试
│   └── errorHandler.test.js    # 错误处理测试
├── properties/                  # 属性测试
│   ├── fileValidation.prop.test.js
│   └── apiResponse.prop.test.js
└── integration/                 # 集成测试
    └── api.test.js
```

#### 关键测试场景

**文件上传处理测试**：
- 单元测试：测试特定格式（JPEG、PNG、WebP）的接受和拒绝
- 属性测试：
  - 属性16：验证任意上传文件都经过格式验证，只接受指定格式

**OpenAI服务测试**：
- 单元测试：测试API调用失败、超时、解析错误等具体场景
- 属性测试：
  - 属性17：验证任意有效图片都触发完整的处理流程（验证→调用→解析→返回）

**API响应测试**：
- 单元测试：测试特定成功和失败响应格式
- 属性测试：
  - 属性11：验证任意成功响应都包含所有必需字段
  - 属性18：验证任意响应都不包含API密钥

### 属性测试示例

#### 示例1：图片压缩属性测试

```javascript
// Feature: food-calorie-scanner, Property 9: 图片自动压缩
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { ImageUploader } from '../src/uploader.js';

describe('Property 9: 图片自动压缩', () => {
  it('任意大于2MB的图片都应被压缩到2MB以下', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成2MB到10MB之间的随机图片大小
        fc.integer({ min: 2 * 1024 * 1024, max: 10 * 1024 * 1024 }),
        async (imageSize) => {
          // 创建指定大小的模拟图片
          const mockImage = new Blob([new ArrayBuffer(imageSize)], { 
            type: 'image/jpeg' 
          });
          
          const uploader = new ImageUploader();
          const compressed = await uploader.compressImage(mockImage, 2);
          
          // 验证压缩后的大小
          expect(compressed.size).toBeLessThanOrEqual(2 * 1024 * 1024);
        }
      ),
      { numRuns: 100 } // 运行100次
    );
  });
});
```

#### 示例2：按钮尺寸属性测试

```javascript
// Feature: food-calorie-scanner, Property 12: 按钮触摸尺寸标准
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/dom';

describe('Property 12: 按钮触摸尺寸标准', () => {
  it('所有按钮的可点击区域都应至少为44x44像素', () => {
    // 渲染应用
    document.body.innerHTML = `
      <div id="app">
        <button id="capture-btn">拍照</button>
        <button id="retry-btn">重试</button>
        <button id="recapture-btn">重新拍照</button>
      </div>
    `;
    
    // 获取所有按钮
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
  });
});
```

#### 示例3：后端格式验证属性测试

```javascript
// Feature: food-calorie-scanner, Property 16: 后端图片格式验证
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Property 16: 后端图片格式验证', () => {
  it('任意上传文件都应经过格式验证', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成随机MIME类型
        fc.oneof(
          fc.constant('image/jpeg'),
          fc.constant('image/png'),
          fc.constant('image/webp'),
          fc.constant('image/gif'),      // 不支持
          fc.constant('application/pdf'), // 不支持
          fc.constant('text/plain')       // 不支持
        ),
        async (mimeType) => {
          const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
          const isValid = validTypes.includes(mimeType);
          
          const response = await request(app)
            .post('/api/analyze')
            .attach('image', Buffer.from('fake-image'), {
              filename: 'test.jpg',
              contentType: mimeType
            });
          
          if (isValid) {
            // 有效格式应该被接受（可能因其他原因失败，但不应该是格式错误）
            expect(response.body.error?.code).not.toBe('INVALID_FILE');
          } else {
            // 无效格式应该被拒绝
            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_FILE');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 集成测试

**端到端流程测试**：
1. 模拟完整的用户流程：打开页面 → 点击拍照 → 捕获图片 → 上传 → 显示结果
2. 使用真实的DOM环境和模拟的后端API
3. 验证状态转换和UI更新的正确性

**跨浏览器测试**：
- 使用Playwright或Puppeteer在不同浏览器中运行测试
- 验证需求10中的浏览器兼容性要求

### 测试覆盖率目标

- **代码覆盖率**：至少80%
- **属性覆盖率**：所有18个正确性属性都必须有对应的属性测试
- **边界情况覆盖**：所有标记为edge-case的验收标准都必须有单元测试

### 持续集成

- 在每次代码提交时自动运行所有测试
- 属性测试在CI环境中运行至少100次迭代
- 测试失败时阻止代码合并

## 部署和配置

### 环境变量

**后端环境变量**：
```bash
# OpenAI配置
OPENAI_API_KEY=sk-...           # OpenAI API密钥（必需）
OPENAI_MODEL=gpt-4o             # 使用的模型（默认：gpt-4o）

# 服务器配置
PORT=3000                        # 服务器端口（默认：3000）
NODE_ENV=production              # 环境（development/production）

# 文件上传配置
MAX_FILE_SIZE=10485760          # 最大文件大小（字节，默认10MB）
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp

# CORS配置
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### 前端配置

```javascript
// config.js
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  maxImageSize: 2 * 1024 * 1024, // 2MB
  uploadTimeout: 30000,           // 30秒
  cameraConfig: {
    video: {
      facingMode: 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  }
};
```

### 部署建议

**前端部署**：
- 使用Vercel、Netlify或GitHub Pages托管静态文件
- 启用HTTPS（必需，摄像头API要求）
- 配置CDN加速静态资源

**后端部署**：
- 使用Vercel Serverless Functions、Railway或Render
- 确保环境变量安全配置
- 启用HTTPS
- 配置CORS允许前端域名

**性能优化**：
- 启用Gzip压缩
- 使用浏览器缓存策略
- 优化图片加载（懒加载、WebP格式）
- 使用Service Worker实现离线提示

## 安全考虑

1. **API密钥保护**：OpenAI API密钥仅存储在后端环境变量中，永不暴露给前端
2. **HTTPS传输**：所有通信必须通过HTTPS加密
3. **文件验证**：严格验证上传文件的类型和大小
4. **速率限制**：实现API调用速率限制，防止滥用
5. **输入清理**：清理和验证所有用户输入
6. **CORS配置**：仅允许指定的前端域名访问API
7. **错误信息**：不在错误消息中暴露敏感的系统信息

## 可访问性

1. **语义化HTML**：使用正确的HTML标签（button、main、section等）
2. **ARIA标签**：为交互元素添加适当的ARIA属性
3. **键盘导航**：确保所有功能可通过键盘访问
4. **屏幕阅读器**：提供有意义的alt文本和标签
5. **对比度**：确保文字和背景的对比度符合WCAG AA标准
6. **焦点指示**：清晰的焦点指示器
7. **错误提示**：使用aria-live区域通知屏幕阅读器用户

## 未来扩展

1. **历史记录**：保存用户的识别历史，使用localStorage或后端数据库
2. **多语言支持**：支持英文、日文等其他语言
3. **营养详情**：提供更详细的营养成分信息（蛋白质、脂肪、碳水化合物等）
4. **每日统计**：追踪用户每日摄入的总热量
5. **食物数据库**：建立本地食物数据库，减少API调用成本
6. **批量识别**：支持一次拍摄多个食物
7. **PWA功能**：添加离线支持和安装到主屏幕功能
8. **社交分享**：允许用户分享识别结果
