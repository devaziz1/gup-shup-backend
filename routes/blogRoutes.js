const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const blogController = require("../controllers/blogController");
const verifyToken = require("../middleware/authMiddleware");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });


router.post("/createBlog", upload.single("image"), blogController.createBlog);
router.post("/addComment", blogController.addComment);
router.delete("/deleteComment", blogController.deleteComment);


router.delete("/:id",verifyToken, blogController.deleteBlog);
router.patch("/",verifyToken, blogController.updateBlog);

router.get("/getAllBlogs", blogController.getAllBlogs);
router.get("/getBlogById/:id", blogController.getBlogById);

router.get("/getBlogsByUserId/:id", verifyToken, blogController.getBlogsByUser);
router.get("/searchByTitle/:title", verifyToken, blogController.searchBlogsByTitle);
router.get("/search/:title",verifyToken, blogController.searchBlogsByTitle);

router.get("/getTotalCounts/:id",verifyToken, blogController.getTotalCounts);


router.patch("/like/:id", blogController.likeBlog);
router.patch("/unLike/:id", blogController.UnlikeBlog);

module.exports = router;
