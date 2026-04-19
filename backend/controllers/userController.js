const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// GET /api/users/:id
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pinnedIds = (user.pinnedPosts || []).map(id => id.toString());

    const allPosts = await Post.find({ author: user._id, published: true, isHidden: { $ne: true } })
      .populate('author', 'name avatar isAdmin isVerified')
      .sort({ createdAt: -1 })
      .select('-content');

    // Put pinned posts first (in pin order), then rest chronologically
    const pinned   = pinnedIds
      .map(pid => allPosts.find(p => p._id.toString() === pid))
      .filter(Boolean);
    const unpinned = allPosts.filter(p => !pinnedIds.includes(p._id.toString()));
    const posts    = [...pinned, ...unpinned];

    res.json({ success: true, user, posts, pinnedPostIds: pinnedIds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      updateData.avatar = req.file.path;
      updateData.avatarPublicId = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users/:id/follow
const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter((id) => id.toString() !== req.params.id);
      userToFollow.followers = userToFollow.followers.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      // Follow — create notification
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user._id);
      await Notification.create({
        recipient: req.params.id,
        fromUser: req.user._id,
        type: 'follow',
      });
    }

    await currentUser.save({ validateBeforeSave: false });
    await userToFollow.save({ validateBeforeSave: false });

    res.json({
      success: true,
      following: !isFollowing,
      followersCount: userToFollow.followers.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/admin/all  (admin)
const getAllUsersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/admin/:id  (admin)
const deleteUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await Post.deleteMany({ author: req.params.id });
    await user.deleteOne();

    res.json({ success: true, message: 'User and their posts deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/admin/:id/toggle-admin  (admin)
const toggleAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isAdmin = !user.isAdmin;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, isAdmin: user.isAdmin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  changePassword,
  followUser,
  getAllUsersAdmin,
  deleteUserAdmin,
  toggleAdmin,
};
