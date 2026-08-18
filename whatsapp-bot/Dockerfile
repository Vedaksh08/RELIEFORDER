# whatsapp-web.js drives a real Chromium, so the image needs the browser and
# its shared libraries. Using the Puppeteer base image saves fighting with
# apt packages on every host.
FROM ghcr.io/puppeteer/puppeteer:23.10.4

USER root
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

# The session lives here — mount a persistent volume at this path or you will
# have to re-scan the QR code on every restart.
ENV SESSION_PATH=/data/.wwebjs_auth
ENV SETTINGS_PATH=/data/.bot-settings.json
RUN mkdir -p /data && chown -R pptruser:pptruser /data /app

USER pptruser
EXPOSE 8080
CMD ["node", "src/server.js"]
