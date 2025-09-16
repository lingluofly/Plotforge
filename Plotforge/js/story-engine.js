// Plotforge 故事引擎

class StoryEngine {
    constructor(config) {
        this.config = config;
        this.currentNode = null;
        this.storyState = {
            history: [],
            variables: {},
            characterInfo: {},
            frameworkInfo: {}
        };
        this.isLoading = false;
    }
    
    // 初始化故事引擎
    async init() {
        try {
            // 加载配置文件
            await this.loadConfigs();
            
            // 加载故事状态（如果有保存的话）
            this.loadStoryState();
            
            // 设置自动保存
            if (this.config.story.autoSave) {
                setInterval(() => this.saveStoryState(), this.config.story.saveInterval);
            }
            
            return true;
        } catch (error) {
            console.error('故事引擎初始化失败:', error);
            return false;
        }
    }
    
    // 加载配置文件
    async loadConfigs() {
        try {
            // 从someconfigs目录加载实际的配置文件
            console.log('从someconfigs目录加载配置文件...');
            
            // 加载主配置文件 - 第一个加载，确保核心配置可用
            const configResponse = await fetch('./someconfigs/config.json');
            if (configResponse.ok) {
                try {
                    this.mainConfig = await configResponse.json();
                    console.log('主配置文件加载成功:', this.mainConfig);
                } catch (jsonError) {
                    console.warn('主配置文件解析失败，使用默认配置:', jsonError);
                    this.mainConfig = {
                        title: '神秘冒险',
                        author: 'Plotforge',
                        version: '1.0.0',
                        description: '一个充满未知的冒险故事'
                    };
                }
            } else {
                console.warn('无法加载主配置文件，使用默认配置');
                this.mainConfig = {
                    title: '神秘冒险',
                    author: 'Plotforge',
                    version: '1.0.0',
                    description: '一个充满未知的冒险故事'
                };
            }
            
            // 加载角色配置 - 单独的错误处理
            this.characterTemplates = await this.safeLoadConfig('./someconfigs/Character.txt', this.getExampleCharacterTemplates());
            
            // 加载节点配置 - 单独的错误处理
            this.nodeTemplates = await this.safeLoadConfig('./someconfigs/Node.txt', this.getExampleNodeTemplates());
            
            // 加载内容配置 - 单独的错误处理，增加特殊处理逻辑
            this.contentTemplates = await this.safeLoadConfig('./someconfigs/Content.txt', this.getExampleContentTemplates(), true);
            
            // 加载介绍配置 - 单独的错误处理
            this.introductionTemplates = await this.safeLoadConfig('./someconfigs/Introduction.txt', this.getExampleIntroductionTemplates());
            
            // 加载框架配置 - 单独的错误处理
            const frameworkData = await this.safeLoadConfig('./someconfigs/Framework.txt', {
                background: '这是一个神秘的冒险故事...',
                theme: '未知',
                tone: '神秘'
            });
            
            // 设置故事背景信息
            this.storyState.frameworkInfo = frameworkData;
            
            // 设置角色信息
            this.storyState.characterInfo = this.characterTemplates;
            
            console.log('配置文件加载完成');
        } catch (error) {
            console.error('配置加载过程中发生严重错误:', error);
            
            // 提供最基本的默认配置以确保应用不会崩溃
            this.mainConfig = {
                title: '神秘冒险',
                author: 'Plotforge',
                version: '1.0.0',
                description: '一个充满未知的冒险故事'
            };
            
            this.storyState.frameworkInfo = {
                background: '这是一个神秘的冒险故事...',
                theme: '未知',
                tone: '神秘'
            };
            
            this.storyState.characterInfo = {
                protagonist: {
                    name: '主角',
                    background: '一个普通人',
                    personality: '勇敢'
                }
            };
            
            // 使用示例配置作为最后的后备方案
            this.nodeTemplates = this.getExampleNodeTemplates();
            this.contentTemplates = this.getExampleContentTemplates();
            this.introductionTemplates = this.getExampleIntroductionTemplates();
        }
    }
    
