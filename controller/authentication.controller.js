require("dotenv").config();

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const connection = require("../db");
const transporter = require("../utils/nodemailer");
const moment = require("moment");
const NewError = require("../helpers/error-stack.helper");

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

    var isRoleExist = await queryDB(`SELECT * FROM roles WHERE id = ${bodies.role_id}`);

    var isUserExist = await queryDB(`SELECT email FROM  users WHERE email = "${bodies.email}"`);

    var isPhoneExist = await queryDB(`SELECT phone FROM  users WHERE phone = "${bodies.phone}"`);

    // check if role_id exist
    if (isRoleExist.length < 1) {
      throw new NewError(404, "Role not found");
    }

    // check if email already exist
    if (isUserExist.length > 0) {
      throw new NewError(409, "Email already exist");
    }

    // check if phone already exist
    if (isPhoneExist.length > 0) {
      throw new NewError(409, "Phone already exist");
    }

    // Hash password
    const encrypted = crypto.createHmac("sha256", process.env.SECRET).update(bodies.password).digest("hex");

    // insert user record
    var user = await queryDB(
      `INSERT INTO users (id,role_id,email,password,name,address,phone,updated_at,created_at) VALUES (DEFAULT,?,?,?,?,?,?,DEFAULT,DEFAULT)`,
      [bodies.role_id, bodies.email, encrypted, bodies.name, bodies.address, bodies.phone]
    );

    return res.status(200).json({
      code: 201,
      message: "Success create user",
      data: {
        name: bodies.name,
        email: bodies.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // check if email exist
    var user = await queryDB(`SELECT id, role_id, email, password FROM users WHERE email = "${email}"`);

    // if not exist, throw error user not found
    if (user.length < 1) {
      throw new NewError(404, "User not found");
    }

    // compare password if exist
    const hasedPassword = crypto.createHmac("sha256", process.env.SECRET).update(password).digest("hex");
    const isValidPassword = hasedPassword === user[0].password;

    // if the password different, throw invalid password
    if (!isValidPassword) {
      throw new NewError(403, "Credentials incorrect");
    }

    // decide the role name based on role_id
    var roleName = "";

    if (user[0].role_id === 1) {
      roleName = "admin";
    } else if (user[0].role_id === 2) {
      roleName = "member";
    } else {
      roleName = "guest";
    }

    // if the password match, generate token
    const token = jwt.sign({ user_id: user[0].id, role: roleName }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // send the token in response
    return res.status(200).json({
      code: 200,
      message: "Login succesful",
      token,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const subject = "Reset Your Password";

    // check if the user email exist
    const isUserExist = await queryDB(`SELECT email FROM  users WHERE email = "${email}"`);

    // if user email doesn't exist, send error message
    if (isUserExist.length < 1) {
      throw new NewError(404, "Email not found");
    }

    // create reset token
    const resetToken = crypto.randomBytes(16).toString("hex");

    const token = resetToken;

    // create reset token expiration time
    const tokenExpired = moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss");

    // update user document with the reset token and expiration time
    var user = await queryDB(`UPDATE users SET reset_token = ?, token_expired_at = ? WHERE email = ?`, [token, tokenExpired, email]);

    // send the reset password link using nodemailer
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
    const { email, token } = req.query;
    bodies = req.body;

    // Hash new password
    const encrypted = crypto.createHmac("sha256", process.env.SECRET).update(bodies.new_password).digest("hex");

    // check if the user email exist
    const user = await queryDB(`SELECT password, reset_token, token_expired_at FROM users WHERE email = "${email}"`);

    // if not exist, throw error
    if (!user) {
      throw new NewError(404, "Email not found");
    }

    // change token_expired_at date format with moment
    const formatted = moment(user[0].token_expired_at).format("YYYY-MM-DD HH:mm:ss");

    // check if the eset token match
    if (token === user[0].reset_token) {
      // check if the token not expired yet
      if (formatted > moment().format("YYYY-MM-DD HH:mm:ss")) {
        // confirm the new password
        if (bodies.confirm_new_password == bodies.new_password) {
          const newPassword = await queryDB(`UPDATE users SET password = ? WHERE email = ?`, [encrypted, email]);
        } else {
          throw new NewError(401, "Incorrect new password confirmation");
        }
      } else {
        throw new NewError(410, "Expired link");
      }
    } else {
      throw new NewError(403, "Incorrect reset token");
    }

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
