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
    
    // 历史故事章节数据
    let storyChapters = [];
    let currentChapterIndex = 0;
    
    // 初始化预览功能
    initPreviewFunctionality();
    function initPreviewFunctionality() {
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        
        prevBtn.addEventListener('click', () => navigateChapter(-1));
        nextBtn.addEventListener('click', () => navigateChapter(1));
        
        // 初始加载历史故事
        loadStoryChapters();
    }
    
    // 加载历史故事章节
    function loadStoryChapters() {
        try {
            // 加载历史数据 - 从localStorage获取
            const storyHistory = localStorage.getItem('story_history');
            if (storyHistory) {
                const history = JSON.parse(storyHistory);
                storyChapters = history.filter(item => item.content && item.content.trim() !== '');
                
                if (storyChapters.length > 0) {
                    currentChapterIndex = storyChapters.length - 1; // 默认显示最新一章
                    updateChapterNavigation();
                    showChapterContent(currentChapterIndex);
                } else {
                    updateChapterNavigation();
                }
            } else {
                // 如果没有历史数据，清空章节列表
                storyChapters = [];
                updateChapterNavigation();
            }
        } catch (error) {
            console.warn('加载历史故事章节失败:', error);
            storyChapters = [];
            updateChapterNavigation();
        }
    }
    
    // 导航章节
    function navigateChapter(direction) {
        const newIndex = currentChapterIndex + direction;
        if (newIndex >= 0 && newIndex < storyChapters.length) {
            currentChapterIndex = newIndex;
            showChapterContent(currentChapterIndex);
            updateChapterNavigation();
        }
    }
    
    // 显示章节内容
    function showChapterContent(index) {
        const previewElement = document.getElementById('story-preview');
        if (storyChapters[index]) {
            const chapter = storyChapters[index];
            previewElement.innerHTML = `
                <div class="chapter-content">
                    <p class="chapter-text">${chapter.content.replace(/\n/g, '<br>')}</p>
                    ${chapter.choices && chapter.choices.length > 0 ? 
                        `<div class="chapter-choices">
                            <strong>选择：</strong>
                            ${chapter.choices.map(choice => 
                                `<span class="choice-tag">${choice.text}</span>`
                            ).join(' ')}
                         </div>` : ''
                    }
                    <div class="chapter-meta">
                        <small>节点: ${chapter.currentNode || '未知'}</small>
                        ${chapter.timestamp ? 
                            `<small>时间: ${new Date(chapter.timestamp).toLocaleString()}</small>` : ''
                        }
                    </div>
                </div>
            `;
        } else {
            previewElement.innerHTML = '<p>暂无故事内容</p>';
        }
    }
    
    // 更新章节导航状态
    function updateChapterNavigation() {
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        const currentNum = document.getElementById('current-chapter-num');
        const totalNum = document.getElementById('total-chapters-num');
        
        prevBtn.disabled = currentChapterIndex <= 0;
        nextBtn.disabled = currentChapterIndex >= storyChapters.length - 1;
        currentNum.textContent = storyChapters.length > 0 ? currentChapterIndex + 1 : 0;
        totalNum.textContent = storyChapters.length;
    }
    
    // 刷新预览内容（当新内容生成时调用）
    function refreshPreview() {
        loadStoryChapters();
    }
    
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
                
                // 初始化调试面板（在应用核心初始化成功后）
                try {
                    initDebugPanel();
                } catch (error) {
                    console.warn('调试面板初始化失败:', error);
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
        
        // 刷新故事预览内容
        refreshPreview();
        
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
        const totalChapters = document.getElementById('total-chapters');
        const currentChapterNum = document.getElementById('current-chapter-num');
        const totalChaptersNum = document.getElementById('total-chapters-num');
        const storyPreview = document.getElementById('story-preview');
        const prevChapterBtn = document.getElementById('prev-chapter');
        const nextChapterBtn = document.getElementById('next-chapter');
        const chapterIndicator = document.getElementById('chapter-indicator');
        const previewActions = document.querySelector('.preview-actions');
        
        // 章节历史记录（仅用于保存和加载，不再显示历史列表）
        let chapterHistory = [];
        let currentChapterIndex = -1;
        
        // 在预览窗口下方添加下载按钮
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'download-story-btn';
        downloadBtn.className = 'btn-primary';
        downloadBtn.textContent = '下载故事';
        downloadBtn.style.margin = '10px 0';
        downloadBtn.addEventListener('click', window.downloadStory);
        
        if (previewActions) {
            previewActions.appendChild(downloadBtn);
        } else {
            console.warn('预览操作区域未找到，无法添加下载按钮');
        }
        
        // 更新预览窗口内容
        function updatePreview(storyData) {
            if (storyData && storyData.content) {
                // 添加到章节历史
                const chapterData = {
                    content: storyData.content,
                    timestamp: new Date().toLocaleTimeString(),
                    node: storyEngine ? storyEngine.currentNode : 'unknown'
                };
                
                chapterHistory.push(chapterData);
                currentChapterIndex = chapterHistory.length - 1;
                
                // 更新故事内容预览
                updateStoryPreview(chapterData);
                
                // 更新进度信息
                updateProgressInfo();
                
                // 更新导航按钮状态
                updateNavigationButtons();
            }
        }
        
        // 更新故事内容预览
        function updateStoryPreview(chapterData) {
            if (!storyPreview) return;
            
            try {
                if (chapterData && chapterData.content) {
                    storyPreview.innerHTML = `<div class="preview-chapter">
                        <div class="preview-time">${chapterData.timestamp}</div>
                        <div class="preview-content-text">${chapterData.content}</div>
                    </div>`;
                } else {
                    // 尝试从localStorage获取完整故事
                    const fullStory = localStorage.getItem('yourstory');
                    if (fullStory) {
                        storyPreview.innerHTML = `<div class="preview-chapter">
                            <div class="preview-content-text">${fullStory}</div>
                        </div>`;
                    } else {
                        storyPreview.innerHTML = '<p>暂无保存的故事内容</p>';
                    }
                }
            } catch (error) {
                console.warn('更新故事预览失败:', error);
                storyPreview.innerHTML = '<p>加载预览内容失败</p>';
            }
        }
        
        // 更新进度信息
        function updateProgressInfo() {
            if (storyEngine && storyEngine.currentNode) {
                currentChapter.textContent = `当前节点: ${storyEngine.currentNode}`;
            }
            
            if (chapterHistory.length > 0) {
                // 显示章节进度
                currentChapterNum.textContent = currentChapterIndex + 1;
                totalChaptersNum.textContent = chapterHistory.length;
                
                // 将进度与节点数绑定
                try {
                    if (storyEngine) {
                        // 获取访问过的唯一节点数
                        const visitedNodes = new Set();
                        chapterHistory.forEach(chapter => {
                            if (chapter.node) {
                                visitedNodes.add(chapter.node);
                            }
                        });
                        
                        // 获取总节点数
                        const totalNodes = storyEngine.getTotalNodesCount();
                        const visitedNodesCount = visitedNodes.size;
                        
                        // 计算进度百分比
                        const progressPercentage = Math.min(Math.round((visitedNodesCount / totalNodes) * 100), 100);
                        
                        // 更新进度显示
                        totalChapters.textContent = `总章节: ${chapterHistory.length} | 进度: ${visitedNodesCount}/${totalNodes} (${progressPercentage}%)`;
                    } else {
                        // 回退到原始显示
                        totalChapters.textContent = `总章节: ${chapterHistory.length}`;
                    }
                } catch (error) {
                    console.warn('更新节点进度失败:', error);
                    // 发生错误时回退到原始显示
                    totalChapters.textContent = `总章节: ${chapterHistory.length}`;
                }
            } else {
                currentChapterNum.textContent = '0';
                totalChaptersNum.textContent = '0';
                totalChapters.textContent = '总章节: 0 | 进度: 0%';
            }
        }
        
        // 更新导航按钮状态
        function updateNavigationButtons() {
            prevChapterBtn.disabled = currentChapterIndex <= 0;
            nextChapterBtn.disabled = currentChapterIndex >= chapterHistory.length - 1;
        }
        
        // 章节导航事件
        prevChapterBtn.addEventListener('click', () => {
            if (currentChapterIndex > 0) {
                currentChapterIndex--;
                updateStoryPreview(chapterHistory[currentChapterIndex]);
                updateNavigationButtons();
            }
        });
        
        nextChapterBtn.addEventListener('click', () => {
            if (currentChapterIndex < chapterHistory.length - 1) {
                currentChapterIndex++;
                updateStoryPreview(chapterHistory[currentChapterIndex]);
                updateNavigationButtons();
            }
        });
        
        // 更新历史记录（仅用于数据维护，不再显示UI）
        function updateHistoryList() {
            // 不再更新UI显示，仅维护历史记录数据
        }
        
        // 初始更新
        updateProgressInfo();
        updateNavigationButtons();
        
        // 尝试加载已有的故事内容
        try {
            const savedState = localStorage.getItem('plotforgeStoryState');
            if (savedState) {
                const state = JSON.parse(savedState);
                if (state && state.storyState && state.storyState.history) {
                    // 从保存的状态中恢复章节历史
                    state.storyState.history.forEach(item => {
                        if (item.content) {
                            chapterHistory.push({
                                content: item.content,
                                timestamp: item.timestamp || new Date().toLocaleTimeString(),
                                node: item.node || 'saved'
                            });
                        }
                    });
                    
                    if (chapterHistory.length > 0) {
                        currentChapterIndex = chapterHistory.length - 1;
                        updateStoryPreview(chapterHistory[currentChapterIndex]);
                    }
                }
            }
        } catch (error) {
            console.warn('加载保存的故事状态失败:', error);
        }
    }
        // 显示保存成功提示
        function showSaveSuccess() {
            // 保留函数但不再使用
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
                // 使用更友好的方式提示用户输入API密钥
                const apiKeyModal = document.createElement('div');
                apiKeyModal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                `;
                
                const apiKeyForm = document.createElement('div');
                apiKeyForm.style.cssText = `
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    width: 300px;
                    text-align: center;
                `;
                
                apiKeyForm.innerHTML = `
                    <h3>API密钥设置</h3>
                    <p>请输入你的qwen-plus API密钥以使用AI生成功能：</p>
                    <input type="password" id="api-key-input" style="width: 90%; padding: 8px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px;">
                    <div style="margin-top: 15px;">
                        <button id="api-key-submit" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">确认</button>
                        <button id="api-key-skip" style="padding: 8px 16px; margin-left: 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">跳过</button>
                    </div>
                `;
                
                apiKeyModal.appendChild(apiKeyForm);
                document.body.appendChild(apiKeyModal);
                
                const apiKeyInput = document.getElementById('api-key-input');
                const submitBtn = document.getElementById('api-key-submit');
                const skipBtn = document.getElementById('api-key-skip');
                
                submitBtn.addEventListener('click', function() {
                    const key = apiKeyInput.value.trim();
                    if (key) {
                        config.ai.apiKey = key;
                        localStorage.setItem('qwenApiKey', key);
                        document.body.removeChild(apiKeyModal);
                    } else {
                        alert('请输入有效的API密钥');
                    }
                });
                
                skipBtn.addEventListener('click', function() {
                    document.body.removeChild(apiKeyModal);
                    console.log('用户选择跳过API密钥设置');
                });
                
                // 自动聚焦到输入框
                setTimeout(() => {
                    apiKeyInput.focus();
                }, 100);
            }
        }
    }
    
    // 初始化核心应用
    await initApp();
    
    // 添加其他功能
    addApiKeyInput();
    addKeyboardShortcuts();
    
    // 尝试初始化预览面板
    try {
        initPreviewPanel();
    } catch (error) {
        console.warn('预览面板初始化失败:', error);
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
    

    
});

// 错误处理
    window.addEventListener('error', function(e) {
        console.error('应用错误:', e.error);
        alert('应用运行时发生错误，请刷新页面重试。\n错误信息：' + e.error.message);
    });

    // 全局下载故事函数
    window.downloadStory = function() {
        try {
            // 尝试从localStorage获取故事内容
            const storyContent = localStorage.getItem('yourstory') || '没有找到故事内容';
            const blob = new Blob([storyContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'yourstory.txt';
            document.body.appendChild(a);
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log('故事内容已下载到 yourstory.txt');
        } catch (error) {
            console.error('下载故事内容失败:', error);
            alert('下载故事内容失败，请重试。\n错误信息：' + error.message);
        }
    };

    window.addEventListener('unhandledrejection', function(e) {
        console.error('未处理的Promise错误:', e.reason);
        alert('应用运行时发生错误，请刷新页面重试。\n错误信息：' + e.reason.message);
    });