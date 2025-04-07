require('dotenv').config(); // Charger les variables d'environnement

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var socketIo = require('socket.io');
const { OpenAI } = require('openai'); // Importer la bibliothèque OpenAI

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var server = http.createServer(app);
var io = socketIo(server);

// Initialisation d'OpenAI avec ta clé API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔮 Fonction de réponse automatique de l'assistant
async function assistantResponse(msg) {
  msg = msg.toLowerCase();

  // Vérifications pour des réponses simples
  if (msg.includes('bonjour')) return "Bonjour, comment puis-je vous aider ? 🤖";
  if (msg.includes('heure')) return "Il est actuellement " + new Date().toLocaleTimeString();
  if (msg.includes('merci')) return "Avec plaisir ! 😊";

  // Si le message ne correspond à aucune réponse simple, utiliser OpenAI pour générer une réponse
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // Ou un autre modèle si tu préfères
      messages: [{ role: 'user', content: msg }],
    });
    return response.choices[0].message.content.trim(); // Retourner la réponse générée
  } catch (error) {
    console.error('Erreur OpenAI :', error);
    return "Désolé, je n'ai pas pu traiter votre demande.\n" +
    "Mon accès à l'API d'OpenAI a atteint sa limite gratuite pour le moment. 🤖";
  }
}

io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  socket.on('message', async (msg) => {
    console.log('Message reçu : ' + msg);

    // Renvoyer le message à l'expéditeur (lui-même)
    socket.emit('message', msg);

    // Diffuser aux autres utilisateurs
    socket.broadcast.emit('message', msg);

    // Répondre via assistant si nécessaire
    const botReply = await assistantResponse(msg);
    if (botReply) {
      setTimeout(() => {
        io.emit('message', 'Assistant 🤖 : ' + botReply);
      }, 1000); // délai de 1 seconde
    }
  });

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

// Gestion des erreurs
app.use(function(req, res, next) {
  next(createError(404));
});
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

server.listen(3000, () => {
  console.log('Serveur WebSocket écoute sur le port 3000');
});

module.exports = app;
