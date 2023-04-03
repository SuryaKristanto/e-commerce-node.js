require("dotenv").config();

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const connection = require("../db");
const transporter = require("../utils/nodemailer");
const moment = require("moment");
const Roles = require("../db/schemas/role.schema");
const Users = require("../db/schemas/user.schema");
const { default: mongoose } = require("mongoose");

async function queryDB(query, param) {
  return new Promise((resolve) => {
    connection.query(query, param, function (err, result, fields) {
      if (err) {
        //resolve('err : ' + err.stack);
        resolve("err :" + err.message);
      } else {
        resolve(result);
      }
    });
  });
}

const register = async (req, res, next) => {
  try {
    const bodies = req.body;

    const role = await Roles.findById(bodies.role_id);

    const email = await Users.findOne({ email: bodies.email });

    const phone = await Users.findOne({ phone: bodies.phone });

    // check if role_id exist
    if (!role) {
      throw {
        code: 404,
        message: "role not found",
      };
    }
    // console.log(role);

    // check if email already exist
    if (email) {
      throw {
        code: 400,
        message: "email already exist",
      };
    }
    // console.log(email);

    // check if phone already exist
    if (phone) {
      throw {
        code: 400,
        message: "phone already exist",
      };
    }
    // console.log(phone);

    // Hash password
    const encrypted = crypto.createHmac("sha256", process.env.SECRET).update(bodies.password).digest("hex");
    // console.log(encrypted);

    // update password on bodies
    bodies.password = encrypted;

    // insert user document
    const user = await Users.create(bodies);
    // console.log(user);

    return res.status(200).json({
      code: 201,
      message: "success create user",
      data: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // cek email tersebut ada ngga di db
    var user = await queryDB(`SELECT id, role_id, email, password FROM users WHERE email = "${email}"`);
    console.log(user);

    // kalo gaada email, throw error user not found
    if (user.length < 1) {
      throw {
        code: 404,
        message: "user not found",
      };
    }

    // kalo ada kita compare pw
    const hasedPassword = crypto.createHmac("sha256", process.env.SECRET).update(password).digest("hex");
    const isValidPassword = hasedPassword === user[0].password;

    // kalo pwnya beda, throw invalid pw
    if (!isValidPassword) {
      throw {
        code: 401,
        message: "incorrect password",
      };
    }

    // menentukan nama role berdasarkan role_id
    var roleName = "";

    if (user[0].role_id === 1) {
      roleName = "admin";
    } else if (user[0].role_id === 2) {
      roleName = "member";
    } else {
      roleName = "guest";
    }

    // kalo pwnya sama, generate token
    const token = jwt.sign({ user_id: user[0].id, role: roleName }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // kirim token di respon
    return res.status(200).json({
      code: 200,
      message: "login succesful",
      token,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email;
    const subject = "Reset Your Password";

    const isUserExist = await queryDB(`SELECT email FROM  users WHERE email = "${email}"`);

    // cek apakah ada user yang memiliki email yang sudah di register
    // if user doesn't exist, send error message
    if (isUserExist.length < 1) {
      throw {
        code: 400,
        message: "email not found",
      };
    }
    // console.log(isUserExist.length);

    const resetToken = crypto.randomBytes(16).toString("hex");

    const token = resetToken;

    const tokenExpired = moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss");

    var user = await queryDB(`UPDATE users SET reset_token = ?, token_expired_at = ? WHERE email = ?`, [token, tokenExpired, email]);
    // console.log(user);

    let mailOptions = {
      from: process.env.NODEMAILER_USER,
      to: email,
      subject: subject,
      html: `Please click this link to reset your password: <a href="http://localhost:8080/reset-password?email=${email}&token=${token}">Reset Password</a>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.send("Error: Something went wrong.");
      } else {
        console.log("Email sent: " + info.response);
        res.send("Email sent. Please check your email to reset your password.");
      }
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    email = req.query.email;
    token = req.query.token;
    bodies = req.body;

    const encryptedOld = crypto.createHmac("sha256", process.env.SECRET).update(bodies.old_password).digest("hex");
    // console.log(encrypted);

    const encryptedNew = crypto.createHmac("sha256", process.env.SECRET).update(bodies.new_password).digest("hex");
    // console.log(encrypted);

    const reset = await queryDB(`SELECT password, reset_token, token_expired_at FROM users WHERE email = "${email}"`);
    // console.log(reset);

    const formatted = moment(reset[0].token_expired_at).format("YYYY-MM-DD HH:mm:ss");
    // console.log(formatted);

    if (token == reset[0].reset_token) {
      if (formatted > moment().format("YYYY-MM-DD HH:mm:ss")) {
        if (reset[0].password == encryptedOld) {
          if (bodies.confirm_new_password == bodies.new_password) {
            const newPassword = await queryDB(`UPDATE users SET password = ? WHERE email = ?`, [encryptedNew, email]);
            console.log(newPassword);
          } else {
            throw {
              code: 400,
              message: "incorrect new password confirmation",
            };
          }
        } else {
          throw {
            code: 400,
            message: "incorrect old password",
          };
        }
      } else {
        throw {
          code: 400,
          message: "expired link",
        };
      }
    } else {
      throw {
        code: 400,
        message: "incorrect reset token",
      };
    }

    return res.status(200).json({
      message: "reset password success",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
