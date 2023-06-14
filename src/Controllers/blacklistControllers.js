const Blacklist = require('../Models/Blacklist');

exports.ban = async (req, res) => {
  const { ip } = req.body;

  try {
    const existingBan = await Blacklist.findOne({ ip });

    if (existingBan) {
      return res.status(400).json({ message: "Cette IP est déjà bannie." });
    }

    const newBan = new Blacklist({ ip });
    await newBan.save();

    res.status(200).json({ message: "IP bannie avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Une erreur est survenue lors de la tentative de bannissement de l'IP." });
  }
};
