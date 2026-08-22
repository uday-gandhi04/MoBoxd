const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Post = require("../models/Post");
const Activity = require("../models/Activity"); // IMPORT THE ACTIVITY MODEL
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const Ranking = require("../models/Ranking");
const { sendPushNotification } = require("../utils/pushNotification");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { displayName, username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please add all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      displayName,
      username,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email.toLowerCase().trim(),
        displayName: user.displayName,
        profilePicture: user.profilePicture, // ADDED
        bio: user.bio, // ADDED
        bookmarks: user.bookmarks,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    // Check password
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email.toLowerCase().trim(),
        displayName: user.displayName, // ADDED
        profilePicture: user.profilePicture, // ADDED
        bio: user.bio, // ADDED
        bookmarks: user.bookmarks,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    // Find the user by username, exclude the password field
    const user = await User.findOne({ username: req.params.username }).select(
      "-password",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all posts authored by this user
    const isLoggedIn = !!req.user;

    const isOwner =
      isLoggedIn && req.user._id.toString() === user._id.toString();

    const isFollower =
      isLoggedIn &&
      user.followers.some((id) => id.toString() === req.user._id.toString());

    let postQuery = {
      author: user._id,
    };

    if (!isOwner) {
      if (isFollower) {
        postQuery.visibility = {
          $in: ["PUBLIC", "FOLLOWERS"],
        };
      } else {
        postQuery.visibility = "PUBLIC";
      }
    }

    const posts = await Post.find(postQuery)
      .sort({ createdAt: -1 })
      .populate("author", "username profilePicture");

    // ------------------ Ranking Privacy ------------------

    // const isLoggedIn = !!req.user;

    // const isOwner =
    //   isLoggedIn && req.user._id.toString() === user._id.toString();

    // const isFollower =
    //   isLoggedIn &&
    //   user.followers.some((id) => id.toString() === req.user._id.toString());

    let rankingQuery = {
      creator: user._id,
    };

    if (!isOwner) {
      if (isFollower) {
        rankingQuery.visibility = {
          $in: ["PUBLIC", "FOLLOWERS"],
        };
      } else {
        rankingQuery.visibility = "PUBLIC";
      }
    }

    const rankings = await Ranking.find(rankingQuery)
      .sort({ createdAt: -1 })
      .populate("creator", "username profilePicture displayName");

    // Return all three pieces of data
    res.status(200).json({ user, posts, rankings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.q;

    if (!keyword) {
      return res.status(200).json([]); // Return an empty array if no query is provided
    }

    // Perform a case-insensitive search
    const users = await User.find({
      username: { $regex: keyword, $options: "i" },
    }).select("-password"); // Exclude passwords from the response

    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to search users", error: error.message });
  }
};

const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    // A user cannot follow themselves
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if currently following
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow logic: Remove IDs from respective arrays
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId,
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId,
      );

      // ACTIVITY TRIGGER: Remove the follow activity from the feed
      await Activity.findOneAndDelete({
        actor: currentUserId,
        actionType: "FOLLOW",
        targetUser: targetUserId,
      });
    } else {
      // Follow logic: Add IDs to respective arrays
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      // ACTIVITY TRIGGER: Log the follow activity
      await Activity.create({
        actor: currentUserId,
        actionType: "FOLLOW",
        targetUser: targetUserId,
      });

      // --- ADD NOTIFICATION HERE ---
      sendPushNotification(targetUserId, {
        title: "New Follower!",
        body: `${currentUser.username} started following you.`,
        url: `/profile/${currentUser.username}`, 
      });
      
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: isFollowing
        ? "Unfollowed successfully"
        : "Followed successfully",
      followers: targetUser.followers,
      following: currentUser.following,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to toggle follow", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure the logged-in user is only updating their own profile
    if (user._id.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this profile" });
    }

    // Update basic text fields
    if (req.body.displayName) user.displayName = req.body.displayName;
    if (req.body.bio !== undefined) user.bio = req.body.bio;

    // Update password if one was provided
    // (Assuming your User model has a pre('save') hook to hash passwords using bcrypt)
    if (req.body.password) {
      user.password = req.body.password;
    }

    // If Multer processed a new image, update the profile picture URL
    if (req.file) {
      user.profilePicture = req.file.path; // Assumes Cloudinary/Multer puts the URL here
    }

    const updatedUser = await user.save();

    // Send back the updated user data (excluding the password)
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      bio: updatedUser.bio,
      token: req.headers.authorization.split(" ")[1], // Preserve the existing token
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    // Handle specific MongoDB errors like duplicate usernames
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    res.status(500).json({ message: "Server error updating profile" });
  }
};

