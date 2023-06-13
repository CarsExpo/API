const user = require("../Models/user");
const OTP = require("../Models/otp");
const jwt = require("jsonwebtoken");
const otplib = require("otplib");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const saltRounds = 10;
otplib.authenticator.options = { digits: 6 };

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

exports.register = async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    res.status(400).send({
      status: "Erreur",
      message: "Les champs ne doivent pas être vides",
    });
    return;
  }

  const userExists = await user.findOne({ email: email });

  if (userExists) {
    res.status(400).send({
      status: "Erreur",
      message: "Cet email est déjà utilisé par un autre utilisateur",
    });
    return;
  }

  const otp = otplib.authenticator.generate("secret");

  const newOtp = new OTP({
    email: email,
    otp,
  });

  await newOtp.save();

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: newOtp.email,
    subject: "Code OTP",
    text: `Votre code otp pour confirmer votre adresse email est ${otp}. \nVous avez 5minutes pour vérifier votre compte.`,
  });

  bcrypt.hash(password, saltRounds, async function (err, hash) {
    if (err) {
      console.error(err);
      return;
    }

    const newUser = new user({
      email: email,
      name: name,
      password: hash,
    });

    try {
      await newUser.save();
      res.status(200).send({
        status: "Succès",
        message: "OTP envoyé a votre email.",
      });
    } catch (err) {
      return res.status(400).send({
        status: "Erreur",
        message: "Erreur lors de la création de l'utilisateur.",
      });
    }
  });
};

exports.verify = async (req, res) => {
  const { email, otp } = req.body;

  const otpData = await OTP.findOne({ email: email, otp: otp });

  if (!otpData) {
    res.status(400).send({
      status: "Erreur",
      message: "OTP invalide ou expiré",
    });
    return;
  }

  const updatedUser = await user.findOneAndUpdate(
    { email: email },
    { verified: true },
    { new: true }  // Add this line
  );

  await OTP.deleteOne({ email: email, otp: otp });

  if (!updatedUser) {
    res.status(400).send({
      status: "Erreur",
      message: "Utilisateur introuvable",
    });
    return;
  }

  res.status(200).send({
    status: "Succès",
    message: "Utilisateur vérifié avec succès",
  });
};

exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  const otp = otplib.authenticator.generate("secret");

  const newOtp = new OTP({
    email: email,
    otp,
  });

  await newOtp.save();

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: newOtp.email,
    subject: "Code OTP",
    text: `Votre code otp pour confirmer votre adresse email est ${otp}. \nVous avez 5minutes pour vérifier votre compte.`,
  });
  res.status(200).send();
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send({
      status: "Erreur",
      message: "Les champs ne doivent pas être vides",
    });
    return;
  }

  const userFind = await user.findOne({ email: email });

  if (!userFind) {
    res.status(400).send({
      status: "Erreur",
      message: "L'email ou le mot de passe est incorrect",
    });
    return;
  }

  bcrypt.compare(password, userFind.password, function (err, result) {
    if (err) {
      console.log(err);
    }
    if (result) {
      const token = jwt.sign({ id: userFind._id }, process.env.JWT_SECRET);
      res.status(200).send({
        status: "Succès",
        message: "Connecté avec succès",
        token: token,
      });
    } else {
      res.status(400).send({
        status: "Erreur",
        message: "L'email ou le mot de passe est incorrect",
      });
    }
  });
};

exports.forgetPass = async (req, res) => {
  const { email } = req.body;

  try {
    const userFind = await user.findOne({ email: email });
    console.log('userFind:', userFind);

    if (!userFind) {
      return res.status(400).send({
        status: "Erreur",
        message: "L'email est incorrect",
      });
    }

    const token = jwt.sign({ id: userFind._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log('token:', token);

    const updatedUser = await user.findOneAndUpdate({ email: email },
      { 
        resetPasswordToken: token,
        resetPasswordExpires: Date.now() + 3600000, /*1 hour*/
      },
    );
    
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: updatedUser.email,
      subject: "Réinitialisation du mot de passe",
      text: `Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe: \n${process.env.CLIENT}/reset-password/${token}`,
    });

    return res.status(200).send({
      status: "Succès",
      message: "Email de réinitialisation envoyé avec succès",
    });

  } catch (error) {
    console.log('error:', error);
    return res.status(500).send({
      status: "Erreur",
      message: error.message,
    });
  }
};


exports.resetPass = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  const userFind = await user.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!userFind) {
    res.status(400).send({
      status: "Erreur",
      message: "Token de réinitialisation du mot de passe invalide ou expiré",
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  userFind.password = hashedPassword;
  userFind.resetPasswordToken = undefined;
  userFind.resetPasswordExpires = undefined;

  await userFind.save();

  res.status(200).send({
    status: "Succès",
    message: "Mot de passe réinitialisé avec succès",
  });
};
