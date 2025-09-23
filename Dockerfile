FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

RUN sed -i 's/try_files $uri $uri\/ =404;/try_files $uri $uri\/ \/index.html;/' /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
