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

bot.onText(/\/join/, function(msg) {
    var fromId = msg.chat.id;
    var game = games[fromId];

    if (game === undefined) {
        bot.sendMessage(fromId, 'There is no game running on this chat!');
    }
    else if (!game.join) {
        bot.sendMessage(fromId, 'This game is not accepting more players!');
    }
    else if (game.players.some((value, index, array) => value.id === msg.from.id)) {
        bot.sendMessage(fromId, 'You are already registered', {'reply_to_message_id': msg.message_id});
    }
    else {
        var player = {
            'id': msg.from.id,
            'name': msg.from.username,
            'life': 10,
            'score': 0,
            'power': 0
        };
        game.players.push(player);

        bot.sendMessage(fromId, 'Player @' + msg.from.username + ' joined');
    }
});
