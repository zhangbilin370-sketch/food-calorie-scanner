// 配置
const API_URL = '/api/analyze';

// 状态管理
const AppState = {
    IDLE: 'idle',
    CAMERA_OPEN: 'camera_open',
    UPLOADING: 'uploading',
    RESULT: 'result',
    ERROR: 'error'
};

let currentState = AppState.IDLE;
let videoStream = null;

// DOM 元素
const elements = {
    cameraSection: document.getElementById('camera-section'),
    previewSection: document.getElementById('preview-section'),
    loadingSection: document.getElementById('loading-section'),
    resultSection: document.getElementById('result-section'),
    errorSection: document.getElementById('error-section'),
    
    captureBtn: document.getElementById('capture-btn'),
    takePhotoBtn: document.getElementById('take-photo-btn'),
    cancelBtn: document.getElementById('cancel-btn'),
    recaptureBtn: document.getElementById('recapture-btn'),
    retryBtn: document.getElementById('retry-btn'),
    backBtn: document.getElementById('back-btn'),
    
    video: document.getElementById('video'),
    canvas: document.getElementById('canvas'),
    
    loadingText: document.getElementById('loading-text'),
    progress: document.getElementById('progress'),
    
    foodName: document.getElementById('food-name'),
    calories: document.getElementById('calories'),
    healthAdvice: document.getElementById('health-advice'),
    
    errorMessage: document.getElementById('error-message')
};

// 切换状态
function setState(newState) {
    currentState = newState;
    
    // 隐藏所有区域
    elements.cameraSection.classList.add('hidden');
    elements.previewSection.classList.add('hidden');
    elements.loadingSection.classList.add('hidden');
    elements.resultSection.classList.add('hidden');
    elements.errorSection.classList.add('hidden');
    
    // 显示对应区域
    switch (newState) {
        case AppState.IDLE:
            elements.cameraSection.classList.remove('hidden');
            break;
        case AppState.CAMERA_OPEN:
            elements.previewSection.classList.remove('hidden');
            break;
        case AppState.UPLOADING:
            elements.loadingSection.classList.remove('hidden');
            break;
        case AppState.RESULT:
            elements.resultSection.classList.remove('hidden');
            break;
        case AppState.ERROR:
            elements.errorSection.classList.remove('hidden');
            break;
    }
}

// 打开摄像头
async function openCamera() {
    try {
        // 检查浏览器支持
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('您的浏览器不支持摄像头功能');
        }
        
        // 请求摄像头权限
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // 后置摄像头
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });
        
        elements.video.srcObject = videoStream;
        setState(AppState.CAMERA_OPEN);
        
    } catch (error) {
        console.error('摄像头错误:', error);
        
        let message = '无法打开摄像头';
        if (error.name === 'NotAllowedError') {
            message = '需要摄像头权限才能使用拍照功能。请在浏览器设置中允许访问摄像头。';
        } else if (error.name === 'NotFoundError') {
            message = '未检测到摄像头设备。请使用带有摄像头的设备。';
        } else if (error.name === 'NotReadableError') {
            message = '摄像头正在被其他应用使用。请关闭其他应用后重试。';
        }
        
        showError(message);
    }
}

// 关闭摄像头
function closeCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

// 拍照
function takePhoto() {
    const video = elements.video;
    const canvas = elements.canvas;
    
    // 设置canvas尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 绘制当前帧
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // 转换为Blob
    canvas.toBlob(async (blob) => {
        closeCamera();
        await uploadImage(blob);
    }, 'image/jpeg', 0.85);
}

// 压缩图片
async function compressImage(blob) {
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (blob.size <= maxSize) {
        return blob;
    }
    
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
            // 计算新尺寸
            let width = img.width;
            let height = img.height;
            const maxDimension = 1024;
            
            if (width > height && width > maxDimension) {
                height = (height * maxDimension) / width;
                width = maxDimension;
            } else if (height > maxDimension) {
                width = (width * maxDimension) / height;
                height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(resolve, 'image/jpeg', 0.7);
        };
        
        img.src = URL.createObjectURL(blob);
    });
}

// 上传图片
async function uploadImage(blob) {
    setState(AppState.UPLOADING);
    elements.loadingText.textContent = '正在压缩图片...';
    elements.progress.style.width = '20%';
    
    try {
        // 压缩图片
        const compressedBlob = await compressImage(blob);
        
        elements.loadingText.textContent = '正在上传图片...';
        elements.progress.style.width = '40%';
        
        // 创建FormData
        const formData = new FormData();
        formData.append('image', compressedBlob, 'photo.jpg');
        
        // 上传
        elements.loadingText.textContent = '正在识别食物...';
        elements.progress.style.width = '60%';
        
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        elements.progress.style.width = '80%';
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '上传失败');
        }
        
        const result = await response.json();
        elements.progress.style.width = '100%';
        
        if (result.success) {
            showResult(result.data);
        } else {
            throw new Error(result.error?.message || '识别失败');
        }
        
    } catch (error) {
        console.error('上传错误:', error);
        showError(error.message || '网络连接失败，请检查网络设置后重试。');
    }
}

// 显示结果
function showResult(data) {
    elements.foodName.textContent = data.foodName;
    elements.calories.textContent = data.calories;
    elements.healthAdvice.textContent = data.healthAdvice;
    
    setState(AppState.RESULT);
}

// 显示错误
function showError(message) {
    elements.errorMessage.textContent = message;
    setState(AppState.ERROR);
}

// 重置
function reset() {
    closeCamera();
    elements.progress.style.width = '0%';
    setState(AppState.IDLE);
}

// 事件监听
elements.captureBtn.addEventListener('click', openCamera);
elements.takePhotoBtn.addEventListener('click', takePhoto);
elements.cancelBtn.addEventListener('click', reset);
elements.recaptureBtn.addEventListener('click', reset);
elements.retryBtn.addEventListener('click', reset);
elements.backBtn.addEventListener('click', reset);

// 初始化
setState(AppState.IDLE);
