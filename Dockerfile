FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /work

COPY package.json package-lock.json ./
RUN npm ci

COPY playwright.config.ts tsconfig.json ./
COPY source ./source
COPY html ./html

CMD ["npm", "test", "--", "source/cross-origin-pagehide.spec.ts"]
