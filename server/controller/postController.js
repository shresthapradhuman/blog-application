const asyncErrorhandler = require("../middleware/asyncError");
const errorHandler = require("../utils/errorhandler");
const { PrismaClient } = require("@prisma/client");
const Errorhandler = require("../utils/errorhandler");
const prisma = new PrismaClient();

let post = {
  createPost: asyncErrorhandler(async (req, res, next) => {
    const { title, content, publish, authorId } = req.body;
    const post = await prisma.post.create({
      data: {
        title,
        slug: title + "slug",
        content,
        publish,
        authorId: parseInt(authorId),
      },
    });
    res.status(201).json({
      success: true,
      post,
    });
  }),

  findAllPost: asyncErrorhandler(async (req, res, next) => {
    const posts = await prisma.post.findMany({
      where: {
        publish: true,
      },
    });
    res.status(200).json(posts);
  }),
  findSinglePost: asyncErrorhandler(async (req, res, next) => {
    const id = parseInt(req.params.id);
    const post = await prisma.post.findMany({
      where: {
        id,
        publish: true,
      },
    });
    if (post.length < 1) {
      return next(new Errorhandler("Post is not available", 400));
    }
    res.status(200).json(post);
  }),
  updatePost: asyncErrorhandler(async (req, res, next) => {
    const { title, content } = req.body;
    const id = parseInt(req.params.id);
    const update = await prisma.post.updateMany({
      data: {
        title,
        content,
      },
      where: {
        id,
      },
    });
    res.status(201).json({ message: "successfully updated" });
  }),
  deletePost: asyncErrorhandler(async (req, res, next) => {
    const id = parseInt(req.params.id);
    const deletePost = await prisma.post.deleteMany({
      where: {
        id,
      },
    });
    res.status(204).json({ message: "successfully deleted" });
  }),
  commentPost: asyncErrorhandler(async (req, res, next) => {
    const id = parseInt(req.params.id);
    const checkPost = await prisma.post.findMany({ where: { id } });
    if (checkPost.length < 1) {
      return next(new errorHandler(`Post doesn't exist.`, 400));
    }
    const writeComment = await prisma.comment.create({
      data: {
        postId: id,
        comment: req.body.comment,
      },
    });
    res
      .status(201)
      .json({ success: true, message: "successfully created", writeComment });
  }),
};

module.exports = post;
