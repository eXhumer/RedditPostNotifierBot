import axios from "axios";

type RedditAuthorization = {
  created_at: number;
  expires_in: number;
  token_type: "bearer";
  access_token: string;
};

class Reddit {
  authorization: RedditAuthorization | null
  client_id: string
  client_secret: string

  constructor(client_id: string, client_secret: string) {
    this.authorization = null;
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  authorize = async () => {
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
      created_at: Math.trunc(Date.now() / 1000),
    };
  }

  expired = () => {
    return this.authorization === null || (this.authorization.created_at +
      this.authorization.expires_in) <= Math.trunc(Date.now() / 1000);
  }

  latestPost = async (subreddit: string) => {
    const posts_listing = await this.posts(subreddit, "new", 1);

    if (posts_listing.data.dist === 0)
      return;

    return posts_listing.data.children[0];
  }

  postAvailable = async (postName: string, subreddit: string) => {
    if (this.authorization) {
      const postsListing = await this.postsInfo(subreddit, postName);

      if (postsListing.data.dist === 1) {
        const post = postsListing.data.children[0];
        return post.data.removed_by_category === null;
      } else if (postsListing.data.dist > 1)
        throw new Error(`Expected 1 post data, received ${postsListing.data.dist}!`);

      return false;
    }

    throw new Error(`No authorization available!`);
  }

  postsInfo = async (subreddit: string, ...postNames: string[]) => {
    if (this.authorization) {
      const res = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/api/info`,
        {
          headers: {
            'Authorization': [
              this.authorization.token_type,
              this.authorization.access_token
            ].join(" "),
          },
          params: {
            id: postNames.join(","),
            raw_json: 1,
          },
        },
      );

      return res.data;
    }

    throw new Error(`No authorization available!`);
  }

  async posts(subreddit: string, sort = "new", limit = 100, before: string | null = null) {
    if (this.authorization) {
      const params = {
        limit: limit,
        show: 'all',
        raw_json: 1,
        before: before,
      };

      const res = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/${sort}`,
        {
          headers: {
            'Authorization': [
              this.authorization.token_type,
              this.authorization.access_token
            ].join(" "),
          },
          params: params,
        },
      );

      return res.data;
    }

    throw new Error(`No authorization available!`);
  }
};

export default Reddit;
