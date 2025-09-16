# Plotforge 交互式小说生成器 - 操作文档

## 快速开始

### 1. 启动前端服务器
```powershell
# 进入项目目录
cd E:\alwaysused\TRAE项目\Plotforge

# 启动前端HTTP服务器（端口8001）
python -m http.server 8001
```

### 2. 启动代理服务器（可选）
```powershell
# 进入代理服务器目录
cd E:\alwaysused\TRAE项目\Plotforge\proxy

# 启动代理服务器（端口8001）
python proxy_server.py
```

### 3. 访问应用
打开浏览器访问：http://localhost:8001

## 服务器启动说明

### 前端服务器 (Web Server)
- **端口**: 8001
- **作用**: 提供静态文件服务，运行前端界面
- **启动命令**: `python -m http.server 8001`
- **访问地址**: http://localhost:8001

### 代理服务器 (Proxy Server)
- **端口**: 8001（与前端服务器相同，但需要分别启动）
- **作用**: 转发API请求到qwen-plus服务，解决跨域问题
- **启动命令**: `python proxy_server.py`
- **配置文件**: `proxy/.env`（需要配置API密钥）

## 使用注意事项

### 1. 端口冲突处理
如果端口8001已被占用，可以：
- 修改前端服务器端口：`python -m http.server 8080`
- 修改代理服务器端口：编辑 `proxy_server.py` 中的端口配置
- 使用其他可用端口

### 2. API密钥配置
在使用AI功能前，需要：
1. 获取qwen-plus API密钥
2. 在首次使用时通过界面输入API密钥
3. 或者直接在 `js/config.js` 中配置API密钥

### 3. 浏览器要求
- 建议使用现代浏览器（Chrome、Firefox、Edge等）
- 确保JavaScript功能已启用
- 允许本地存储（localStorage）

### 4. 文件路径说明
- 项目根目录：`E:\alwaysused\TRAE项目\Plotforge`
- 代理服务器目录：`E:\alwaysused\TRAE项目\Plotforge\proxy`
- 配置文件目录：`E:\alwaysused\TRAE项目\Plotforge\someconfigs`

### 5. 常见问题

#### Q: 服务器启动失败
A: 检查Python是否安装，端口是否被占用

#### Q: API调用失败
A: 检查API密钥是否正确，网络连接是否正常

#### Q: 页面无法访问
A: 确认服务器已启动，检查防火墙设置

#### Q: 故事进度丢失
A: 进度保存在浏览器localStorage中，清除浏览器数据会导致丢失

## 快捷命令

### 检查服务器状态
```powershell
# 检查端口8001使用情况
netstat -ano | findstr ":8001"

# 检查Python进程
tasklist | findstr "python"
```

### 停止所有服务器
```powershell
# 停止所有Python进程
taskkill /f /im python.exe
```

## 项目结构
```
Plotforge/
├── css/                  # 样式文件
│   └── style.css         # 主样式文件
├── js/                   # JavaScript文件
│   ├── config.js         # 配置文件
│   ├── story-engine.js   # 故事引擎核心逻辑
│   └── app.js            # 应用主文件
├── proxy/                # 代理服务器
│   ├── .env              # 环境配置
│   ├── proxy_server.py   # 代理服务器
│   └── start_proxy.bat   # 代理启动脚本
├── someconfigs/          # 配置文件模板
│   ├── config.json       # 主配置文件
│   ├── Character.txt     # 人物模板
│   ├── Framework.txt     # 框架/背景模板
│   ├── Node.txt          # 节点模板
│   ├── Content.txt       # 内容模板
│   └── Introduction.txt  # 简介模板
├── index.html            # 主HTML文件
├── start_frontend.bat    # 前端启动脚本
└── readme.md             # 操作文档
```

## 技术支持

如果遇到问题，请：
1. 检查本操作文档中的常见问题部分
2. 确认服务器是否正常启动
3. 检查浏览器控制台是否有错误信息
4. 确认网络连接和API密钥配置

## AI调试功能说明

### 调试面板功能
Plotforge 提供了内置的AI调试功能，可以通过以下方式访问：

1. **打开调试面板**: 在浏览器控制台中输入 `toggleDebugPanel()` 或按 `Ctrl+Shift+D` 快捷键
2. **查看调试信息**: 调试面板显示API调用状态、错误信息、故事生成进度等
3. **手动触发调试**: 在代码中调用 `storyEngine.logDebugMessage(level, message)` 记录调试信息

### 调试级别
- `info`: 一般信息日志
- `warning`: 警告信息
- `error`: 错误信息
- `success`: 成功操作信息

### 调试信息存储
所有调试信息都保存在浏览器的localStorage中，可以通过以下方式访问：
```javascript
// 获取调试日志
const debugLogs = localStorage.getItem('debug_logs') || '[]';
const logs = JSON.parse(debugLogs);

// 清空调试日志
localStorage.removeItem('debug_logs');
```

### 调试功能使用示例
```javascript
// 记录API调用信息
storyEngine.logDebugMessage('info', '开始调用qwen-plus API');

// 记录错误信息
storyEngine.logDebugMessage('error', 'API调用失败: 网络连接错误');

// 记录成功信息
storyEngine.logDebugMessage('success', '故事内容生成成功');
```

### 注意事项
- 调试功能默认处于注释状态，需要时取消注释即可使用
- 调试信息可能包含敏感数据，生产环境中建议禁用
- 调试面板可以通过CSS样式自定义外观

## 版本信息
- 当前版本：v1.0.0
- 最新更新：2025年9月16日

---
*注意：详细的项目需求和技术说明请查看 `PROJECT_REQUIREMENTS.md` 文件*