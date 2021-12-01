let express = require("express");
const router = express.Router();
let user = require("../controller/userController");

router.get("/user/logout", user.logout);
router.post("/user/register", user.register);
router.post("/user/login", user.login);
router.get("/user", user.findAll);
router.get("/user/:id", user.findById);
router.put("/user/password/change/:id", user.changePassword);
router.post("/user/password/forget", user.forgetPassword);
router.put("/user/password/reset/:token", user.resetPassword);
router.put("/user/profile/:id", user.createProfile);
router.delete("/user/delete/:id", user.deleteProfile);
module.exports = router;
