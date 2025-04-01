var path = require('path');
var express = require('express');
var router = express.Router();

// Route pour afficher la page de chat en temps réel
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = router;
