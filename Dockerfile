FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and prisma schema first
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies (postinstall runs prisma generate)
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build TypeScript to dist/
RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/main"]
