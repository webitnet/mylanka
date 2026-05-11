/**
 * pm2 process descriptor for the Mylanka Telegram bot.
 *
 * On the VDS:
 *   git clone git@github.com:webitnet/mylanka.git /srv/mylanka
 *   cd /srv/mylanka
 *   npm ci
 *   npx prisma generate
 *   cp /your/secrets.env .env   # set DATABASE_URL, TELEGRAM_*, etc.
 *   pm2 start ecosystem.config.cjs
 *   pm2 save                    # persist across reboots
 *   pm2 startup                 # follow instructions to install systemd unit
 *
 * Logs:  pm2 logs mylanka-bot
 * Restart on deploy:  cd /srv/mylanka && git pull && npm ci && pm2 reload mylanka-bot
 */
module.exports = {
  apps: [
    {
      name: "mylanka-bot",
      script: "node_modules/.bin/tsx",
      args: "src/bot/index.ts",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      // Long-polling keeps an open connection; restart if it goes silent > 5 min.
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
