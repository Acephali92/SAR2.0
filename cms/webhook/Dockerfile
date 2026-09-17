FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev nodemailer
COPY rebuild-server.mjs ./
EXPOSE 8090
CMD ["node", "rebuild-server.mjs"]
