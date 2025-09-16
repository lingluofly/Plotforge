// Plotforge 应用主文件

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async function() {
    // 获取DOM元素
    const startButton = document.getElementById('start-button');
    const storyIntro = document.getElementById('story-intro');
    const storyContent = document.getElementById('story-content');
    const storyLoading = document.getElementById('story-loading');
    const contentDisplay = document.getElementById('content-display');
    const choicesContainer = document.getElementById('choices-container');
    const storyTitle = document.getElementById('story-title');
    
    // 初始化故事引擎
    let storyEngine = null;
    
    // 检查是否有保存的故事进度
    function checkSavedProgress() {
        try {
            // 首先检查plotforgeStoryState
            const savedState = localStorage.getItem('plotforgeStoryState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // 检查数据完整性
                if (state && typeof state === 'object' && 
                    state.currentNode && typeof state.currentNode === 'string' &&
                    state.storyState && typeof state.storyState === 'object') {
                    return true;
                } else {
                    // 数据不完整，自动清理
                    console.warn('发现不完整的故事进度数据，自动清理');
                    clearSavedProgress();
                }
            }
            
            // 如果没有有效的plotforgeStoryState，检查story_history中是否有有效记录
            const historyJSON = localStorage.getItem('story_history') || '[]';
            const history = JSON.parse(historyJSON);
            
            // 检查是否有任何有效的历史记录（currentNode不为null）
            const hasValidHistory = history.some(item => item.currentNode !== null);
            
            if (hasValidHistory) {
                console.log('检测到有效的历史记录，可以载入');
                return true;
            }
            
        } catch (error) {
            console.warn('检查保存进度失败:', error);
            // 解析失败时也清理数据
            clearSavedProgress();
        }
        return false;
    }
    
    // 显示载入进度选择对话框
    function showLoadProgressDialog() {
        const modal = document.getElementById('load-progress-modal');
        const loadYesBtn = document.getElementById('load-progress-yes');
        const loadNoBtn = document.getElementById('load-progress-no');
        const modalTitle = modal.querySelector('h3');
        const modalText = modal.querySelector('p');
        
        // 检查是否有保存的进度
        const hasSavedProgress = checkSavedProgress();
        
        if (hasSavedProgress) {
            // 有保存的进度，显示正常的选择对话框
            modalTitle.textContent = '发现保存的进度';
            modalText.textContent = '检测到您有未完成的故事进度，是否要载入继续？';
            loadYesBtn.style.display = 'block';
            loadYesBtn.textContent = '载入进度';
            loadNoBtn.textContent = '放弃并重新开始';
            
            // 载入进度按钮事件
            loadYesBtn.onclick = async function() {
                console.log('载入进度按钮被点击');
                modal.classList.add('hidden');
                console.log('模态框已隐藏');
                await loadSavedProgress();
            };
            
            // 放弃进度按钮事件
            loadNoBtn.onclick = function() {
                console.log('放弃进度按钮被点击');
                modal.classList.add('hidden');
                console.log('模态框已隐藏');
                clearSavedProgress();
                startNewStoryFromBeginning();
            };
        } else {
            // 没有保存的进度，显示欢迎对话框
            modalTitle.textContent = '欢迎来到故事世界';
            modalText.textContent = '准备好开始新的冒险了吗？';
            loadYesBtn.style.display = 'none';
            loadNoBtn.textContent = '开始新故事';
            
            // 开始新故事按钮事件
            loadNoBtn.onclick = function() {
                console.log('开始新故事按钮被点击');
                modal.classList.add('hidden');
                console.log('模态框已隐藏');
                startNewStoryFromBeginning();
            };
        }
        
        modal.classList.remove('hidden');
    }
    
    // 载入保存的进度
    async function loadSavedProgress() {
        try {
            showSection(storyLoading);
            
            // 首先尝试从plotforgeStoryState载入
            storyEngine.loadStoryState();
            
            // 如果当前节点无效，尝试从历史记录中恢复
            if (!storyEngine.currentNode) {
                await restoreFromHistory();
                
                // 再次验证当前节点是否有效
                if (!storyEngine.currentNode) {
                    throw new Error('保存的进度数据不完整，无法载入');
                }
            }
            
            // 获取当前节点的内容
            const storyData = await storyEngine.getNodeContent(storyEngine.currentNode);
            
            // 显示故事内容
            displayStoryContent(storyData);
            showSection(storyContent);
            
            console.log('成功载入保存的进度');
        } catch (error) {
            console.error('载入进度失败:', error);
            contentDisplay.textContent = `抱歉，载入进度失败: ${error.message || '未知错误'}\n\n将开始新故事。`;
            clearSavedProgress();
            await startNewStoryFromBeginning();
        }
    }
    
    // 从历史记录中恢复故事状态
    async function restoreFromHistory() {
        try {
            const historyJSON = localStorage.getItem('story_history') || '[]';
            const history = JSON.parse(historyJSON);
            
            // 过滤出有效的历史记录（currentNode不为null）
            const validHistory = history.filter(item => item.currentNode !== null);
            
            if (validHistory.length === 0) {
                throw new Error('没有有效的历史记录可以恢复');
            }
            
            // 获取最新的有效历史记录
            const latestState = validHistory[validHistory.length - 1];
            
            // 恢复故事状态
            storyEngine.currentNode = latestState.currentNode;
            storyEngine.storyState = latestState.attributes || {};
            storyEngine.storyContent = latestState.storyContent || '';
            storyEngine.choices = latestState.choices || [];
            
            console.log('从历史记录恢复故事状态成功', latestState);
            
            // 保存恢复后的状态到plotforgeStoryState
            const stateToSave = {
                currentNode: storyEngine.currentNode,
                storyState: storyEngine.storyState,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('plotforgeStoryState', JSON.stringify(stateToSave));
            
            return true;
        } catch (error) {
            console.error('从历史记录恢复失败:', error);
            throw error;
        }
    }
    
    // 清空保存的进度
    function clearSavedProgress() {
        try {
            // 清理所有相关的存储数据
            localStorage.removeItem('plotforgeStoryState');
            localStorage.removeItem('story_history');
            localStorage.removeItem('yourstory');
            
            // 重置故事引擎状态
            if (storyEngine) {
                storyEngine.currentNode = null;
                storyEngine.storyState = {};
            }
            
            console.log('已清空所有保存的故事进度和相关数据');
        } catch (error) {
            console.warn('清空保存进度失败:', error);
        }
    }
    
    // 从开始处开始新故事
    async function startNewStoryFromBeginning() {
        try {
            showSection(storyLoading);
            const storyData = await storyEngine.startNewStory();
            displayStoryContent(storyData);
            showSection(storyContent);
        } catch (error) {
            console.error('开始新故事失败:', error);
            contentDisplay.textContent = '抱歉，开始新故事时发生错误。';
            showSection(storyContent);
        }
    }
    
    // 初始化应用
    async function initApp() {
        try {
            // 创建故事引擎实例
            storyEngine = new StoryEngine(config);
            
            // 初始化故事引擎
            const success = await storyEngine.init();
            
            if (success) {
                // 显示故事介绍
                contentDisplay.textContent = storyEngine.getStoryIntroduction();
                
                // 更新故事标题
                if (storyEngine.mainConfig && storyEngine.mainConfig.title) {
                    storyTitle.textContent = storyEngine.mainConfig.title;
                }
                
                // 设置开始按钮事件
                startButton.addEventListener('click', startStory);
                console.log('开始按钮事件已绑定');
                
                // 总是显示载入进度对话框
                showLoadProgressDialog();
                
                // 初始化故事预览
                if (typeof updateStoryPreview === 'function') {
                    updateStoryPreview();
                }
                
                console.log('Plotforge 应用初始化成功');
            } else {
                contentDisplay.textContent = '抱歉，应用初始化失败，请刷新页面重试。';
                console.error('Plotforge 应用初始化失败');
            }
        } catch (error) {
            contentDisplay.textContent = '抱歉，应用加载时发生错误，请刷新页面重试。';
            console.error('Plotforge 应用初始化错误:', error);
        }
    }
    
    // 开始故事
    async function startStory() {
        try {
            // 总是显示载入进度对话框
            showLoadProgressDialog();
        } catch (error) {
            console.error('开始故事失败:', error);
            contentDisplay.textContent = '抱歉，开始故事时发生错误。';
            showSection(storyContent);
        }
    }
    
    // 显示故事内容
    function displayStoryContent(storyData) {
        // 清空现有内容
        contentDisplay.innerHTML = '';
        choicesContainer.innerHTML = '';
        
        // 显示内容（使用innerHTML而不是textContent，避免HTML标签被转义）
        contentDisplay.innerHTML = storyData.content;
        
        // 更新预览窗口
        if (typeof updatePreview === 'function') {
            updatePreview(storyData);
        }
        
        // 自动保存故事状态
        try {
            if (storyEngine && typeof storyEngine.saveStoryState === 'function') {
                storyEngine.saveStoryState();
                console.log('故事状态已自动保存');
            }
        } catch (saveError) {
            console.warn('自动保存失败:', saveError);
        }
        
        // 显示选择选项
        if (storyData.choices && storyData.choices.length > 0) {
            storyData.choices.forEach((choice, index) => {
                const choiceButton = createChoiceButton(choice, index + 1);
                choicesContainer.appendChild(choiceButton);
            });
        } else {
            // 如果没有选择，显示结束按钮
            const endButton = document.createElement('button');
            endButton.className = 'btn-primary';
            endButton.textContent = '返回开始';
            endButton.addEventListener('click', function() {
                showSection(storyIntro);
            });
            choicesContainer.appendChild(endButton);
        }
    }
    
    // 创建选择按钮
    function createChoiceButton(choice, index) {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = `${index}. ${choice.text}`;
        button.dataset.disabled = 'false'; // 初始化按钮状态
        
        // 处理选择
    button.addEventListener('click', async function() {
        // 检查按钮是否处于冷却状态
        if (button.dataset.disabled === 'true') {
            return;
        }
        
        try {
            // 设置按钮为冷却状态
            button.dataset.disabled = 'true';
            button.classList.add('disabled');
            
            // 显示加载状态
            showSection(storyLoading);
            
            // 验证选择对象
            if (!choice || typeof choice !== 'object' || !choice.nextNode) {
                console.error('无效的选择对象:', choice);
                throw new Error('无效的选择配置');
            }
            
            // 记录选择信息
            console.log(`用户选择: ${choice.text || choice.id || choice.nextNode}`);
            
            // 保存用户选择到URL参数，让AI知道用户的选择
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('choice', choice.text);
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
            
            // 同时保存到localStorage作为备用
            localStorage.setItem('lastSelectedChoice', JSON.stringify({
                text: choice.text,
                timestamp: new Date().toISOString()
            }));
            
            // 处理选择
            const storyData = await storyEngine.handleChoice(choice);
            
            // 验证返回的故事数据
            if (!storyData || !storyData.content) {
                console.error('无效的故事数据:', storyData);
                throw new Error('故事内容为空');
            }
            
            // 显示新内容
            displayStoryContent(storyData);
            
            // 切换回内容区域
            showSection(storyContent);
            
            // 保存故事状态
            try {
                storyEngine.saveStoryState();
            } catch (saveError) {
                console.warn('保存故事状态失败:', saveError);
                // 即使保存失败也继续执行
            }
        } catch (error) {
            console.error('处理选择失败:', error);
            
            // 显示友好的错误信息
            contentDisplay.textContent = `抱歉，处理你的选择时发生错误: ${error.message || '未知错误'}\n\n请尝试刷新页面或选择其他选项。`;
            
            // 显示一个返回开始的选项
            choicesContainer.innerHTML = '';
            const restartButton = document.createElement('button');
            restartButton.className = 'btn-primary';
            restartButton.textContent = '返回故事开始';
            restartButton.addEventListener('click', function() {
                showSection(storyIntro);
            });
            choicesContainer.appendChild(restartButton);
            
            showSection(storyContent);
        } finally {
            // 1秒后恢复按钮状态
            setTimeout(() => {
                button.dataset.disabled = 'false';
                button.classList.remove('disabled');
            }, 1000);
        }
    });
        
        return button;
    }
    
    // 显示指定区域
    function showSection(section) {
        // 隐藏所有区域
        const sections = [storyIntro, storyContent, storyLoading];
        sections.forEach(s => s.classList.add('hidden'));
        
        // 显示指定区域
        section.classList.remove('hidden');
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // 添加键盘快捷键支持
    function addKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // 1-9 键选择选项
            if (e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                const choiceButtons = document.querySelectorAll('.choice-btn:not([data-disabled="true"])');
                if (choiceButtons[index]) {
                    choiceButtons[index].click();
                }
            }
            
            // 空格键开始故事
            if (e.code === 'Space' && !storyIntro.classList.contains('hidden')) {
                startButton.click();
                e.preventDefault();
            }
        });
    }
    
    // 初始化预览窗口
    function initPreviewPanel() {
        const previewPanel = document.getElementById('preview-panel');
        const previewContent = document.getElementById('preview-content');
        const currentChapter = document.getElementById('current-chapter');
        const saveButton = document.getElementById('save-story');
        const exportButton = document.getElementById('export-story');
        const historyList = document.getElementById('history-list');
        
        // 更新预览窗口内容
    function updatePreview(storyData) {
        if (storyData && storyData.content) {
            previewContent.textContent = storyData.content;
            
            // 更新进度信息
            if (storyEngine && storyEngine.currentNode) {
                currentChapter.textContent = `当前节点: ${storyEngine.currentNode}`;
            }
            
            // 更新历史记录
            updateHistoryList();
            
            // 更新故事内容预览
            updateStoryPreview();
        }
    }
    
    // 更新故事内容预览
    function updateStoryPreview() {
        const storyPreview = document.getElementById('story-preview');
        if (!storyPreview) return;
        
        try {
            const savedState = localStorage.getItem('plotforgeStoryState');
            if (savedState) {
                const state = JSON.parse(savedState);
                if (state && state.storyState && state.storyState.history) {
                    // 获取最新的故事内容
                    const latestHistory = state.storyState.history.slice(-1)[0];
                    if (latestHistory && latestHistory.content) {
                        storyPreview.textContent = latestHistory.content;
                        return;
                    }
                }
            }
            
            // 如果没有保存的内容，显示默认提示
            storyPreview.textContent = '暂无保存的故事内容';
        } catch (error) {
            console.warn('更新故事预览失败:', error);
            storyPreview.textContent = '加载预览内容失败';
        }
    }
        
        // 更新历史记录列表
        function updateHistoryList() {
            historyList.innerHTML = '';
            
            // 获取历史记录
            const history = storyEngine ? storyEngine.getStoryHistory() : [];
            
            if (history.length === 0) {
                const emptyItem = document.createElement('li');
                emptyItem.textContent = '暂无历史记录';
                emptyItem.className = 'history-empty';
                historyList.appendChild(emptyItem);
                return;
            }
            
            // 显示最近10条历史记录
            history.slice(-10).forEach((item, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'history-item';
                
                const timeSpan = document.createElement('span');
                timeSpan.className = 'history-time';
                timeSpan.textContent = item.time || `节点 ${index + 1}`;
                
                const contentSpan = document.createElement('span');
                contentSpan.className = 'history-content';
                contentSpan.textContent = item.content ? 
                    (item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content) : 
                    '无内容';
                
                listItem.appendChild(timeSpan);
                listItem.appendChild(contentSpan);
                historyList.appendChild(listItem);
            });
        }
        
        // 保存故事到本地文件
        saveButton.addEventListener('click', function() {
            try {
                const storyState = storyEngine ? storyEngine.getStoryState() : null;
                if (storyState) {
                    const blob = new Blob([JSON.stringify(storyState, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'story.json';
                    document.body.appendChild(a);
                    a.click();
                    
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    // 显示保存成功提示
                    showSaveSuccess();
                    console.log('故事已保存到 story.json');
                } else {
                    console.warn('没有故事状态可保存');
                }
            } catch (error) {
                console.error('保存故事失败:', error);
            }
        });
        
        // 导出故事为文本文件
        exportButton.addEventListener('click', function() {
            try {
                const fullStory = storyEngine ? storyEngine.exportFullStory() : '没有故事内容';
                const blob = new Blob([fullStory], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'yourstory.txt';
                document.body.appendChild(a);
                a.click();
                
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log('故事已导出到 yourstory.txt');
            } catch (error) {
                console.error('导出故事失败:', error);
            }
        });
        
        // 显示保存成功提示
        function showSaveSuccess() {
            const successMsg = document.createElement('div');
            successMsg.className = 'save-success';
            successMsg.textContent = '✓ 故事已保存到 story.json';
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 1000;
                animation: fadeInOut 3s ease-in-out;
            `;
            
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
                if (document.body.contains(successMsg)) {
                    document.body.removeChild(successMsg);
                }
            }, 3000);
        }
        
        // 初始更新
        updatePreview(null);
    }
    
    // 初始化调试窗口
    function initDebugPanel() {
        const debugPanel = document.getElementById('debug-panel');
        const debugContent = document.getElementById('debug-content');
        const toggleButton = document.getElementById('toggle-debug');
        
        // 默认隐藏调试窗口（通过控制台函数显示）
        let isVisible = false;
        debugPanel.style.display = 'none';
        toggleButton.textContent = '显示调试';
        
        // 切换调试窗口显示状态
        toggleButton.addEventListener('click', () => {
            isVisible = !isVisible;
            if (isVisible) {
                debugPanel.style.display = 'block';
                debugContent.style.display = 'block';
                toggleButton.textContent = '隐藏调试';
            } else {
                debugPanel.style.display = 'none';
                toggleButton.textContent = '显示调试';
            }
        });
        
        // 监听调试信息事件
        window.addEventListener('debugMessage', (event) => {
            const { time, type, content } = event.detail;
            
            // 创建调试信息元素
            const messageElement = document.createElement('div');
            messageElement.classList.add('debug-message');
            
            // 添加时间戳和消息内容
            const timeSpan = document.createElement('span');
            timeSpan.classList.add('debug-time');
            timeSpan.textContent = time;
            
            const contentSpan = document.createElement('span');
            contentSpan.classList.add(`debug-${type}`);
            contentSpan.textContent = content;
            
            messageElement.appendChild(timeSpan);
            messageElement.appendChild(contentSpan);
            
            // 添加到调试内容区域
            debugContent.appendChild(messageElement);
            
            // 滚动到底部（使用requestAnimationFrame确保DOM更新完成）
            requestAnimationFrame(() => {
                debugContent.scrollTop = debugContent.scrollHeight;
            });
        });
        
        // 添加清空调试信息的按钮
        const clearButton = document.createElement('button');
        clearButton.classList.add('debug-toggle');
        clearButton.textContent = '清空';
        clearButton.style.marginLeft = '10px';
        
        clearButton.addEventListener('click', () => {
            debugContent.innerHTML = '';
        });
        
        toggleButton.parentNode.appendChild(clearButton);
        
        // 添加下载故事内容的功能
        const downloadButton = document.createElement('button');
        downloadButton.classList.add('debug-toggle');
        downloadButton.textContent = '下载故事';
        downloadButton.style.marginLeft = '10px';
        
        downloadButton.addEventListener('click', () => {
            try {
                const storyContent = localStorage.getItem('yourstory') || '没有找到故事内容';
                const blob = new Blob([storyContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'yourstory.txt';
                document.body.appendChild(a);
                a.click();
                
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                logToDebug('info', '故事内容已下载到 yourstory.txt');
            } catch (error) {
                logToDebug('error', `下载故事内容失败: ${error.message}`);
                console.error('下载故事内容失败:', error);
            }
        });
        
        toggleButton.parentNode.appendChild(downloadButton);
    }
    
    // 记录调试信息的辅助函数
    function logToDebug(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const debugMessage = {
            time: timestamp,
            type: type,
            content: message
        };
        
        const event = new CustomEvent('debugMessage', {
            detail: debugMessage
        });
        window.dispatchEvent(event);
    }
    
    // 添加API密钥输入功能
    function addApiKeyInput() {
        // 检查是否已设置API密钥
        if (!config.ai.apiKey) {
            const apiKey = localStorage.getItem('qwenApiKey');
            if (apiKey) {
                config.ai.apiKey = apiKey;
            } else {
                // 提示用户输入API密钥
                const userInput = prompt('请输入你的qwen-plus API密钥以使用AI生成功能：');
                if (userInput) {
                    config.ai.apiKey = userInput;
                    localStorage.setItem('qwenApiKey', userInput);
                }
            }
        }
    }
    
    // 初始化应用
    addApiKeyInput();
    addKeyboardShortcuts();
    
    // 尝试初始化预览面板
    try {
        initPreviewPanel();
    } catch (error) {
        console.warn('预览面板初始化失败:', error);
    }
    
    // 尝试初始化调试面板
    try {
        initDebugPanel();
    } catch (error) {
        console.warn('调试面板初始化失败:', error);
    }

    // 全局调试面板切换函数
    window.toggleDebugPanel = function() {
        const debugPanel = document.getElementById('debug-panel');
        const debugContent = document.getElementById('debug-content');
        const toggleButton = document.getElementById('toggle-debug');
        
        if (debugPanel && debugContent && toggleButton) {
            const isVisible = debugPanel.style.display !== 'none';
            if (isVisible) {
                debugPanel.style.display = 'none';
                toggleButton.textContent = '显示调试';
            } else {
                debugPanel.style.display = 'block';
                debugContent.style.display = 'block';
                toggleButton.textContent = '隐藏调试';
            }
        } else {
            console.warn('调试面板元素未找到');
        }
    };
    
    // 为开始按钮添加冷却功能
    startButton.addEventListener('click', function() {
        startButton.disabled = true;
        startButton.classList.add('disabled');
        setTimeout(() => {
            startButton.disabled = false;
            startButton.classList.remove('disabled');
        }, 1000);
    });
    
    await initApp();
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('应用错误:', e.error);
    alert('应用运行时发生错误，请刷新页面重试。\n错误信息：' + e.error.message);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise错误:', e.reason);
    alert('应用运行时发生错误，请刷新页面重试。\n错误信息：' + e.reason.message);
});