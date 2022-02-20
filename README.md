# RedditPostNotifierBot
Discord bot which sends new posts from a subreddit as a Discord Embed message.

## Usage
NodeJS & yarn package manager required.

The following environment variable must be added to a `.env` file at the root of this project to make the bot work correctly.
```
DISCORD_BOT_TOKEN="<DISCORD_BOT_TOKEN>"
REDDIT_CLIENT_ID="<REDDIT_CLIENT_ID>"
REDDIT_CLIENT_SECRET="<REDDIT_CLIENT_SECRET>"
POST_GUILD_ID="<POST_GUILD_ID>"
POST_CHANNEL_ID="<POST_CHANNEL_ID>"
```

Run `yarn start` after adding the required environment variables to start the bot.
