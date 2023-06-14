const User = require("../Models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require("nodemailer");
const Blacklist = require("../Models/Blacklist");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
}); 

exports.info = async (req, res) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Accès refusé, aucun token fourni." });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  console.log(userId);
  const user = await User.findById(userId); 
  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé." });
  }

  res.json(user);
};

exports.delete = async (req, res) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Accès refusé, aucun token fourni." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.status(200).json({ message: "Utilisateur supprimé avec succès. Le token doit être supprimé." });
  } catch (err) {
    res.status(500).json({ message: "Une erreur s'est produite lors de la suppression de l'utilisateur." });
  }
};

exports.edit = async(req, res) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Accès refusé, aucun token fourni." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const { email, firstname, lastname, password } = req.body;

    let changes = {};

    if (email && email !== user.email) {
      changes.email = email;
    }

    if (firstname && firstname !== user.firstname) {
      changes.firstname = firstname;
    }

    if (lastname && lastname !== user.lastname) {
      changes.lastname = lastname;
    }

    if (password && password.trim()) { 
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (!isSamePassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        changes.password = hashedPassword; 
      }
    }

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ message: "Aucune modification effectuée." });
    }

    const confirmationToken = crypto.randomBytes(20).toString('hex');

    const clientIp = req.ip;
    user.pendingChanges = { ...changes, ip: clientIp };
    user.confirmationToken = confirmationToken;
    await user.save();

    const confirmationLink = `${process.env.CLIENT}/confirm-edit/${confirmationToken}`;

    let mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: user.email,
      subject: 'Confirmation de modification du compte',
      text: `Veuillez confirmer votre demande de modification de compte en cliquant sur le lien suivant : ${confirmationLink}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send('Une erreur s\'est produite lors de l\'envoi de l\'e-mail de confirmation.');
      } else {
        console.log('Email sent: ' + info.response);
        return res.send('E-mail de confirmation envoyé.');
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Une erreur s'est produite lors de la demande de modification de l'utilisateur." });
  }
};

exports.confirmEdit = async (req, res) => {
  try {
    const user = await User.findOne({ confirmationToken: req.params.token });

    if (!user) {
      return res.status(404).json({ message: "Le lien est invalide ou expiré." });
    }

      if (!req.body.confirmation) {
      const clientIp = user.pendingChanges.ip;
      user.pendingChanges = {};
      user.confirmationToken = undefined;
      await user.save();
    
      const newBan = new Blacklist({ ip: clientIp });
      await newBan.save();
    
      return res.json({ message: "Les modifications ont été annulées.\nChangez votre mot de passe" });
    }

    const { email, firstname, lastname, password } = user.pendingChanges;
    let changes = {};

    if (email && email !== user.email) {
      changes.email = email;
    }

    if (firstname && firstname !== user.firstname) {
      changes.firstname = firstname;
    }

    if (lastname && lastname !== user.lastname) {
      changes.lastname = lastname;
    }

    if (password && password.trim()) {
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (!isSamePassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        changes.password = hashedPassword;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, changes, { new: true });
    user.pendingChanges = {};
    user.confirmationToken = null;
    await user.save();

    res.json(updatedUser);

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Une erreur s'est produite lors de la mise à jour de l'utilisateur." });
  }
};