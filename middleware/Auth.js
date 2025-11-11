import jwt from 'jsonwebtoken';
import expressAsyncHandler from 'express-async-handler';
import User from '../Models/UserModels.js';

// desc Authenticated user & get token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // token will expire in 30 days
  });
};

// protect routes
const protect = expressAsyncHandler(async (req, res, next) => {
  let token;

  // check if token is sent in the header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // get token
      token = req.headers.authorization.split(' ')[1];
      // decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // get user by id
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.log(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  // check if token is not sent in the header
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

export { generateToken, protect };