    // 安全加载配置文件的辅助方法
    async safeLoadConfig(filePath, defaultValue, isContentConfig = false) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.warn(`无法加载配置文件 ${filePath}，使用默认值`);
                return defaultValue;
            }
            
            let fileText = await response.text();
            
            // 特殊处理Content.txt中的语法问题
            if (isContentConfig) {
                // 修复段落数量范围的问题
                fileText = fileText.replace(/"paragraphCount":\s*([0-9])-([0-9])/g, (match, p1, p2) => {
                    // 取中间值作为数值
                    const middleValue = Math.floor((parseInt(p1) + parseInt(p2)) / 2);
                    return `"paragraphCount": ${middleValue}`;
                });
            }
            
            try {
                const parsedData = JSON.parse(fileText);
                console.log(`配置文件 ${filePath} 加载成功`);
                return parsedData;
            } catch (jsonError) {
                console.warn(`配置文件 ${filePath} 解析失败:`, jsonError);
                return defaultValue;
            }
        } catch (error) {
            console.warn(`加载配置文件 ${filePath} 时出错:`, error);
            return defaultValue;
        }
    }
    
    // 获取故事介绍
    getStoryIntroduction() {
        return this.introductionTemplates || '欢迎来到 Plotforge 交互式小说生成器！';
    }
    
    // 开始新故事
    async startNewStory() {
        try {
            this.resetStoryState();
            // 确保initialNode存在且有效
            const initialNode = this.config && this.config.story && this.config.story.initialNode ? this.config.story.initialNode : 'start';
            this.currentNode = initialNode;
            
            // 清空之前的故事内容（新故事开始时）
            try {
                localStorage.removeItem('yourstory');
                console.log('已清空之前的故事内容，准备开始新故事');
            } catch (clearError) {
                console.warn('清空故事内容时发生错误:', clearError);
            }
            
            // 尝试获取初始节点内容
            const content = await this.getNodeContent(this.currentNode);
            return content;
        } catch (error) {
            console.error('开始新故事时发生错误:', error);
            // 返回默认的初始内容
            return {
                content: '欢迎来到神秘冒险！点击下方按钮开始你的故事之旅...',
                choices: [
                    {
                        id: 'start_over',
                        text: '重新开始',
                        nextNode: 'start'
                    }
                ]
            };
        }
    }
    
    // 获取节点内容
    async getNodeContent(nodeId) {
        try {
            this.isLoading = true;
            
            console.log(`获取节点内容: ${nodeId}`);
            
            // 查找节点配置
            const node = this.findNodeById(nodeId);
            
            // 找不到节点时，抛出明确的错误，让上层调用者处理
            if (!node) {
                console.warn(`节点 ${nodeId} 不存在`);
                throw new Error(`找不到节点: ${nodeId}`);
            }
            
            try {
                let finalContent = node.content;
                let finalChoices = node.choices || [];
                
                // 如果需要AI生成内容
                if (node.requiresAI) {
                    // 检查是否有用户选择的选项（从URL参数或状态中获取）
                    const selectedChoice = this.getSelectedChoiceFromState();
                    
                    const aiResult = await this.generateContentWithAI(node, selectedChoice);
                    
                    // 更新内容和选项
                    finalContent = aiResult.content || node.content;
                    finalChoices = aiResult.choices || node.choices || [];
                    
                    // 更新节点内容（可选，用于缓存）
                    node.content = finalContent;
                }
                
                // 保存到历史记录
                this.addToHistory(nodeId, finalContent);
                
                return {
                    content: finalContent,
                    choices: finalChoices
                };
            } catch (contentError) {
                // 内容生成或处理错误，但节点存在
                console.error(`处理节点 ${nodeId} 内容时发生错误:`, contentError);
                
                // 提供节点的基础内容作为备选
                if (node.content) {
                    return {
                        content: node.content + '\n\n(注：部分内容无法正常生成)',
                        choices: node.choices || []
                    };
                }
                
                // 如果没有基础内容，返回一个默认的错误响应，但不抛出错误
                return {
                    content: `加载节点 ${nodeId} 的内容时发生错误: ${contentError.message}`,
                    choices: node.choices || []
                };
            }
        } catch (error) {
            // 只处理找不到节点的错误
            if (error.message && error.message.includes('找不到节点')) {
                // 重新抛出错误，让上层调用者处理
                throw error;
            }
            
            // 其他致命错误
            console.error(`获取节点内容时发生致命错误 (${nodeId}):`, error);
            return {
                content: '抱歉，加载故事内容时发生严重错误。请刷新页面重试。',
                choices: [
                    {
                        id: 'refresh_retry',
                        text: '刷新页面重试',
                        nextNode: 'start'
                    }
                ]
            };
        } finally {
            this.isLoading = false;
        }
    }
    
    // 使用AI生成内容
    async generateContentWithAI(node, selectedChoice = null) {
        try {
            // 构建提示词，如果用户选择了选项，基于选择继续生成
            const prompt = this.buildAIPrompt(node, selectedChoice);
            
            // 调用通用AI API方法，支持多种AI提供商
            const content = await this.callAIAPI(prompt);
            
            // 解析AI生成的内容和选项
            const parsedResult = this.parseAIContent(content, node);
            
            return parsedResult;
        } catch (error) {
            console.error('AI生成内容失败:', error);
            // 返回备用内容
            return {
                content: node.fallbackContent || '故事继续发展...',
                choices: node.choices || []
            };
        }
    }
    
    // 构建AI提示词
    buildAIPrompt(node) {
        let prompt = `你是一个专业的小说作家，根据以下信息生成故事内容：\n\n`;
        
        // 添加故事背景
        if (this.storyState && this.storyState.frameworkInfo && this.storyState.frameworkInfo.background) {
            prompt += `故事背景：${this.storyState.frameworkInfo.background}\n\n`;
        } else {
            prompt += `故事背景：一个神秘的冒险故事\n\n`;
        }
        
        // 添加人物信息
        if (this.storyState && this.storyState.characterInfo && Object.keys(this.storyState.characterInfo).length > 0) {
            prompt += `人物信息：\n`;
            for (const [name, info] of Object.entries(this.storyState.characterInfo)) {
                prompt += `- ${name}: ${JSON.stringify(info)}\n`;
            }
            prompt += `\n`;
        }
        
        // 添加节点要求
        prompt += `当前情节：${node.description || node.id}\n`;
        
        // 添加历史上下文
        if (this.storyState.history && this.storyState.history.length > 0) {
            const recentHistory = this.storyState.history.slice(-this.config.story.maxHistoryLength);
            prompt += `\n最近的情节发展：\n`;
            recentHistory.forEach((item, index) => {
                prompt += `${index + 1}. ${item.content.substring(0, 100)}...\n`;
            });
        }
        
        // 添加创作要求
        prompt += `\n创作要求：\n`;
        prompt += `- 保持情节连贯，符合故事背景和人物设定\n`;
        prompt += `- 语言生动，有画面感\n`;
        prompt += `- 长度适中，大约200-300字\n`;
        prompt += `- 结尾留下适当悬念，引导读者选择\n`;
        
        // 添加选项生成要求
        prompt += `\n选项生成要求：\n`;
        prompt += `- 基于当前故事发展和角色性格，生成3个不同的后续选项\n`;
        prompt += `- 每个选项应该体现不同的决策方向和角色特点\n`;
        prompt += `- 选项文字要简洁明了，长度在10-20字之间\n`;
        prompt += `- 在故事正文结束后，单独用以下格式列出选项：\n`;
        prompt += `  [选项1] 选项内容文本\n`;
        prompt += `  [选项2] 选项内容文本\n`;
        prompt += `  [选项3] 选项内容文本\n`;
        prompt += `- 确保选项标记格式正确，不要将选项内容混入故事正文`;
        
        return prompt;
    }
    
    // 解析AI生成的内容和选项
    parseAIContent(content, node) {
        try {
            // 默认返回对象
            const result = {
                content: content,
                choices: node.choices || []
            };
            
            // 使用正则表达式提取所有[选项X]格式的选项
            const optionRegex = /\[选项(\d+)\]\s*(.+?)(?=\n|\[选项|$)/g;
            const parsedChoices = [];
            let match;
            
            // 提取所有选项
            while ((match = optionRegex.exec(content)) !== null && parsedChoices.length < 3) {
                const optionNumber = parseInt(match[1]);
                const optionText = match[2].trim();
                
                if (optionText && optionText.length > 0) {
                    parsedChoices.push({
                        id: `ai_option_${optionNumber}`,
                        text: optionText,
                        nextNode: this.getNextNodeForOption(node, optionNumber)
                    });
                }
            }
            
            // 清理故事内容，移除所有选项标记和选项文本
            let cleanedContent = content
                .replace(/\[选项\d+\]\s*.*?(?=\n|\[选项|$)/g, '') // 移除所有[选项X]格式的选项行
                .replace(/选项\s*\d+.*?(?=\n|$)/g, '') // 移除"选项X"格式
                .replace(/选择\s*\d+.*?(?=\n|$)/g, '') // 移除"选择X"格式
                .replace(/^\d+\.\s*.*?(?=\n|$)/gm, '') // 移除数字开头的行
                .replace(/^[-•·]\s*.*?(?=\n|$)/gm, '') // 移除符号开头的行
                .trim();
            
            // 如果成功解析到选项，使用AI生成的选项
            if (parsedChoices.length > 0) {
                result.choices = parsedChoices;
                // 使用清理后的内容，确保不包含任何选项文本
                result.content = cleanedContent.trim() || '故事继续发展...';
            } else {
                // 如果没有解析到选项，也使用清理后的内容
                result.content = cleanedContent.trim() || content;
            }
            
            return result;
        } catch (error) {
            console.error('解析AI内容失败:', error);
            return {
                content: content,
                choices: node.choices || []
            };
        }
    }
    
    // 根据选项序号确定下一个节点
    getNextNodeForOption(node, optionNumber) {
        // 默认的节点映射逻辑
        const defaultNextNodes = ['strange_occurrence', 'alternative_path', 'mystery_deepens'];
        
        // 如果当前节点有预定义的选项，使用对应的nextNode
        if (node.choices && node.choices.length > optionNumber - 1) {
            return node.choices[optionNumber - 1].nextNode;
        }
        
        // 否则使用默认的节点映射
        return defaultNextNodes[optionNumber - 1] || 'strange_occurrence';
    }
    
    // 记录调试信息
    logDebugMessage(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const debugMessage = {
            time: timestamp,
            type: type,
            content: message
        };
        
        console.log('调试信息准备发送:', debugMessage);
        
        // 发送自定义事件，让app.js可以捕获并显示调试信息
        try {
            const event = new CustomEvent('debugMessage', {
                detail: debugMessage
            });
            window.dispatchEvent(event);
            console.log('调试信息事件已成功发送');
        } catch (error) {
            console.error('发送调试信息事件失败:', error);
        }
        
        console.log(`[${type}] ${timestamp}: ${message}`);
    }
    
    // 调用qwen-plus API (被callAIAPI替代，但为了向后兼容保留)

    // 保存故事内容到文件
    saveStoryToFile(content, isNewStory = false) {
        try {
            let storyContent;
            
            if (isNewStory) {
                // 如果是新故事，清空现有内容
                storyContent = content + '\n\n';
            } else {
                // 如果是继续故事，追加到现有内容
                const existingStory = localStorage.getItem('yourstory') || '';
                storyContent = existingStory + content + '\n\n';
            }
            
            localStorage.setItem('yourstory', storyContent);
            
            // 记录保存信息
            this.logDebugMessage('info', `故事内容已保存，总长度: ${storyContent.length} 字符`);
        } catch (error) {
            this.logDebugMessage('error', `保存故事内容失败: ${error.message}`);
            console.error('保存故事内容失败:', error);
        }
    }

    // 生成讯飞星火API的Authorization签名
    generateXunfeiAuthorization() {
        // 注意：这些是硬编码的讯飞API认证信息，实际使用时应该从配置文件中读取
        const apiKey = 'ee53fd6f9c3ca4eac622ba15c275f08a';
        const apiSecret = 'MzdlODkzZTZhZWI0NWFjZTEwM2Q0Njgz';
        const appid = '40b131bd';
        
        // 简单的Authorization生成逻辑（实际使用时可能需要更复杂的签名算法）
        // 这里使用base64编码的appid和apiKey作为示例
        const credentials = btoa(`${appid}:${apiKey}:${apiSecret}`);
        return `Basic ${credentials}`;
    }
    
    async callAIAPI(prompt) {
        try {
            this.logDebugMessage('info', `开始调用 ${this.config.ai.provider} API`);
            
            // 检查API配置
            if (!this.config.ai.apiKey) {
                this.logDebugMessage('error', `${this.config.ai.provider} APIKey 未设置`);
                throw new Error(`${this.config.ai.provider} APIKey 未设置`);
            }
            
            this.logDebugMessage('info', `请求参数: 模型=${this.config.ai.model}, max_tokens=${this.config.ai.maxTokens}, temperature=${this.config.ai.temperature}`);

            // 根据不同的AI提供商构建不同的请求
            if (this.config.ai.provider === 'xunfei') {
                // 讯飞星火API调用格式
                const authorization = this.generateXunfeiAuthorization();
                
                const response = await fetch(this.config.ai.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authorization,
                        'X-Appid': '40b131bd'
                    },
                    body: JSON.stringify({
                        model: this.config.ai.model,
                        messages: [
                            { role: 'system', content: '你是一个专业的小说作家。' },
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: this.config.ai.maxTokens,
                        temperature: this.config.ai.temperature,
                        top_p: this.config.ai.topP,
                        top_k: this.config.ai.topK || 6
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    this.logDebugMessage('error', `API请求失败: ${response.status} - ${errorText}`);
                    throw new Error(`API请求失败: ${response.status}`);
                }
                
                const data = await response.json();
                
                // 检查响应格式并提取内容
                if (data.code !== 0 && data.error) {
                    this.logDebugMessage('error', `API调用失败: ${data.error.message || data.message}`);
                    throw new Error(`API调用失败: ${data.error.message || data.message}`);
                }
                
                const storyContent = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

                if (!storyContent) {
                    this.logDebugMessage('error', '未获取到有效的故事内容');
                    throw new Error('未获取到有效的故事内容');
                }

                this.logDebugMessage('success', `API 调用成功，生成内容长度: ${storyContent.length} 字符`);
                
                // 保存生成的故事内容
                this.saveStoryToFile(storyContent);

                return storyContent;
            } else if (this.config.ai.provider === 'qwen3') {
                // Qwen3 API调用格式（通过代理服务器解决CORS问题）
                const proxyUrl = 'http://localhost:8001/api/proxy/dashscope';
                
                const response = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.ai.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.config.ai.model,
                        input: {
                            messages: [
                                { role: 'system', content: '你是一个专业的小说作家。' },
                                { role: 'user', content: prompt }
                            ]
                        },
                        parameters: {
                            max_tokens: this.config.ai.maxTokens,
                            temperature: this.config.ai.temperature,
                            top_p: this.config.ai.topP,
                            top_k: this.config.ai.topK || 6
                        }
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    this.logDebugMessage('error', `API请求失败: ${response.status} - ${errorText}`);
                    throw new Error(`API请求失败: ${response.status}`);
                }
                
                const data = await response.json();
                
                // 检查响应格式并提取内容
                if (data.code !== 200) {
                    this.logDebugMessage('error', `API调用失败: ${data.message || '未知错误'}`);
                    throw new Error(`API调用失败: ${data.message || '未知错误'}`);
                }
                
                const storyContent = data.output && data.output.choices && data.output.choices[0] && data.output.choices[0].message && data.output.choices[0].message.content;

                if (!storyContent) {
                    this.logDebugMessage('error', '未获取到有效的故事内容');
                    throw new Error('未获取到有效的故事内容');
                }

                this.logDebugMessage('success', `API 调用成功，生成内容长度: ${storyContent.length} 字符`);
                
                // 保存生成的故事内容
                this.saveStoryToFile(storyContent);

                return storyContent;
            } else {
                // 默认使用qwen-plus API格式
                const response = await fetch(this.config.ai.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.ai.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.config.ai.model,
                        messages: [
                            { role: 'system', content: '你是一个专业的小说作家。' },
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: this.config.ai.maxTokens,
                        temperature: this.config.ai.temperature,
                        top_p: this.config.ai.topP
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    this.logDebugMessage('error', `API请求失败: ${response.status} - ${errorText}`);
                    throw new Error(`API请求失败: ${response.status}`);
                }
                
                const data = await response.json();
                const storyContent = data.choices[0].message.content;

                if (!storyContent) {
                    this.logDebugMessage('error', '未获取到有效的故事内容');
                    throw new Error('未获取到有效的故事内容');
                }

                this.logDebugMessage('success', `API 调用成功，生成内容长度: ${storyContent.length} 字符`);
                
                // 保存生成的故事内容
                this.saveStoryToFile(storyContent);

                return storyContent;
            }
        } catch (error) {
            this.logDebugMessage('error', `${this.config.ai.provider} API调用失败: ${error.message}`);
            console.error(`${this.config.ai.provider} API调用失败:`, error);
            throw error;
        }
    }
    
    // 为了向后兼容保留原方法名
    async callQwenAPI(prompt) {
        return this.callAIAPI(prompt);
    }
    
    // 处理选择
    async handleChoice(choice) {
        // 严格检查输入参数
        if (!choice || typeof choice !== 'object') {
            console.error('无效的选择参数:', choice);
            return {
                content: '抱歉，发生了一个错误。请尝试其他选择。',
                choices: []
            };
        }
        
        if (!choice.nextNode) {
            console.error('选择没有指定下一个节点:', choice);
            return {
                content: '这个选择似乎有问题。请尝试其他选项。',
                choices: []
            };
        }
        
        // 更新故事变量
        if (choice.effects) {
            try {
                this.updateStoryVariables(choice.effects);
            } catch (error) {
                console.warn('更新故事变量失败:', error);
            }
        }
        
        // 保存用户选择到故事状态
        try {
            this.storyState.lastChoice = choice.text;
            this.logDebugMessage('info', `保存用户选择到故事状态: ${choice.text}`);
        } catch (saveError) {
            console.warn('保存用户选择到故事状态失败:', saveError);
        }
        
        // 跳转到下一个节点
        try {
            console.log(`尝试跳转到节点: ${choice.nextNode}`);
            const nodeContent = await this.getNodeContent(choice.nextNode);
            return nodeContent;
        } catch (error) {
            // 增强的错误处理逻辑 - 不回到起点
            console.error('获取节点内容时发生错误:', error);
            
            // 检查是否找不到节点
            if (error.message && error.message.includes('找不到节点')) {
                console.warn(`找不到节点 ${choice.nextNode}`);
                
                // 尝试使用当前可用的节点历史来继续故事，不回到起点
                // 找到上一个有效的节点
                if (this.storyState.history && this.storyState.history.length > 1) {
                    // 获取上一个节点的ID
                    const lastNodeIndex = this.storyState.history.length - 2;
                    const lastNodeId = this.storyState.history[lastNodeIndex].nodeId;
                    
                    try {
                        const lastNodeContent = await this.getNodeContent(lastNodeId);
                        if (lastNodeContent) {
                            return {
                                content: `故事路径出现了一点小问题，让我们回到之前的选择点继续冒险吧！\n\n${lastNodeContent.content}`,
                                choices: lastNodeContent.choices || []
                            };
                        }
                    } catch (lastNodeError) {
                        console.warn(`无法回到上一个节点 ${lastNodeId}:`, lastNodeError);
                    }
                }
                
                // 如果所有尝试都失败，创建一个临时的故事节点来继续故事，不使用start节点
                return {
                    content: `我们在故事的道路上遇到了一点小障碍（节点ID: ${choice.nextNode}）。不过不用担心，我们可以从这里继续我们的冒险！\n\n你站在一个十字路口，周围是迷雾缭绕的森林。远处似乎有什么声音在呼唤着你...`,
                    choices: [
                        {
                            id: 'continue_left_path',
                            text: '向左走，探索未知的小径',
                            nextNode: 'strange_occurrence'
                        },
                        {
                            id: 'continue_right_path',
                            text: '向右走，寻找熟悉的地标',
                            nextNode: 'alternative_path'
                        },
                        {
                            id: 'explore_center',
                            text: '调查十字路口中间的神秘符号',
                            nextNode: 'mystery_deepens'
                        }
                    ]
                };
            }
            
            // 处理其他类型的错误
            console.error('处理选择时发生未知错误:', error);
            
            // 对于其他错误，也创建一个临时的故事节点来继续，不回到起点
            return {
                content: `故事的进程中发生了一个意外: ${error.message || '未知错误'}。不过故事还在继续！\n\n你发现自己来到了一个神秘的地方，这里似乎是故事的一个转折点...`,
                choices: [
                    {
                        id: 'continue_adventure_1',
                        text: '继续探索这个神秘的地方',
                        nextNode: 'strange_occurrence'
                    },
                    {
                        id: 'continue_adventure_2',
                        text: '寻找其他出口',
                        nextNode: 'alternative_path'
                    },
                    {
                        id: 'investigate_mystery',
                        text: '深入调查发生的异常',
                        nextNode: 'mystery_deepens'
                    }
                ]
            };
        }
    }
    
    // 查找节点
    findNodeById(nodeId) {
        // 在实际应用中，这里应该在节点模板中查找
        try {
            // 确保nodeTemplates存在
            if (!this.nodeTemplates) {
                console.warn('节点模板未加载');
                return null;
            }
            
            const node = this.nodeTemplates[nodeId];
            if (!node) {
                console.warn(`找不到节点: ${nodeId}`);
                return null;
            }
            
            return node;
        } catch (error) {
            console.error(`查找节点 ${nodeId} 时发生错误:`, error);
            return null;
        }
    }
    
    // 重置故事状态
    resetStoryState() {
        this.storyState = {
            history: [],
            variables: {},
            characterInfo: {},
            frameworkInfo: {}
        };
        this.currentNode = null;
    }
    
    // 添加到历史记录
    addToHistory(nodeId, content) {
        // 确保storyState和history属性已初始化
        if (!this.storyState) {
            this.storyState = {};
        }
        if (!this.storyState.history || !Array.isArray(this.storyState.history)) {
            this.storyState.history = [];
        }
        
        this.storyState.history.push({
            nodeId,
            content,
            timestamp: new Date().toISOString()
        });
        
        // 限制历史记录长度
        if (this.storyState.history.length > this.config.story.maxHistoryLength) {
            this.storyState.history.shift();
        }
    }
    
    // 更新故事变量
    updateStoryVariables(effects) {
        for (const [key, value] of Object.entries(effects)) {
            this.storyState.variables[key] = value;
        }
    }
    
    // 保存故事状态
    saveStoryState() {
        try {
            const state = {
                currentNode: this.currentNode,
                storyState: this.storyState,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('plotforgeStoryState', JSON.stringify(state));
        } catch (error) {
            console.error('保存故事状态失败:', error);
        }
    }
    
    // 获取当前故事状态
    getStoryState() {
        return {
            currentNode: this.currentNode,
            storyState: this.storyState,
            timestamp: new Date().toISOString()
        };
    }
    
    // 加载故事状态
    loadStoryState() {
        try {
            const savedState = localStorage.getItem('plotforgeStoryState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // 验证保存的状态数据
                if (state && typeof state === 'object') {
                    this.currentNode = state.currentNode || null;
                    this.storyState = state.storyState || {};
                    
                    // 确保storyState的各个属性都被正确初始化
                    if (!this.storyState.history || !Array.isArray(this.storyState.history)) {
                        this.storyState.history = [];
                    }
                    if (!this.storyState.variables || typeof this.storyState.variables !== 'object') {
                        this.storyState.variables = {};
                    }
                    if (!this.storyState.characterInfo || typeof this.storyState.characterInfo !== 'object') {
                        this.storyState.characterInfo = {};
                    }
                    if (!this.storyState.frameworkInfo || typeof this.storyState.frameworkInfo !== 'object') {
                        this.storyState.frameworkInfo = {};
                    }
                } else {
                    console.warn('保存的故事状态格式无效');
                    this.currentNode = null;
                    this.storyState = {};
                }
            }
        } catch (error) {
            console.error('加载故事状态失败:', error);
            this.currentNode = null;
            this.storyState = {};
        }
        
        // 确保storyState的各个属性都被正确初始化
        if (!this.storyState.history || !Array.isArray(this.storyState.history)) {
            this.storyState.history = [];
        }
        if (!this.storyState.variables || typeof this.storyState.variables !== 'object') {
            this.storyState.variables = {};
        }
        if (!this.storyState.characterInfo || typeof this.storyState.characterInfo !== 'object') {
            this.storyState.characterInfo = {};
        }
        if (!this.storyState.frameworkInfo || typeof this.storyState.frameworkInfo !== 'object') {
            this.storyState.frameworkInfo = {};
        }
    }
    
    // 示例配置数据
    getExampleMainConfig() {
        return {
            title: '神秘冒险',
            author: 'Plotforge',
            version: '1.0.0',
            description: '一个充满未知的冒险故事',
            characterTemplate: 'default',
            frameworkTemplate: 'fantasy',
            nodeTemplate: 'main_story',
            contentTemplate: 'rich'
        };
    }
    
    getExampleCharacterTemplates() {
        return {
            protagonist: {
                name: '艾利克斯',
                age: 25,
                background: '普通的大学生，对神秘事物充满好奇',
                personality: '勇敢、聪明但有些冲动',
                goals: '探索未知，寻找真相'
            },
            guide: {
                name: '老法师梅林',
                age: '未知',
                background: '神秘的向导，似乎了解许多秘密',
                personality: '睿智、沉稳、有点神秘',
                goals: '引导主角完成使命'
            }
        };
    }
    
    getExampleFrameworkTemplates() {
        return {
            fantasy: {
                background: '在一个现代与奇幻交织的世界中，存在着不为人知的秘密和力量。主角偶然发现了一本古老的书，从而卷入了一场跨越维度的冒险。',
                theme: '探索、成长、责任',
                tone: '神秘、紧张但充满希望'
            }
        };
    }
    
    getExampleNodeTemplates() {
        return {
            start: {
                id: 'start',
                description: '故事开始',
                content: '一个平凡的周末，你在旧书店里闲逛。书架的角落，一本看起来有些年头的书引起了你的注意。书的封面是深棕色的，上面有着奇怪的符号。你好奇地翻开了它...',
                requiresAI: false,
                choices: [
                    {
                        id: 'read_more',
                        text: '继续阅读这本书',
                        nextNode: 'strange_occurrence',
                        effects: { curiosity: 1 }
                    },
                    {
                        id: 'put_back',
                        text: '将书放回书架，离开书店',
                        nextNode: 'alternative_path',
                        effects: { caution: 1 }
                    }
                ],
                fallbackContent: '你在书店里发现了一本神秘的书...'
            },
            strange_occurrence: {
                id: 'strange_occurrence',
                description: '奇怪的事情发生了',
                requiresAI: true,
                choices: [
                    {
                        id: 'investigate',
                        text: '调查这个奇怪的现象',
                        nextNode: 'mystery_deepens',
                        effects: { courage: 1 }
                    },
                    {
                        id: 'escape',
                        text: '放下书，快速离开',
                        nextNode: 'safe_path',
                        effects: { fear: 1 }
                    }
                ],
                fallbackContent: '当你继续阅读时，突然感到周围的环境发生了变化...'
            },
            alternative_path: {
                id: 'alternative_path',
                description: '另一条道路',
                requiresAI: true,
                choices: [
                    {
                        id: 'return_bookstore',
                        text: '返回书店查看那本书',
                        nextNode: 'strange_occurrence',
                        effects: { regret: 1 }
                    },
                    {
                        id: 'continue_away',
                        text: '继续前行，忘记这件事',
                        nextNode: 'normal_life',
                        effects: { relief: 1 }
                    }
                ],
                fallbackContent: '你决定离开书店，但心中总有一丝好奇...'
            },
            mystery_deepens: {
                id: 'mystery_deepens',
                description: '谜团加深',
                requiresAI: true,
                choices: [
                    {
                        id: 'seek_help',
                        text: '寻找知道内情的人',
                        nextNode: 'meet_guide',
                        effects: { wisdom: 1 }
                    },
                    {
                        id: 'explore_alone',
                        text: '独自探索这个神秘世界',
                        nextNode: 'dangerous_path',
                        effects: { recklessness: 1 }
                    }
                ],
                fallbackContent: '你决定深入调查这个神秘的现象...'
            },
            safe_path: {
                id: 'safe_path',
                description: '安全的道路',
                requiresAI: true,
                choices: [
                    {
                        id: 'rethink',
                        text: '重新考虑是否应该调查',
                        nextNode: 'mystery_deepens',
                        effects: { determination: 1 }
                    },
                    {
                        id: 'forget',
                        text: '彻底忘记这次奇怪的经历',
                        nextNode: 'normal_life',
                        effects: { closure: 1 }
                    }
                ],
                fallbackContent: '你逃离了书店，但好奇心仍在心中萦绕...'
            },
            meet_guide: {
                id: 'meet_guide',
                description: '遇到向导',
                requiresAI: true,
                choices: [
                    {
                        id: 'trust_guide',
                        text: '相信这个神秘的向导',
                        nextNode: 'adventure_begins',
                        effects: { trust: 1 }
                    },
                    {
                        id: 'doubt_guide',
                        text: '对向导保持怀疑',
                        nextNode: 'test_guide',
                        effects: { caution: 1 }
                    }
                ],
                fallbackContent: '你遇到了一位自称了解这一切的神秘向导...'
            },
            dangerous_path: {
                id: 'dangerous_path',
                description: '危险的道路',
                requiresAI: true,
                choices: [
                    {
                        id: 'face_danger',
                        text: '直面危险',
                        nextNode: 'trial_by_fire',
                        effects: { bravery: 1 }
                    },
                    {
                        id: 'retreat',
                        text: '撤退并寻找帮助',
                        nextNode: 'meet_guide',
                        effects: { humility: 1 }
                    }
                ],
                fallbackContent: '独自探索的你遇到了意想不到的危险...'
            },
            adventure_begins: {
                id: 'adventure_begins',
                description: '冒险开始',
                requiresAI: true,
                choices: [
                    {
                        id: 'main_quest',
                        text: '接受主线任务',
                        nextNode: 'main_quest_start',
                        effects: { purpose: 1 }
                    },
                    {
                        id: 'side_quest',
                        text: '先完成一些支线任务',
                        nextNode: 'side_quest_start',
                        effects: { exploration: 1 }
                    }
                ],
                fallbackContent: '在向导的帮助下，你的冒险正式开始了...'
            },
            normal_life: {
                id: 'normal_life',
                description: '平凡的生活',
                requiresAI: true,
                choices: [
                    {
                        id: 'end_story',
                        text: '结束这个故事',
                        nextNode: 'story_end',
                        effects: { acceptance: 1 }
                    },
                    {
                        id: 'restart',
                        text: '重新开始一段新的冒险',
                        nextNode: 'start',
                        effects: { new_beginning: 1 }
                    }
                ],
                fallbackContent: '你回到了平凡的生活，但有时会想起那段奇怪的经历...'
            },
            story_end: {
                id: 'story_end',
                description: '故事结束',
                requiresAI: false,
                content: '故事到此结束。感谢你体验这段冒险！',
                choices: [],
                fallbackContent: '故事结束。感谢你的阅读！'
            },
            // 其他节点可以根据需要继续添加
        };
    }
    
    getExampleContentTemplates() {
        return {
            rich: {
                format: 'detailed',
                length: 'medium',
                style: 'descriptive'
            },
            simple: {
                format: 'concise',
                length: 'short',
                style: 'direct'
            }
        };
    }
    
    getExampleIntroductionTemplates() {
        return '欢迎来到 Plotforge 交互式小说生成器！这是一个基于AI的故事体验平台，你可以通过自己的选择来引导故事的发展方向。每次选择都会影响故事的走向，创造出独一无二的阅读体验。点击下方按钮开始你的冒险吧！';
    }

    // 获取故事历史记录
    getStoryHistory() {
        try {
            // 从localStorage获取历史记录
            const historyJSON = localStorage.getItem('story_history') || '[]';
            return JSON.parse(historyJSON);
        } catch (error) {
            this.logDebugMessage('error', `获取故事历史记录失败: ${error.message}`);
            console.error('获取故事历史记录失败:', error);
            return [];
        }
    }
    
    // 获取节点总数
    getTotalNodesCount() {
        try {
            if (!this.nodeTemplates) {
                // 使用示例节点模板作为后备
                const exampleTemplates = this.getExampleNodeTemplates();
                return Object.keys(exampleTemplates).length;
            }
            return Object.keys(this.nodeTemplates).length;
        } catch (error) {
            console.error('获取节点总数失败:', error);
            return 15; // 返回一个默认值，基于示例节点模板的数量
        }
    }

    // 保存故事状态到历史记录
    saveStoryState() {
        try {
            const currentState = {
                timestamp: new Date().toISOString(),
                currentNode: this.currentNode,
                storyContent: this.storyContent,
                choices: this.choices,
                attributes: { ...this.attributes }
            };

            // 获取现有历史记录
            const history = this.getStoryHistory();
            
            // 添加新状态到历史记录
            history.push(currentState);
            
            // 保存回localStorage
            localStorage.setItem('story_history', JSON.stringify(history));
            
            this.logDebugMessage('info', '故事状态已保存到历史记录');
            return true;
        } catch (error) {
            this.logDebugMessage('error', `保存故事状态失败: ${error.message}`);
            console.error('保存故事状态失败:', error);
            return false;
        }
    }

    // 导出完整故事到文本文件
    exportFullStory() {
        try {
            // 获取所有保存的故事内容
            const fullStory = localStorage.getItem('yourstory') || '';
            
            if (!fullStory.trim()) {
                this.logDebugMessage('warning', '没有可导出的故事内容');
                return '没有可导出的故事内容';
            }

            this.logDebugMessage('info', `导出完整故事，长度: ${fullStory.length} 字符`);
            return fullStory;
        } catch (error) {
            this.logDebugMessage('error', `导出完整故事失败: ${error.message}`);
            console.error('导出完整故事失败:', error);
            return '导出故事失败，请检查控制台错误信息';
        }
    }

    // 下载故事到本地文件
    downloadStoryToFile(filename = 'story.json') {
        try {
            const storyContent = this.exportFullStory();
            
            if (storyContent === '没有可导出的故事内容') {
                this.logDebugMessage('warning', '没有故事内容可下载');
                return false;
            }

            // 创建下载链接
            const blob = new Blob([storyContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.logDebugMessage('success', `故事已下载到文件: ${filename}`);
            return true;
        } catch (error) {
            this.logDebugMessage('error', `下载故事到文件失败: ${error.message}`);
            console.error('下载故事到文件失败:', error);
            return false;
        }
    }

    // 清空故事历史记录
    clearStoryHistory() {
        try {
            localStorage.removeItem('story_history');
            localStorage.removeItem('yourstory');
            this.logDebugMessage('info', '故事历史记录已清空');
            return true;
        } catch (error) {
            this.logDebugMessage('error', `清空故事历史记录失败: ${error.message}`);
            console.error('清空故事历史记录失败:', error);
            return false;
        }
    }

    // 从状态中获取用户选择的选项
    getSelectedChoiceFromState() {
        try {
            // 首先尝试从URL参数获取
            const urlParams = new URLSearchParams(window.location.search);
            const choiceFromUrl = urlParams.get('choice');
            
            if (choiceFromUrl) {
                this.logDebugMessage('info', `从URL参数获取到用户选择: ${choiceFromUrl}`);
                return choiceFromUrl;
            }
            
            // 然后尝试从localStorage获取
            const choiceFromStorage = localStorage.getItem('lastSelectedChoice');
            if (choiceFromStorage) {
                try {
                    const choiceData = JSON.parse(choiceFromStorage);
                    this.logDebugMessage('info', `从localStorage获取到用户选择: ${choiceData.text}`);
                    return choiceData.text;
                } catch (parseError) {
                    console.warn('解析localStorage选择数据失败:', parseError);
                }
            }
            
            // 最后尝试从当前故事状态中获取
            if (this.storyState && this.storyState.lastChoice) {
                this.logDebugMessage('info', `从故事状态获取到用户选择: ${this.storyState.lastChoice}`);
                return this.storyState.lastChoice;
            }
            
            this.logDebugMessage('info', '未找到用户选择信息');
            return null;
        } catch (error) {
            this.logDebugMessage('error', `获取用户选择失败: ${error.message}`);
            console.error('获取用户选择失败:', error);
            return null;
        }
    }
}

// 导出类（如果环境支持）
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = StoryEngine;
}