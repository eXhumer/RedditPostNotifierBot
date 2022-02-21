require('dotenv').config();
const { Client, Intents, MessageEmbed } = require("discord.js");
const Reddit = require('./reddit');

const discord = new Client({intents: [Intents.FLAGS.GUILDS]});
const reddit = new Reddit(process.env.REDDIT_CLIENT_ID,
                          process.env.REDDIT_CLIENT_SECRET);
const redditPostHistory = [];
const subreddit = "formula1";

const redditPostChecker = async (guild_channel) => {
  if (reddit.expired())
    await reddit.authorize();

  while (true) {
    while (redditPostHistory.length > 0 && !reddit.postAvailable(redditPostHistory[redditPostHistory.length - 1], subreddit)) {
      redditPostHistory.pop();
    }

    if (redditPostHistory.length === 0)
      redditPostHistory.push((await reddit.latestPost(subreddit)).data.name);

    const redditPostsListing = await reddit.posts(
      subreddit,
      "new",
      100,
      redditPostHistory[redditPostHistory.length - 1],
    );

    if (redditPostsListing.data.dist > 0) {
      const posts = redditPostsListing.data.children.reverse();

      posts.forEach(post => {
        redditPostHistory.push(post.data.name);

        const postEmbed = new MessageEmbed()
        .setTitle(post.data.title)
        .setAuthor({
          name: post.data.author,
          url: `https://reddit.com/u/${post.data.author}`,
        })
        .setTimestamp(post.data.created * 1000)
        .setURL(`https://reddit.com${post.data.permalink}`);

        if (post.data.thumbnail.startsWith("https://"))
          postEmbed.setThumbnail(post.data.thumbnail);

        guild_channel.send({ embeds: [postEmbed] });
      });

      continue;
    }

    break;
  };
};

discord.on("ready", async () => {
  const postGuild = await discord.guilds.fetch(process.env.POST_GUILD_ID);
  const postChannel = postGuild.channels.cache.get(process.env.POST_CHANNEL_ID);
  await redditPostChecker(postChannel);
  setInterval(async () => await redditPostChecker(postChannel), 60 * 1000);
});

reddit.authorize()
  .then(() => {
    discord.login(process.env.DISCORD_BOT_TOKEN);
  });
