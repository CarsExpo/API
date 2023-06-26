const User = require("../Models/user");
const Role = require('../Models/role');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

exports.allUser = async (req, res) => {
    try {
      const users = await User.find({}); 
      return res.json(users);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'An error occurred' });
    }
};
  

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndRemove(id);

        return res.status(200).json({ message: 'User deleted successfully' });

    } catch (error) {
        return res.status(500).json({ message: 'An error occurred while deleting the user', error });
    }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (updates.email && updates.email !== user.email) {
      user.email = updates.email;
    }

    if (updates.firstname && updates.firstname !== user.firstname) {
      user.firstname = updates.firstname;
    }

    if (updates.lastname && updates.lastname !== user.lastname) {
      user.lastname = updates.lastname;
    }

    if (updates.discord && updates.discord !== user.discord) {
      user.discord = updates.discord;
    }

    if (updates.work && updates.work !== user.work) {
      user.work = updates.work;
    }

    if (updates.role && updates.role !== user.roles) {
      user.roles = updates.role;
    }

    if (updates.password && updates.password.trim()) {
      const isSamePassword = await bcrypt.compare(updates.password, user.password);
      if (!isSamePassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(updates.password, salt);
        user.password = hashedPassword;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Aucun changement effectué' });
    }

    await user.save();

    return res.status(200).json({ message: 'Changement effectué', user });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'An error occurred while updating the user', error });
  }
};

exports.allRoles = async (req, res) => {
  try {
    // Requête pour récupérer tous les rôles depuis la base de données
    const roles = await Role.find();

    // Vérifier si des rôles ont été trouvés
    if (roles.length === 0) {
      return res.status(404).json({ message: 'Aucun rôle trouvé' });
    }

    // Retourner les rôles
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue lors de la récupération des rôles' });
  }
}