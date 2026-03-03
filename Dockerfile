# 阶段1：构建Vue项目（直接设置base为/，无需.env.docker）
FROM node:20-alpine as build-stage
WORKDIR /app
# 复制依赖文件
COPY package*.json ./
RUN npm install --frozen-lockfile
# 复制所有源码
COPY . .
# 构建时手动指定环境变量，强制base为/
RUN VITE_BASE_URL=/ npm run build

# 阶段2：Nginx部署（使用默认Nginx配置，跳过自定义nginx.conf）
FROM nginx:alpine as production-stage
# 复制构建产物到Nginx根目录
COPY --from=build-stage /app/dist /usr/share/nginx/html
# 暴露端口
EXPOSE 80
# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]