# multi‐stage build for React/Vite front end
FROM node:18-alpine AS builder
WORKDIR /app

# install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# build app
COPY . .
RUN yarn build

# runtime image
FROM nginx:stable-alpine
# copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# expose and run
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
