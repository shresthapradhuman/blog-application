let express = require("express");
const router = express.Router();
let post = require("../controller/postController");

router.post("/post/create", post.createPost);
router.get("/post", post.findAllPost);
router.get("/post/:id", post.findSinglePost);
router.put("/post/update/:id", post.updatePost);
router.delete("/post/delete/:id", post.deletePost);
router.post("/post/comment/:id", post.commentPost);
module.exports = router;
