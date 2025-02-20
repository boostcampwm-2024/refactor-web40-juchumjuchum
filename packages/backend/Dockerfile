FROM node:20-slim
WORKDIR /packages

# 필요한 시스템 라이브러리 설치
RUN apt-get update && apt-get install -y \
    libc6-dev \
    build-essential \
    python3 \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# 한국 시간에 맞춰 변경
RUN ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone

COPY . .
RUN yarn install --frozen-lockfile
RUN yarn workspace backend build

EXPOSE 3000
CMD ["yarn", "workspace", "backend", "start:prod"]