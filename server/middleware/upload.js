const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Your existing config...
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// UPGRADED: Dynamic Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Dynamically assign the Cloudinary folder based on the upload type
    let folderName = 'moboxd_posts'; 
    
    if (file.fieldname === 'profilePicture') {
      folderName = 'moboxd_avatars';
    }

    return {
      folder: folderName,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    };
  },
});

const upload = multer({ storage: storage });

module.exports = upload;