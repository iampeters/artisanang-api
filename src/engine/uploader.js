/* eslint-disable require-atomic-updates */
const util = require('util');
const multer = require('multer');
const path = require('path');

class Uploader {

  constructor() {
    const storageOptions = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'public/images/');
      },
      filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
      }
    });

    this.upload = multer({
      storage: storageOptions,
      limits: {
        fileSize: 1000000
      },
      fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
      }
    });

    // Check File Type
    function checkFileType(file, cb) {
      // Allowed ext
      const filetypes = /jpeg|jpg|png|gif|/;
      // Check ext
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      // Check mime
      const mimetype = filetypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        return cb('Error! Only images allowed');
      }
    }
  }

  async startUpload(req, res) {

    try {
      const upload = util.promisify(this.upload.any());
      await upload(req, res);

      if (!req.files || req.files.length == 0) return 'Please select an image!';

      for (let x in req.files) {
        if (process.env.NODE_ENV !== 'production') {
          req.body.imageUrl = 'http://localhost:5000/images/' + req.files[x].filename;
        } else {
          req.body.imageUrl = 'https://sandbox.artisana.ng/images/' + req.files[ x ].filename;
        }
      }

    } catch (err) {
      //Handle your exception here
      if (err instanceof multer.MulterError) return err.message;
      if (err) return err;
    }
  }
}

module.exports = Uploader;
