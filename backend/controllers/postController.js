const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const slugify = require('slugify');

const generateSlug = async (title) => {
  let slug = slugify(title, { lower: true, strict: true });
  const exists = await Post.findOne({ slug });
  if (exists) slug = `${slug}-${Date.now()}`;
  return slug;
};

// GET /api/posts  - list posts with pagination, search, tag filter
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, tag, author } = req.query;

    const query = { published: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (tag) query.tags = tag.toLowerCase();
    if (author) query.author = author;

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'name avatar bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content');

    res.json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/posts/:slug
const getPost = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, published: true })
      .populate('author', 'name avatar bio followers');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Increment views
    post.views += 1;
    await post.save({ validateBeforeSave: false });

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/posts
const createPost = async (req, res) => {
  try {
    const { title, content, tags, excerpt, published } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const slug = await generateSlug(title);

    const postData = {
      title,
      slug,
      content,
      excerpt,
      author: req.user._id,
      tags: tags ? tags.map((t) => t.toLowerCase().trim()) : [],
      published: published !== undefined ? published : true,
    };

    if (req.file) {
      postData.coverImage = req.file.path;
      postData.coverImagePublicId = req.file.filename;
    }

    const post = await Post.create(postData);
    await post.populate('author', 'name avatar');

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/posts/:id
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
    }

    const { title, content, tags, excerpt, published } = req.body;

    if (title && title !== post.title) {
      post.slug = await generateSlug(title);
      post.title = title;
    }

    if (content) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (tags) post.tags = tags.map((t) => t.toLowerCase().trim());
    if (published !== undefined) post.published = published;

    if (req.file) {
      post.coverImage = req.file.path;
      post.coverImagePublicId = req.file.filename;
    }

    await post.save();
    await post.populate('author', 'name avatar');

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/posts/:id/like
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
      // Create notification for post author (not self-like)
      if (post.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.author,
          fromUser: userId,
          type: 'like',
          post: post._id,
          postTitle: post.title,
          postSlug: post.slug,
        });
      }
    }

    await post.save({ validateBeforeSave: false });

    res.json({
      success: true,
      liked: !isLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/posts/:id/clap
const clapPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.claps += 1;
    await post.save({ validateBeforeSave: false });

    // Notify author on first clap from this user (check if already notified today)
    if (post.author.toString() !== req.user._id.toString()) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const exists = await Notification.findOne({
        recipient: post.author, fromUser: req.user._id,
        type: 'clap', post: post._id, createdAt: { $gte: today },
      });
      if (!exists) {
        await Notification.create({
          recipient: post.author, fromUser: req.user._id,
          type: 'clap', post: post._id,
          postTitle: post.title, postSlug: post.slug,
        });
      }
    }

    res.json({ success: true, claps: post.claps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/posts/admin/all  (admin)
const getAllPostsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Post.countDocuments();
    const posts = await Post.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content');

    res.json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPosts, getPost, createPost, updatePost, deletePost, likePost, clapPost, getAllPostsAdmin };
