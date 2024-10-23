
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fileRoutes = require('./routes/fileRoutes');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

// File routes
app.use('/api/files', fileRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
    