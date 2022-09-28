const { expect } = require("chai");
const { describe, it } = require("mocha");
const { User, Post, Comment } = require("../models/index");

// Post successful creation check
// api/posts/
// To check if the post is getting created by providing all the required parameters with correct format
// Positive
// 1. Send a post request with the required fields: Title, Description, valid jwt token.
//  2. Check response field according to requirements.
//  3. Cross validated the resposne field value with that in the database table

describe("Post successful creation check", () => {
  it("Should create a new post", async () => {
    const user = new User({
      name: "Test User",
      email: "testuser@gmail.com",
      password: "testpassword",
    });
    await user.save();

    const token = user.generateAuthToken();

    const res = await request(server)
      .post("/api/posts")
      .set("x-auth-token", token)
      .send({
        title: "Test Post",
        description: "Test Description",
      });

    const post = await Post.find({ title: "Test Post" });
    // expect post title to be equal to the title sent in the request
    // expect post description to be equal to the description sent in the request
    expect(post).to.have.lengthOf(1);
    expect(post[0].title).to.equal("Test Post");
    expect(post[0].description).to.equal("Test Description");
  }, 10000);
});

// Post creation with Title field missing
// api/posts/	To
//  check if the post creation is unsucessfull if Title field is miising in the POST request
// Negative
// 1. Check in database for the number of posts for the test user.
//  2. Send a POST request with Title field missing.
// 3. Check the resposne field according to requirement.
// 4. Check in database if no new post is created for the user.

describe("Post creation with Title field missing", () => {
  it("Should not create a new post", async () => {
    const user = new User({
      name: "Test User",
      email: "testuser@gmail.com",
      password: "testpassword",
    });
    await user.save();

    const token = user.generateAuthToken();

    const res = await request(server)
      .post("/api/posts")
      .set("x-auth-token", token)
      .send({
        description: "Test Description",
      });

    const post = await Post.find({ title: "Test Post" });
    // the post should not be created since the title field is missing
    expect(post).to.have.lengthOf(0);
  }, 10000);
});
