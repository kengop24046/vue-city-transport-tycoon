# 构建阶段：使用Node环境编译项目
FROM node:18-alpine AS builder
# 设置工作目录
WORKDIR /app
# 复制package文件，优先安装依赖（利用Docker缓存）
COPY package*.json ./
# 安装项目依赖
RUN npm install
# 复制全部项目文件
COPY . .
# 执行生产环境构建
RUN npm run build

# 运行阶段：使用Nginx提供静态服务
FROM nginx:alpine
# 维护者信息
LABEL maintainer="city-transport-tycoon"
# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
# 从构建阶段复制打包后的产物到Nginx目录
COPY --from=builder /app/dist /usr/share/nginx/html
# 复制自定义Nginx配置（解决Vue路由404问题）
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# 暴露80端口
EXPOSE 80
# 前台启动Nginx
CMD ["nginx", "-g", "daemon off;"]