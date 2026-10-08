FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json yarn.lock* ./
COPY prisma ./prisma/

RUN yarn install --frozen-lockfile || yarn install

COPY . .

RUN yarn prisma:generate
RUN yarn build

FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json yarn.lock* ./
COPY prisma ./prisma/

RUN yarn install --production --frozen-lockfile || yarn install --production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["sh", "-c", "yarn prisma:deploy && node dist/main"]
