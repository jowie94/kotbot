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
    var game = {
        'players': [],
        'join': true,
        'tokyo': undefined
    };
    games[fromId] = game;
    bot.sendMessage(fromId, 'GAME STARTED!.\nJoin the game typing /join in the chat.\nStart playing typing /close.');
});
