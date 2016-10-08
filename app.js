var TelegramBot = require('node-telegram-bot-api');

var token = process.env.bot_key;

var bot = new TelegramBot(token, {polling: true});

var games = {};

bot.onText(/\/echo/, function(msg) {
    var fromId = msg.chat.id;
    bot.sendMessage(fromId, "Hello world!");
});

bot.onText(/\/start/, function(msg) {
    var fromId = msg.chat.id;
    if (games[fromId] !== undefined) {
        bot.sendMessage(fromId,'Game already started');
    }
    else {
        var game = {
            'players': [],
            'join': true,
            'tokyo': undefined
        };
        games[fromId] = game;
        bot.sendMessage(fromId, 'GAME STARTED!.\nJoin the game typing /join in the chat.\nStart playing typing /close.');
    }
});

bot.onText(/\/close/, function(msg) {
    var fromId = msg.chat.id;
    if (games[fromId].join === true) {
        games[fromId].join = false;
        bot.sendMessage(fromId, 'No more players are accepted.');
    }
    else {
        bot.sendMessage(fromId, 'Game already started');
    }
});

bot.onText(/\/end/, function(msg) {
    var fromId = msg.chat.id;
    if (games[fromId] !== undefined) {
        delete games[fromId];
        bot.sendMessage(fromId,'Ending game...');
    }
    else {
        bot.sendMessage(fromId, 'No games running.');
    }
});