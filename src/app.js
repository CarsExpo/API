const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose')
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: process.env.CLIENT,
  methods: 'GET,POST',
  credentials: true,
};

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors(corsOptions));
app.use(helmet.xssFilter());
app.use(bodyParser.json());
app.use(morgan('combined'));

const authRoutes = require('./Routes/auth');

app.use('/api/auth', authRoutes);

app.listen(process.env.API_PORT, () => console.log(`Server is running on port ${process.env.API_PORT}`));