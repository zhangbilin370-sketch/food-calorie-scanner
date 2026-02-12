import { GoogleGenerativeAI } from '@google/generative-ai';
import multiparty from 'multiparty';
import sharp from 'sharp';

// 初始化Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

// Vercel Serverless函数
export default async function handler(req, res) {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: {
                code: 'METHOD_NOT_ALLOWED',
                message: '只支持POST请求'
            }
        });
    }
    
    try {
        // 解析multipart/form-data
        const form = new multiparty.Form();
        
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve({ fields, files });
            });
        });
        
        // 检查文件
        if (!files.image || !files.image[0]) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILE',
                    message: '请上传图片文件'
                }
            });
        }
        
        const file = files.image[0];
        
        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.headers['content-type'])) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_FILE',
                    message: '图片格式不正确，请上传JPEG、PNG或WebP格式的图片'
                }
            });
        }
        
        // 读取文件
        const fs = await import('fs');
        const imageBuffer = fs.readFileSync(file.path);
        
        // 预处理图片
        const processedImage = await preprocessImage(imageBuffer);
        
        // 调用Gemini分析
        const result = await analyzeFood(processedImage);
        
        // 返回结果
        res.status(200).json({
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
        
        if (error.message.includes('无法识别')) {
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
}
