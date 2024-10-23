
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    file_name: { type: String, required: true },  
    file_size: { type: Number, required: true },  
    s3Key: { type: String, required: true },      
    uploadDate: { type: Date, default: Date.now },
  });

module.exports = mongoose.model('File', fileSchema);
    