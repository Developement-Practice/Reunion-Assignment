/* <aside>
💬 **Table of Contents**

</aside>

# Problem Statement

- Build APIs for a social media platform in either NodeJS or Python
- The API should support features like getting a user profile, follow a user, upload a post, delete a post, like a post, unlike a liked post, and comment on a post
- Design the database schema and implement in PostgreSQL or MongoDB

### **API Endpoints**

- POST /api/authenticate should perform user authentication and return a JWT token.
    - INPUT: Email, Password
    - RETURN: JWT token
    
    <aside>
    ➡️ **NOTE:** Use dummy email & password for authentication. No need to create endpoint for registering new user.
    
    </aside>
    
- POST /api/follow/{id} authenticated user would follow user with {id}
- POST /api/unfollow/{id} authenticated user would unfollow a user with {id}
- GET /api/user should authenticate the request and return the respective user profile.
    - RETURN: User Name, number of followers & followings.
- POST api/posts/ would add a new post created by the authenticated user.
    - Input: Title, Description
    - RETURN: Post-ID, Title, Description, Created Time(UTC).
- DELETE api/posts/{id} would delete post with {id} created by the authenticated user.
- POST /api/like/{id} would like the post with {id} by the authenticated user.
- POST /api/unlike/{id} would unlike the post with {id} by the authenticated user.
- POST /api/comment/{id} add comment for post with {id} by the authenticated user.
    - Input: Comment
    - Return: Comment-ID
- GET api/posts/{id} would return a single post with {id} populated with its number of likes and comments
- GET /api/all_posts would return all posts created by authenticated user sorted by post time.
    - RETURN: For each post return the following values
        - id: ID of the post
        - title: Title of the post
        - desc: Description of the post
        - created_at: Date and time when the post was created
        - comments: Array of comments, for the particular post
        - likes: Number of likes for the particular post

### **Stacks**

- Backend: NodeJS (using ExpressJS or Koa) or Python (using Django). Use other helping libraries.
- Database: PostgreSQL or MongoDB

# Instructions

- Implement the mentioned functionalities by writing your code & hosting it on [Render](https://render.com/).
- Submit the Render hosted link for the deployed APIs and Github or Gitlab public repository link for the deployed code in the form below.
- **Provide the list of the functional testcases** specific to each API endpoint with description in an Excel sheet ([**sample sheet**](https://www.notion.so/Back-End-Assignment-Full-Time-bd5e48b7aab54e91b6ee8829c3e30c4a)) & submit it via the form below.
    - Don’t write all the testcase but try to focus on the important testcases according to your understanding.
    
    <aside>
    💬 **Sample excel file for tests**
    
    [Sample Test Case](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/04d601bc-47d5-45f9-bcd5-eba09e7b6acc/Untitled.xlsx)
    
    </aside>
    
- **Implement the testcases** using the language specific framework or library like Mocha or Chai.js for Node.
    - Commit the testcase code in the git repo & provide the commands to run the testcases.
- **Create a single docker file for running the** **full web app under a single docker image**. Commit the docker file under the same repo & provide the link.
    - Please note docker file should take care of the database, running testcases & other dependencies installation.

# Submission Form

[https://tally.so/r/nWZYJw](https://tally.so/r/nWZYJw) */

require("dotenv").config();
const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User, Post, Comment } = require("../models/index");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.get("/", async (req, res, next) => {
  res.send({ message: "Awesome it works 🐻" });
});

// create user
app.post("/api/user", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.send(user);
  } catch (error) {
    next(error);
  }
});

app.post("/api/authenticate", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw createError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw createError(401, "Invalid credentials");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.send({ token });
  } catch (error) {
    next(error);
  }
});

app.post("/api/follow/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    const followUser = await User.findById(id);
    if (!followUser) {
      throw createError(404, "User not found");
    }

    user.following.push(followUser._id);
    await user.save();

    followUser.followers.push(user._id);
    await followUser.save();

    res.send({ message: "Followed successfully" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/unfollow/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    const followUser = await User.findById(id);
    if (!followUser) {
      throw createError(404, "User not found");
    }

    user.following = user.following.filter((item) => item != id);
    await user.save();

    followUser.followers = followUser.followers.filter((item) => item != id);
    await followUser.save();

    res.send({ message: "Unfollowed successfully" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/user", async (req, res, next) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    res.send(user);
  } catch (error) {
    next(error);
  }
});

app.post("/api/posts", async (req, res, next) => {
  try {
    const { token, title, desc } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    const post = new Post({
      title,
      desc,
      user: user._id,
    });
    await post.save();

    res.send({ message: "Post created successfully", post });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/posts/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    const post = await Post.findById(id);
    if (!post) {
      throw createError(404, "Post not found");
    }

    if (post.user != user._id) {
      console.log(post.user, user._id);
      throw createError(401, "Unauthorized");
    }

    await post.remove();

    res.send({ message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/like/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    const post = await Post.findById(id);
    if (!post) {
      throw createError(404, "Post not found");
    }

    // If the user has already liked the post
    if (post.likes.includes(user._id)) {
      throw createError(400, "Post already liked");
    } else {
      post.likes.push(user._id);
      await post.save();
    }

    res.send({ message: "Post Liked successfully" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/unlike/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    const post = await Post.findById(id);
    if (!post) {
      throw createError(404, "Post not found");
    }

    // If the user hasnt liked the post
    if (!post.likes.includes(user._id)) {
      throw createError(400, "Post not liked");
    } else {
      post.likes = post.likes.filter((item) => item != user._id);
      await post.save();
    }

    res.send({ message: "Unliked successfully" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/comment/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token, text } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    const post = await Post.findById(id);
    if (!post) {
      throw createError(404, "Post not found");
    }

    const comment = new Comment({
      text,
      user: user._id,
      post: post._id,
    });
    await comment.save();

    post.comments.push(comment._id);
    await post.save();

    res.send({ message: "Commented on the post successfully" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/posts/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    const post = await Post.findById(id);
    if (!post) {
      throw createError(404, "Post not found");
    }

    res.send(post);
  } catch (error) {
    next(error);
  }
});

app.get("/api/all_posts", async (req, res, next) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw createError(404, "User not found");
    }

    const posts = await Post.find();

    res.send(posts);
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
