@echo off
echo 启动阿里云DashScope API代理服务器...
echo.

REM 设置环境变量（从.env文件加载）
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="DASHSCOPE_API_KEY" set DASHSCOPE_API_KEY=%%b
        if "%%a"=="PROXY_PORT" set PROXY_PORT=%%b
    )
)

REM 设置默认值
if not defined PROXY_PORT set PROXY_PORT=9547

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.7+
    pause
    exit /b 1
)

REM 安装必要的Python包
echo 正在安装必要的Python依赖包...
pip install flask flask-cors requests

REM 启动代理服务器
echo.
echo 启动代理服务器 (端口: %PROXY_PORT%)...
echo 代理目标: https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
echo.
echo 请确保已设置正确的DASHSCOPE_API_KEY环境变量
echo 当前API密钥: %DASHSCOPE_API_KEY%
echo.
echo 按 Ctrl+C 停止服务器
echo.

python proxy_server.py

pause