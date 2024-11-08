const Blog = require("../models/blogModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const path = require("path");

const createBlog = async (req, res) => {
  try {
    const { userId, title, content, username, tags } = req.body;
    console.log("Request body");
    console.log(req.body);

    const file = req.file;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let filePath = "";
    if (file) {
      filePath = path.join("/uploads", file.filename);
    }

    const tagsArray = tags ? tags.split(",").map((tag) => tag.trim()) : [];

    const newBlog = new Blog({
      user: userId,
      username,
      title,
      content,
      image: filePath,
      tags: tagsArray,
    });

    await newBlog.save();

    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { title, content, blogId, tags } = req.body;
    console.log("Inside update blog");
    console.log(title, content, blogId);
    if (!blogId) {
      return res.status(400).json({ message: "Blog ID is required" });
    }

    const updates = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (tags) {
      updates.tags = tags.split(",").map((tag) => tag.trim());
    }

    updates.updatedAt = Date.now();

    const updatedBlog = await Blog.findByIdAndUpdate(blogId, updates, {
      new: true,
    });

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const getAllBlogs = async (req, res) => {
//   try {
//     const blogs = await Blog.find({ hide: false })
//       .populate("user", "name email")
//       .populate("comments.user", "name email")
//       .exec();

//     const blogsWithImageUrls = blogs.map((blog) => ({
//       ...blog._doc,
//       image: blog.image
//         ? `${req.protocol}://${req.get("host")}${blog.image}`
//         : null,
//     }));

//     res.status(200).json(blogsWithImageUrls);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the page number from query, default to 1
    const limit = 5; // Number of blogs per page
    const skip = (page - 1) * limit; // Skip the number of blogs based on the current page

    // Fetch total number of blogs for pagination
    const totalBlogs = await Blog.countDocuments();

    // Fetch the blogs for the current page with population and image URLs
    const blogs = await Blog.find()
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .populate("comments.user", "name email")
      .exec();

    // Map blogs to include image URLs
    const blogsWithImageUrls = blogs.map((blog) => ({
      ...blog._doc,
      image: blog.image
        ? `${req.protocol}://${req.get("host")}${blog.image}`
        : null,
    }));

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalBlogs / limit);

    // Send response with pagination data
    res.status(200).json({
      blogs: blogsWithImageUrls,
      currentPage: page,
      totalPages: totalPages,
      totalBlogs: totalBlogs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchBlogsByTitle = async (req, res) => {
  try {
    const { title } = req.params;

    if (!title) {
      return res
        .status(400)
        .json({ message: "Title query parameter is required" });
    }

    const titleRegex = new RegExp(title, "i");

    const blogs = await Blog.find({ title: titleRegex, hide: false })
      .populate("user", "name email")
      .populate("comments.user", "name email")
      .exec();

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchBlogsByTitleDashboard = async (req, res) => {
  try {
    const { title } = req.params;
    const { id } = req.query;

    console.log("Title entered by user:", title);
    console.log("User ID:", id);

    if (!title) {
      return res
        .status(400)
        .json({ message: "Title query parameter is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const titleRegex = new RegExp(title, "i");
    const blogs = await Blog.find({ user: id, title: titleRegex, hide: false })
      .populate("user", "name email")
      .populate("comments.user", "name email")
      .exec();

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json({ message: error.message });
  }
};

const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    console.log("inside backend Controller");
    console.log(blog);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    blog.likeCount++;
    await blog.save();

    res
      .status(200)
      .json({ message: "Blog liked successfully", likes: blog.likeCount });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const UnlikeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    blog.likes--;
    await blog.save();
    res
      .status(200)
      .json({ message: "Blog un liked successfully", likes: blog.likes });
  } catch (error) {}
};

const addComment = async (req, res) => {
  try {
    const { blogId, content, name } = req.body;
    console.log("Comment API Hits");
    console.log(blogId, content, name);

    if (!blogId || !content || !name) {
      return res
        .status(400)
        .json({ message: "blogId, content, and name are required" });
    }

    const newComment = {
      name,
      content,
      createdAt: new Date(),
    };

    console.log("New comment");
    console.log(newComment);

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    blog.comments.push(newComment);
    blog.commentCount += 1;

    await blog.save();

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editComment = async (req, res) => {
  const { commentId, content } = req.body;

  try {
    if (!commentId || !content) {
      return res
        .status(400)
        .json({ message: "commentId and content are required" });
    }

    const blog = await Blog.findOne({ "comments._id": commentId });

    if (!blog) {
      return res
        .status(404)
        .json({ message: "Blog with the specified comment not found" });
    }

    const comment = blog.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.content = content;

    await blog.save();

    return res
      .status(200)
      .json({ message: "Comment updated successfully", blog });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.body;

  try {
    const blog = await Blog.findOne({ "comments._id": commentId });

    if (!blog) {
      return res
        .status(404)
        .json({ message: "Blog with the specified comment not found" });
    }

    const commentIndex = blog.comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    blog.comments.splice(commentIndex, 1);

    blog.commentCount = blog.comments.length;

    await blog.save();

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTotalCounts = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Blog.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$user",
          totalComments: { $sum: "$commentCount" },
          totalLikes: { $sum: "$likeCount" },
          totalPosts: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: "No blogs found for this user" });
    }

    const stats = result[0];

    res.json({
      userId: stats._id,
      totalComments: stats.totalComments,
      totalLikes: stats.totalLikes,
      totalPosts: stats.totalPosts,
    });
  } catch (error) {
    console.error("Error fetching user blog stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getBlogsByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || "latest";
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const totalBlogs = await Blog.countDocuments({ user: id });

    const skip = (page - 1) * limit;
    const sortOrder = sort === "latest" ? { createdAt: -1 } : { createdAt: 1 };

    const blogs = await Blog.find({ user: id })
      .sort(sortOrder)
      .populate("user", "name email")
      .populate("comments.user", "name email")
      .skip(skip)
      .limit(limit)
      .exec();

    res.status(200).json({
      user,
      blogs,
      totalBlogs,
      currentPage: page,
      totalPages: Math.ceil(totalBlogs / limit),
    });
  } catch (error) {
    console.error("Error fetching user and blogs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getBlogById = async (req, res) => {
  const id = req.params.id;
  console.log(id);

  try {
    const blog = await Blog.findById(id)
      .populate("user", "name email") // Include only necessary fields
      .populate("comments.user", "name email");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Format the image URL
    const blogWithImageUrl = {
      ...blog._doc, // Spread the existing blog document
      image: blog.image
        ? `${req.protocol}://${req.get("host")}${blog.image.replace(
            /\\/g,
            "/"
          )}`
        : null,
    };

    res.status(200).json(blogWithImageUrl);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching blog", error: error.message });
  }
};

module.exports = {
  createBlog,
  getBlogById,
  deleteBlog,
  updateBlog,
  getAllBlogs,
  searchBlogsByTitleDashboard,
  getBlogsByUser,
  searchBlogsByTitle,
  likeBlog,
  addComment,
  UnlikeBlog,
  getTotalCounts,
  deleteComment,
  editComment,
};
