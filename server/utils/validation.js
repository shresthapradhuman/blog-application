const Joi = require("joi");
const register = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
});

const forget = Joi.object({
  email: Joi.string().trim().email().required(),
});

module.exports = { register, forget };
