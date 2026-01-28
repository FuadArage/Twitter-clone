import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username: username.trim() }).select(
      "username fullname bio profileImg coverImg link"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching the profile" });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (id === currentUserId.toString()) {
      return res
        .status(400)
        .json({ error: "You can't follow/unfollow yourself" });
    }

    const [userToModify, currentUser] = await Promise.all([
      User.findById(id),
      User.findById(currentUserId),
    ]);

    if (!userToModify || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // Unfollow
      await Promise.all([
        User.findByIdAndUpdate(id, { $pull: { followers: currentUserId } }),
        User.findByIdAndUpdate(currentUserId, { $pull: { following: id } }),
      ]);

      return res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // Follow
      await Promise.all([
        User.findByIdAndUpdate(id, { $push: { followers: currentUserId } }),
        User.findByIdAndUpdate(currentUserId, { $push: { following: id } }),
      ]);

      const newNotification = new Notification({
        type: "follow",
        from: currentUserId,
        to: userToModify._id,
      });

      await newNotification.save();

      return res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.error("Error in followUnfollowUser:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const userFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId, $nin: userFollowedByMe.following },
        },
      },
      { $sample: { size: 10 } },
      {
        $project: {
          password: 0,
          email: 0,
          tokens: 0,
          // include only fields you want to expose
        },
      },
    ]);

    const suggestedUsers = users.slice(0, 4);
    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.error("Error in getSuggestedUsers:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { fullname, email, username, currentpassword, newpassword, bio, link } =
    req.body;

  let { profileImg, coverImg } = req.body;
  const userId = req.user._id;
  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      (!newpassword && currentpassword) ||
      (newpassword && !currentpassword)
    ) {
      return res.status(400).json({
        error: "please provide both current password and new password",
      });
    }

    if (newpassword && currentpassword) {
      const isMatch = await bcrypt.compare(currentpassword, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ error: "Current password is  incorrect" });
      if (newpassword.length < 6) {
        return res
          .status(400)
          .json({ error: "password must be 6 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newpassword, salt);
    }

    if (profileImg) {
      try {
        if (user.profileImg) {
          const publicId = user.profileImg
            .split("/")
            .slice(-1)[0]
            .split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }

        const uploadedResponse = await cloudinary.uploader.upload(profileImg);
        user.profileImg = uploadedResponse.secure_url;
      } catch (err) {
        console.error("Error updating profile image:", err.message);
        return res
          .status(500)
          .json({ error: "Failed to update profile image" });
      }
    }

    if (coverImg) {
      try {
        if (user.coverImg) {
          const publicId = user.coverImg.split("/").slice(-1)[0].split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }

        const uploadedResponse = await cloudinary.uploader.upload(coverImg);
        user.coverImg = uploadedResponse.secure_url;
      } catch (err) {
        console.error("Error updating cover image:", err.message);
        return res.status(500).json({ error: "Failed to update cover image" });
      }
    }

    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json(userObj);
  } catch (error) {
    console.log("Error in updateUser:", error.message);
    res.status(500).json({ error: error.message });
  }
};


