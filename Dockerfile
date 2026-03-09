# 多阶段构建：先构建前端，再打包后端
FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10 AS frontend-builder

# 安装 Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /build/client

# 复制前端代码
COPY client/ ./

# 安装依赖并构建
RUN npm install && npm run build

# 生产镜像
FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

WORKDIR /home/user/app

# 复制后端代码
COPY backend-new/ ./

# 复制构建好的前端静态文件
COPY --from=frontend-builder /build/client/dist ./static/

# 安装 Python 依赖
RUN pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 暴露端口
EXPOSE 7860

# 启动应用
ENTRYPOINT ["python", "-u", "app.py"]
