let express = require("express");
const router = express.Router();
let blog = require("../controller/blogController");

router.get("/blog", blog.findAll);
router.get("/blog/:id", blog.findById);
router.post("/blog/create", (req, res) => {
  res.send("blogger get request");
});
router.put("/blog/:id", (req, res) => {
  res.send("blogger get request");
});
router.delete("blog/:id", (req, res) => {
  res.send("blogger get request");
});

module.exports = router;
