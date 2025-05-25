FROM node:20-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install pnpm
RUN npm install -g pnpm

# install app dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# add app
COPY . ./

# start app
CMD ["pnpm", "run", "dev", "--", "--host"]
