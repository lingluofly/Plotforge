# 阿里云DashScope API代理服务器

## 概述

这个代理服务器解决了前端应用直接调用阿里云DashScope API时的CORS（跨域资源共享）问题。

## 安装依赖

```bash
pip install flask flask-cors requests
```

## 配置

1. 编辑 `proxy/.env` 文件，设置您的阿里云DashScope API密钥：
   ```
   DASHSCOPE_API_KEY=您的实际API密钥
   ```

2. 或者通过环境变量设置：
   ```bash
   set DASHSCOPE_API_KEY=您的实际API密钥
   ```

## 启动代理服务器

### Windows系统
双击运行 `start_proxy.bat` 文件

### 手动启动
```bash
cd proxy
python proxy_server.py
```

服务器将在 http://localhost:8001 启动

## 健康检查

访问 http://localhost:8001/health 检查服务器状态

## API端点

- `POST /api/proxy/dashscope` - 代理阿里云DashScope API调用

## 前端修改

前端代码已修改为使用代理服务器：
- 原来的直接API调用：`https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`
- 修改后的代理调用：`http://localhost:8001/api/proxy/dashscope`

## 故障排除

1. **端口冲突**：如果8001端口被占用，修改 `.env` 文件中的 `PROXY_PORT` 变量
2. **API密钥错误**：确保设置了正确的 `DASHSCOPE_API_KEY`
3. **Python依赖问题**：运行 `pip install -r requirements.txt` 安装所有依赖

## 安全说明

- API密钥通过HTTP头传递，不会暴露在前端代码中
- 代理服务器启用了CORS，允许前端应用跨域访问
- 建议在生产环境中使用HTTPS和适当的认证机制