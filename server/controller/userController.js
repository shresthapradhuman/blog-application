const asyncErrorhandler = require("../middleware/asyncError");
const errorHandler = require("../utils/errorhandler");
const { register, forget, prof } = require("../utils/validation");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const salt = 10;
const crypto = require("crypto");
const sendEmail = require("../utils/sendemail");

/** find user */
const checkUser = async (data) => {
  return await prisma.user.findMany({
    where: data,
  });
};
/** password hashing */
const hashPassword = async (data) => {
  return await bcrypt.hash(data, salt);
};
/** match password */
const isMatch = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
/** generates jsonwebtoken  */
const generateToken = (tokenId) => {
  const payload = {
    load: tokenId,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY_TIME,
  });
};

/** function generate and update password reset token and expiry date */
const resetToken = async (email) => {
  const cryptoId = crypto.randomBytes(10).toString("hex");
  const cryptotoken = crypto
    .createHash("sha256")
    .update(cryptoId)
    .digest("hex");
  await prisma.user.update({
    where: {
      email,
    },
    data: {
      resetToken: cryptotoken,
      tokenExpiryDate: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return cryptoId;
};

let user = {
  /** get all user data */
  findAll: async (req, res, next) => {
    let user = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(200).json({
      success: true,
      result: user,
    });
  },
  /** get single user data */
  findById: async (req, res, next) => {
    let id = parseInt(req.params.id);
    let user = await checkUser({ id });
    if (user.length == 0) {
      return next(new errorHandler(`user doesn't exist`, 404));
    }
    res.status(200).json({
      success: true,
      result: user,
    });
  },
  /** register new user */
  register: asyncErrorhandler(async (req, res, next) => {
    /** requested data validation check */
    const validate = register.validate(req.body);
    if (validate.error) {
      return next(new errorHandler(validate.error, 400));
    }
    /** data destructuring */
    const { email, password } = req.body;
    /** check user already exist or not */
    const user = await checkUser({ email });
    if (user.length > 0) {
      return next(new errorHandler(`${email} already exist.`, 400));
    }
    /** hashing password */
    const hash = await hashPassword(password);
    /** register the user */
    const result = await prisma.user.create({
      data: {
        email,
        password: hash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    /** generated json web token */
    const token = await generateToken(result.id);
    res
      .status(201)
      .cookie("token", token)
      .json({
        success: true,
        message: `${email} registered succesfully`,
        result,
        token,
      });
  }),
  /** user login */
  login: asyncErrorhandler(async (req, res, next) => {
    /** requested data validation check */
    const validate = register.validate(req.body);
    if (validate.error) {
      return next(new errorHandler(validate.error, 400));
    }
    /** data destructuring */
    const { email, password } = req.body;
    /** check user already exist or not */
    const user = await checkUser({ email });
    if (user.length == 0) {
      return next(new errorHandler(`${email} doesn't exist.`, 400));
    }
    if (!(await isMatch(password, user[0].password))) {
      return next(
        new errorHandler(`wrong email and password combination`, 400)
      );
    }
    /** generated json web token */
    const token = await generateToken(user[0].id);
    res.status(200).cookie("token", token).json({
      success: true,
      result: user,
      token,
    });
  }),
  /** logout user */
  logout: asyncErrorhandler(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "logout successfully",
    });
  }),
  /** change password  */
  changePassword: asyncErrorhandler(async (req, res, next) => {
    const id = parseInt(req.params.id);
    const { currentPassword, password, confirmPassword } = req.body;
    const user = await checkUser({ id });
    if (user.length == 0) {
      return next(new errorHandler(`user doesn't exist`, 400));
    }
    if (!(await isMatch(currentPassword, user[0].password))) {
      return next(new errorHandler(`current password doesn't match`, 400));
    }
    if (password != confirmPassword) {
      return next(
        new errorHandler(`password and confirm password doesn't matched`, 400)
      );
    }
    const hash = await hashPassword(password);
    const change = await prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hash,
      },
    });
    res.status(200).json({
      success: true,
      message: "password has been changed successfully",
    });
  }),
  /** forget password */
  forgetPassword: asyncErrorhandler(async (req, res, next) => {
    /** check email is valid data or not */
    const validate = forget.validate(req.body);
    if (validate.error) {
      return next(new errorHandler(validate.error, 400));
    }
    const user = await checkUser(req.body);
    if (user.length == 0) {
      return next(new errorHandler(`${req.body.email} doesn't exist`));
    }
    try {
      /** update and get the reset cryptoToken */
      const token = await resetToken(user[0].email);
      /** Password reset url */
      const resetPasswordUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/user/password/reset/${token}`;
      /** password reset message */
      const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;
      await sendEmail({
        email: user[0].email,
        subject: `Password Reset Url Link`,
        message,
      });
      res.status(200).json({
        success: true,
        message: `email is sent to ${user[0].email} successfully`,
      });
    } catch (error) {
      return next(new errorHandler(error.message, 500));
    }
  }),
  /** reset password */
  resetPassword: asyncErrorhandler(async (req, res, next) => {
    /** destucturing the data */
    const { password, confirmPassword } = req.body;
    /** hashing the cryptoId */
    const token = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    /** getting user data using resettokken */
    const check = await checkUser({
      resetToken: token,
    });
    // /** check user exist or not */
    if (check.length < 1)
      return next(new errorHandler("token has been expired", 400));
    /** check reset time expiry */
    if (check[0].tokenExpiryDate < new Date())
      return next(
        new errorHandler("password reset token has been expired", 400)
      );
    // /** check password and confirm password match or not */
    if (password !== confirmPassword)
      return next(
        new errorHandler("password and confirm password doesn't match", 404)
      );
    // /** hash the new password */
    const hash = await hashPassword(password);
    // /** update the password, resettoken and expiry date */
    await prisma.user.update({
      where: {
        email: check[0].email,
      },
      data: {
        password: hash,
        resetToken: null,
        tokenExpiryDate: null,
      },
    });
    res.json({
      success: true,
      message: "password has been reset. try login again",
    });
  }),
  /** create or update the profile */
  createProfile: asyncErrorhandler(async (req, res, next) => {
    const userId = parseInt(req.params.id);
    const { firstname, middlename, lastname, birthday, mobile } = req.body;
    const user = await checkUser({ id: userId });
    if (user.length == 0) {
      return next(new errorHandler("user doesn't exist", 404));
    }
    const checkProfile = await prisma.profile.findMany({
      where: {
        userId,
      },
    });
    const profile = await prisma.profile.upsert({
      where: {
        userId,
      },
      update: {
        firstname,
        middlename,
        lastname,
        birthday: new Date(birthday),
        mobile: mobile,
      },
      create: {
        userId,
        firstname,
        middlename,
        lastname,
        birthday: new Date(birthday),
        mobile: mobile,
      },
    });
    if (checkProfile.length == 0) {
      return res.status(201).json({
        success: true,
        message: "profile successfully created",
        profile,
      });
    }
    res.status(200).json({
      success: true,
      message: "profile successfully updated",
      profile,
    });
  }),
  /** delete the user */
  deleteProfile: asyncErrorhandler(async (req, res, next) => {
    const userId = parseInt(req.params.id);
    const deletePrfile = prisma.profile.deleteMany({
      where: {
        userId,
      },
    });
    const deleteUser = prisma.user.deleteMany({
      where: {
        id: userId,
      },
    });
    await prisma.$transaction([deletePrfile, deleteUser]);
    res.status(204)
  }),
};

module.exports = user;
