var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http'); // Importer le module http
var socketIo = require('socket.io'); // Importer socket.io

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Créer un serveur HTTP
var server = http.createServer(app);

// Initialiser socket.io sur ce serveur
var io = socketIo(server);

// Configurer WebSocket
io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');
  
  // Gestion de l'envoi de messages
  socket.on('message', (msg) => {
    console.log('Message reçu : ' + msg);
    // Diffuser le message à tous les autres clients
    socket.broadcast.emit('message', msg);
  });
  
  // Détection de la déconnexion
  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté');
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Lancer le serveur HTTP
server.listen(3000, () => {
  console.log('Serveur WebSocket écoute sur le port 3000');
});

module.exports = app;
