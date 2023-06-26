const express = require('express');
  const bodyParser = require('body-parser');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const mongoose = require('mongoose')
  require('dotenv').config();
  const Blacklist = require('./Models/blacklist');

  const app = express();

  const ipFilter = async (req, res, next) => {
    const clientIp = req.ip;
    
    const bannedIp = await Blacklist.findOne({ ip: clientIp });

    if (bannedIp) {
      res.status(403).json({ message: "L'accès a été refusé." });
    } else {
      next();
    }
  };

  mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

  app.use(ipFilter);
  app.use(cors({
    origin: "https://carsexpo.vercel.app",
    credentials: true
  }));

  app.use(helmet.xssFilter());
  app.use(bodyParser.json());
  app.use(morgan('combined'));

  const authRoutes = require('./Routes/auth');
  const userRoutes = require('./Routes/user');
  const adminRoutes = require('./Routes/admin');
  const blacklistRoutes = require('./Routes/blacklist');

  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/blacklist', blacklistRoutes);
  app.use('/api/admin', adminRoutes);

  app.listen(process.env.API_PORT, () => console.log(`Server is running on port ${process.env.API_PORT}`));