import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 初始化Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 配置文件上传
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
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
    try {
        return await sharp(buffer)
            .resize(1024, 1024, { 
                fit: 'inside', 
                withoutEnlargement: true 
            })
            .jpeg({ quality: 85 })
            .toBuffer();
    } catch (error) {
        console.error('图片处理错误:', error);
        throw error;
    }
}

// 调用Google Gemini Vision API
async function analyzeFood(imageBuffer) {
    try {
        // 转换为base64
        const base64Image = imageBuffer.toString('base64');
        
        const prompt = `你是一个专业的营养分析助手。请分析图片中的食物并提供以下信息：
1. 食物名称（中文）
2. 估算热量（kcal/100g或每份）
3. 简短的健康建议（50字以内）

请严格以JSON格式返回结果，不要有其他文字：
{
  "foodName": "食物名称",
  "calories": 数值,
  "unit": "kcal/100g",
  "healthAdvice": "健康建议",
  "confidence": "high"
}

如果图片中没有食物或无法识别，请返回：
{
  "error": "无法识别食物"
}`;

        // 调用Gemini API
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: 'image/jpeg'
                }
            }
        ]);
        
        const response = await result.response;
        const text = response.text();
        
        // 解析JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('无法解析API响应');
        }
        
        const data = JSON.parse(jsonMatch[0]);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data;
        
    } catch (error) {
        console.error('Gemini API错误:', error);
        throw error;
    }
}

// API路由：分析食物
app.post('/api/analyze', upload.single('image'), async (req, res) => {
    try {
        // 检查文件
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILE',
                    message: '请上传图片文件'
                }
            });
        }
        
        // 预处理图片
        const processedImage = await preprocessImage(req.file.buffer);
        
        // 调用OpenAI分析
        const result = await analyzeFood(processedImage);
        
        // 返回结果
        res.json({
            success: true,
            data: {
                foodName: result.foodName,
                calories: result.calories,
                unit: result.unit || 'kcal/100g',
                healthAdvice: result.healthAdvice,
                confidence: result.confidence || 'medium'
            }
        });
        
    } catch (error) {
        console.error('处理错误:', error);
        
        let statusCode = 500;
        let errorCode = 'INTERNAL_ERROR';
        let message = '服务器内部错误';
        
        if (error.message === '不支持的图片格式') {
            statusCode = 400;
            errorCode = 'INVALID_FILE';
            message = '图片格式不正确，请上传JPEG、PNG或WebP格式的图片';
        } else if (error.code === 'LIMIT_FILE_SIZE') {
            statusCode = 413;
            errorCode = 'FILE_TOO_LARGE';
            message = '图片文件过大，请上传小于10MB的图片';
        } else if (error.message.includes('无法识别')) {
            statusCode = 422;
            errorCode = 'RECOGNITION_FAILED';
            message = '无法识别图片中的食物，请重新拍摄更清晰的照片';
        } else if (error.message.includes('API') || error.message.includes('GEMINI')) {
            statusCode = 503;
            errorCode = 'API_ERROR';
            message = 'AI服务暂时不可用，请稍后重试';
        }
        
        res.status(statusCode).json({
            success: false,
            error: {
                code: errorCode,
                message: message
            }
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📱 请在手机浏览器中访问该地址`);
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  警告: 未设置 GEMINI_API_KEY 环境变量');
        console.log('💡 获取免费API密钥: https://makersuite.google.com/app/apikey');
    }
});