// @desc    Auth with Google
// @route   POST /api/users/google
// @access  Public
const googleAuth = async (req, res) => {
  const { token, idToken } = req.body;

  if (!token && !idToken) {
    return res.status(400).json({
      message: "No Google authentication token provided",
    });
  }

  try {
    let email;
    let name;
    let picture;
    let sub;

    // ==========================================
    // NATIVE ANDROID / IOS
    // Google ID token
    // ==========================================
    if (idToken) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      sub = payload.sub;
    }

    // ==========================================
    // WEB
    // Google OAuth access token
    // ==========================================
    else {
      const googleResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      email = googleResponse.data.email;
      name = googleResponse.data.name;
      picture = googleResponse.data.picture;
      sub = googleResponse.data.sub;
    }

    if (!email || !sub) {
      return res.status(401).json({
        message: "Invalid Google account data",
      });
    }

    // ==========================================
    // FIND OR CREATE USER
    // ==========================================

    let user = await User.findOne({ email });

    if (!user) {
      const baseUsername = email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      let username = baseUsername;

      // Make username unique
      while (await User.findOne({ username })) {
        const randomSuffix = Math.floor(
          1000 + Math.random() * 9000
        );

        username = `${baseUsername}${randomSuffix}`;
      }

      user = await User.create({
        displayName: name,
        username,
        email,
        password: sub,
        profilePicture: picture,
      });
    }

    // ==========================================
    // RETURN MOBOXD JWT
    // ==========================================

    res.status(200).json({
      _id: user._id,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      bookmarks: user.bookmarks,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error(
      "Google Auth Error:",
      error.response?.data || error.message
    );

    res.status(401).json({
      message: "Google authentication failed",
    });
  }
};

// @desc    Toggle bookmark on a post
// @route   PUT /api/users/bookmarks/:postId
// @access  Private

const toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const postId = req.params.postId;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // THE FIX: Convert both to strings before comparing!
    const isBookmarked = user.bookmarks.some(
      (id) => id.toString() === postId.toString(),
    );

    if (isBookmarked) {
      // Unsave: Filter it out of the array
      user.bookmarks = user.bookmarks.filter(
        (id) => id.toString() !== postId.toString(),
      );
    } else {
      // Save: Add it to the array
      user.bookmarks.push(postId);
    }

    await user.save();

    // Return the updated array to the frontend
    res.status(200).json(user.bookmarks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to toggle bookmark", error: error.message });
  }
};

// @desc    Get user's bookmarked posts
// @route   GET /api/users/bookmarks
// @access  Private
const getBookmarkedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "bookmarks",
      populate: {
        path: "author",
        select: "username profilePicture displayName",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Since we populate the bookmarks, we can just return that array
    // We reverse it so the most recently saved items appear first
    res.status(200).json(user.bookmarks.reverse());
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookmarks", error: error.message });
  }
};

// @desc    Get followers of a user
// @route   GET /api/users/:username/followers
// @access  Public
const getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).select("followers");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit, 10) || 25,
        1
      ),
      50
    );

    const start = (page - 1) * limit;

    const followerIds = user.followers || [];

    const ids = followerIds.slice(
      start,
      start + limit
    );

    const users = await User.find({
      _id: { $in: ids },
    })
      .select(
        "_id username displayName profilePicture followers following"
      )
      .lean();

    // Preserve the same order as the IDs stored in followers
    const userMap = new Map(
      users.map((u) => [u._id.toString(), u])
    );

    const orderedUsers = ids
      .map((id) => userMap.get(id.toString()))
      .filter(Boolean)
      .map((u) => ({
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        profilePicture: u.profilePicture,
        followersCount: u.followers?.length || 0,
        followingCount: u.following?.length || 0,
      }));

    const hasMore =
      start + limit < followerIds.length;

    return res.status(200).json({
      users: orderedUsers,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);

    return res.status(500).json({
      message: "Failed to fetch followers",
    });
  }
};


// @desc    Get users this user follows
// @route   GET /api/users/:username/following
// @access  Public
const getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).select("following");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit, 10) || 25,
        1
      ),
      50
    );

    const start = (page - 1) * limit;

    const followingIds = user.following || [];

    const ids = followingIds.slice(
      start,
      start + limit
    );

    const users = await User.find({
      _id: { $in: ids },
    })
      .select(
        "_id username displayName profilePicture followers following"
      )
      .lean();

    // Preserve the same order as the IDs stored in following
    const userMap = new Map(
      users.map((u) => [u._id.toString(), u])
    );

    const orderedUsers = ids
      .map((id) => userMap.get(id.toString()))
      .filter(Boolean)
      .map((u) => ({
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        profilePicture: u.profilePicture,
        followersCount: u.followers?.length || 0,
        followingCount: u.following?.length || 0,
      }));

    const hasMore =
      start + limit < followingIds.length;

    return res.status(200).json({
      users: orderedUsers,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching following:", error);

    return res.status(500).json({
      message: "Failed to fetch following",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  searchUsers,
  toggleFollow,
  updateProfile,
  googleAuth,
  toggleBookmark,
  getBookmarkedPosts,
  getFollowers,
  getFollowing,
};
