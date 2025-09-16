// Plotforge 配置文件
const config = {
    // AI API 配置
    ai: {
        provider: 'qwen-plus',
        apiKey: '', // API密钥将从环境变量或用户输入获取
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        model: 'qwen-plus',
        maxTokens: 16384,
        temperature: 1.2,
        topP: 0.95,
        topK: 6
    },
    
    // 故事配置
    story: {
        initialNode: 'start',
        autoSave: true,
        saveInterval: 30000, // 30秒自动保存
        maxHistoryLength: 10 // 最大历史记录长度
    },
    
    // 界面配置
    ui: {
        loadingTimeout: 20000, // 加载超时时间（毫秒）
        fadeDuration: 300 // 淡入淡出动画持续时间
    },
    
    // 配置文件路径
    configPaths: {
        mainConfig: '../someconfigs/config.json',
        characterTemplates: '../someconfigs/Character.txt',
        frameworkTemplates: '../someconfigs/Framework.txt',
        nodeTemplates: '../someconfigs/Node.txt',
        contentTemplates: '../someconfigs/Content.txt',
        introductionTemplates: '../someconfigs/Introduction.txt'
    }
};

// 导出配置对象（如果环境支持）
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = config;
}