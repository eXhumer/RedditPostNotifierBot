const axios = require("axios").default;

class Reddit {
  constructor(client_id, client_secret) {
    this.authorization = null;
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  async authorize() {
    const auth_params = new URLSearchParams();
    auth_params.append('grant_type', 'client_credentials');

    const res = await axios.post(
      "https://www.reddit.com/api/v1/access_token",
      auth_params,
      {
        auth: {
          username: this.client_id,
          password: this.client_secret,
        },
      },
    );

    this.authorization = {
      ...res.data,
      created_at: Date.now() / 1000,
    };
  }

  expired() {
    return this.authorization === null || (this.authorization.created_at + this.authorization.expires_in) <= (Date.now() / 1000);
  }

  async latestPost(subreddit) {
    const posts_listing = await this.posts(subreddit, "new", 1);

    if (posts_listing.data.dist === 0)
      return;

    return posts_listing.data.children[0];
  }

  async postAvailable(postName, subreddit) {
    if (this.authorization) {
      const res = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/api/info`,
        {
          headers: {
            'Authorization': `${this.authorization.token_type} ${this.authorization.access_token}`,
          },
          params: {
            id: postName,
            raw_json: 1,
          },
        },
      );

      const post = res.data.data.children[0];
      return post.data.removed_by_category === null;
    }
  }

  async posts(subreddit, sort = "new", limit = 100, before = null) {
    if (this.authorization) {
      const params = {
        limit: limit,
        show: 'all',
        raw_json: 1,
      };

      if (before)
        params.before = before;

      const res = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/${sort}`,
        {
          headers: {
            'Authorization': `${this.authorization.token_type} ${this.authorization.access_token}`,
          },
          params: params,
        },
      );

      return res.data;
    }
  }
};

module.exports = Reddit;
