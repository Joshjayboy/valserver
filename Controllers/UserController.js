import User from "../Models/UserModels.js";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/Auth.js";


const getUsers = expressAsyncHandler(async (req, res) => {
  // await User.deleteMany({}); // delete all users in the database
  const createdUsers = await User.find({}); // insert all users from data.users
  res.status(201).send(createdUsers);
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public

const login = expressAsyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user by email
    const user = await User.findOne({ email });
    // check if user exist
    if (user) {
      // compare password
      if (bcrypt.compareSync(password, user.password)) {
        res.json({
          _id: user._id,
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          image: user.image,
          isAdmin: user.isAdmin,
          token: generateToken(user._id), // generate token for authentication in the frontend
        });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } else {
      res.status(401).json({ message: "Invalid email" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc   Register new user
// @route  POST /api/users
// @access Public

const register = expressAsyncHandler(async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    // find user by email
    const existUser = await User.findOne({ email });
    // check if user exist

    if (existUser) {
      res.status(400);
      throw new Error("User already exist");
    }
    // create new user
    else {
      const user = await User.create({
        fullName,
        email,
        phone,
        password: bcrypt.hashSync(password, 10), // hash password
      });
      // send response
      if (user) {
        res.status(201).json({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          image: user.image,
          isAdmin: user.isAdmin,
          token: generateToken(user._id), // generate token for authentication in the frontend
        });
      } else {
        res.status(400);
        throw new Error("Invalid user data");
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc update user profile
// @route PUT /api/users
// @access Private

const updateProfile = expressAsyncHandler(async (req, res) => {
  try {
    // find user by id
    const user = await User.findById(req.user._id);
    // check if user exist
    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.image = req.body.image || user.image;

      // save user
      const updatedUser = await user.save();
      // send response
      res.json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        image: updatedUser.image,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Change user password
// @route PUT /api/users/password
// @access Private

const changePassword = expressAsyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // find user by id
    const user = await User.findById(req.user._id);
    // if old password is matched with new password
    if (user) {
      if (bcrypt.compareSync(oldPassword, user.password)) {
        user.password = bcrypt.hashSync(newPassword, 10);

        // save user
        await user.save();
        // send response
        res.json({
          message: "Password changed successfully",
        });
      } else {
        res.status(401);
        throw new Error("Invalid old password");
      }
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete user
// @route DELETE /api/users
// @access Private

const deleteUser = expressAsyncHandler(async (req, res) => {
  try {
    // find user by id and delete
    const user = await User.findByIdAndDelete(req.user._id);
    // check if user exist
    if (user) {
      // delete user order
      await Order.deleteMany({ user: user._id });
      res.json({ message: "User removed" });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export {
  // importUsers,
  getUsers,
  login,
  register,
  updateProfile,
  changePassword,
  deleteUser,
};
