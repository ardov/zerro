FROM node:20-alpine

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . ./

CMD ["pnpm", "run", "dev", "--", "--host"]
