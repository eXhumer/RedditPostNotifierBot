import {config as dotenvConfig} from "dotenv";
dotenvConfig();
import { Client, Intents, MessageEmbed, TextChannel } from "discord.js";
import Reddit from "./reddit";

const discord = new Client({intents: [Intents.FLAGS.GUILDS]});
const reddit = new Reddit(process.env.REDDIT_CLIENT_ID,
                          process.env.REDDIT_CLIENT_SECRET);

const postFetcherInterval = 1 * 60;
const postCheckInterval = 15 * 60;
const postUpvoteThreshold = 15;
let postsToCheck: string[] = [];
const postsHistory: string[] = [];
const subreddit = "formula1";

const redditPostChecker = async (guildChannel: TextChannel) => {
  if (reddit.expired())
    await reddit.authorize();

  if (postsToCheck.length > 0) {
    const postsListing = await reddit.postsInfo(subreddit, ...postsToCheck);

    postsListing.data.children.forEach((post: any) => {
      if (post.data.ups >= postUpvoteThreshold) {
        const postEmbed = new MessageEmbed()
        .setTitle(post.data.title.length > 250 ?
          post.data.title.substring(0, 247) + "..." :
          post.data.title)
        .setAuthor({
          name: post.data.author,
          url: `https://reddit.com/u/${post.data.author}`,
        })
        .setTimestamp(post.data.created * 1000)
        .setURL(`https://reddit.com${post.data.permalink}`);

        if (post.data.thumbnail.startsWith("https://"))
          postEmbed.setThumbnail(post.data.thumbnail);

        guildChannel.send({ embeds: [postEmbed] });
        postsToCheck = postsToCheck.filter(postName => postName !== post.data.name);
      } else if (Math.trunc(post.data.created_utc) + postCheckInterval <=
          Math.trunc(Date.now() / 1000)) {
        postsToCheck = postsToCheck.filter(postName => postName !== post.data.name);
      }
    });
  }

  while (postsHistory.length > 0 &&
      !reddit.postAvailable(postsHistory[postsHistory.length - 1], subreddit)) {
    postsHistory.pop();
  }

  if (postsHistory.length === 0)
    postsHistory.push((await reddit.latestPost(subreddit)).data.name);

  while (true) {
    const postsListing = await reddit.posts(
      subreddit,
      "new",
      100,
      postsHistory[postsHistory.length - 1],
    );

    if (postsListing.data.dist === 0)
      break;

    postsListing.data.children.reverse().forEach((post: any) => {
      postsHistory.push(post.data.name);

      if (post.data.ups >= postUpvoteThreshold) {
        const postEmbed = new MessageEmbed()
        .setTitle(post.data.title.length > 250 ?
          post.data.title.substring(0, 247) + "..." :
          post.data.title)
        .setAuthor({
          name: post.data.author,
          url: `https://reddit.com/u/${post.data.author}`,
        })
        .setTimestamp(post.data.created * 1000)
        .setURL(`https://reddit.com${post.data.permalink}`);

        if (post.data.thumbnail.startsWith("https://"))
          postEmbed.setThumbnail(post.data.thumbnail);

        guildChannel.send({ embeds: [postEmbed] });
      } else if (Math.trunc(post.data.created_utc) + postCheckInterval >
      Math.trunc(Date.now() / 1000))
        postsToCheck = [post.data.name, ...postsToCheck];
    });
  }
};

discord.on("ready", async () => {
  const postGuild = await discord.guilds.fetch(process.env.POST_GUILD_ID);
  const postChannel = postGuild.channels.cache.get(process.env.POST_CHANNEL_ID);

  if (!postChannel || postChannel.type !== "GUILD_TEXT") {
    throw new Error("Discord channel specified doesn't exist or is non-text based channel " +
      "or bot doesn't have permission to view any channels!");
  }

  await redditPostChecker(postChannel);
  setInterval(async () => await redditPostChecker(postChannel), postFetcherInterval * 1000);
});

reddit.authorize()
  .then(() => {
    discord.login(process.env.DISCORD_BOT_TOKEN);
  });
