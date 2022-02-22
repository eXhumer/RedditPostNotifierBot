declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_BOT_TOKEN: string;
      NODE_ENV: 'development' | 'production';
      POST_GUILD_ID: string;
      POST_CHANNEL_ID: string;
      REDDIT_CLIENT_ID: string;
      REDDIT_CLIENT_SECRET: string;
    }
  }
}

export {};
