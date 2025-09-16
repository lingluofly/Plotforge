#!/usr/bin/env python3
"""
阿里云DashScope API代理服务器
解决前端直接调用API时的CORS跨域问题
"""

import os
import json
import logging
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 启用CORS支持

# 阿里云DashScope API配置
# 支持两种模式：原始API模式和兼容模式
DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
DASHSCOPE_COMPATIBLE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({"status": "ok", "message": "Proxy server is running"})

@app.route('/api/proxy/dashscope', methods=['POST'])
def proxy_dashscope():
    """
    代理阿里云DashScope API调用
    """
    try:
        # 获取请求数据
        request_data = request.get_json()
        if not request_data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        logger.info(f"收到代理请求: {json.dumps(request_data, ensure_ascii=False)[:200]}...")
        
        # 从请求头获取API密钥，如果没有则从环境变量获取
        api_key = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not api_key:
            # 如果没有提供API密钥，尝试从环境变量获取
            api_key = os.environ.get('DASHSCOPE_API_KEY', '')
            if not api_key:
                return jsonify({"error": "API key is required"}), 401
        
        # 构建请求头
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        # 检测请求格式并转发到正确的API端点
        target_url = DASHSCOPE_BASE_URL
        
        # 检测是否为兼容模式格式（包含'messages'字段）
        if 'messages' in request_data:
            target_url = DASHSCOPE_COMPATIBLE_URL
            logger.info(f"检测到兼容模式格式，转发到: {target_url}")
        else:
            logger.info(f"检测到原始API格式，转发到: {target_url}")
        
        # 转发请求到阿里云DashScope API
        response = requests.post(
            target_url,
            headers=headers,
            json=request_data,
            timeout=30  # 30秒超时
        )
        
        logger.info(f"阿里云API响应状态: {response.status_code}")
        
        # 返回响应
        if response.status_code == 200:
            result = response.json()
            return jsonify(result)
        else:
            error_msg = f"阿里云API错误: {response.status_code} - {response.text}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), response.status_code
            
    except requests.exceptions.Timeout:
        error_msg = "请求超时，请稍后重试"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 504
        
    except requests.exceptions.RequestException as e:
        error_msg = f"网络请求错误: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 502
        
    except Exception as e:
        error_msg = f"服务器内部错误: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # 从环境变量获取端口，默认8001
    port = int(os.environ.get('PROXY_PORT', 8001))
    
    logger.info(f"启动代理服务器，端口: {port}")
    logger.info(f"代理目标: {DASHSCOPE_BASE_URL}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    )