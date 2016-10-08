var TelegramBot = require('node-telegram-bot-api');

var token = process.env.bot_key;

var bot = new TelegramBot(token, {polling: true});

var games = {};

var GameStates = {
    JOINING: 0,
    PREROLL: 1,
    DICESELECT: 2
}

var emojis = [
    '\u0030\u20E3',
    '\u0031\u20E3',
    '\u0032\u20E3',
    '\u2733',
    '\u271D',
    '\u2665'
]

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
            'tokyo': undefined,
            'state': GameStates.JOINING
        };
        games[fromId] = game;
        bot.sendMessage(fromId, 'GAME STARTED!.\nJoin the game typing /join in the chat.\nStart playing typing /close.');
    }
});

bot.onText(/\/close/, function(msg) {
    var fromId = msg.chat.id;
    var game = games[fromId];
    if (game.join === true) {
        game.join = false;
        //bot.sendMessage(fromId, 'No more players are accepted.');
        game.currentPlayer = game.players[0].id;
        bot.sendMessage(fromId, 'No more players are accepted.\nPlayer @' + game.players[0].name + ' starts.');
        //bot.sendMessage(fromId, 'Player @' + game.players[0].name + ' starts');
        beginRollDice(fromId, game.players[0], game);
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

bot.onText(/Roll the dice/, function(msg) {
    var fromId = msg.chat.id;
    if (!gameIsRunning(fromId)) {
        bot.sendMessage(fromId, 'There is no game running on this chat!');
        return;
    }

    var game = games[fromId];
    if (game.currentPlayer !== msg.from.id) {
        bot.sendMessage(fromId, 'It isn\'t your turn', {'reply_to_message_id': msg.message_id});
        return;
    }

    if (game.state !== GameStates.PREROLL) {
        bot.sendMessage(fromId, 'You can\'t roll the dices now', {'reply_to_message_id': msg.message_id});
        return;
    }

    var result = rollDices(6);
    var str = '';
    result.forEach((value, index) => str += (index + 1) + '. ' + emojis[value] + '\n');
    bot.sendMessage(fromId, 'Result:\n' + str);
    game.state = GameStates.DICESELECT;
});

function gameIsRunning(gameId) {
    return gameIsStarted(gameId) && !games[gameId].join;
}

function gameIsStarted(gameId) {
    return games[gameId] !== undefined;
}

function beginRollDice(chatId, player, game) {
    game.state = GameStates.PREROLL;
    var keyboard = {
        'keyboard': [['Roll the dice']],
        'resize_keyboard': true,
        'one_time_keyboard': true,
        'selective': true
    };
    bot.sendMessage(chatId, '@' + player.name + ' roll the dice, please', {'reply_markup': keyboard});
}

function rollDices(amount) {
    var dices = [];
    for (i = 0; i < amount; i++) { 
        dices[i] = Math.floor(Math.random() * 11)%6;
        console.log(dices[i]);
    }
    return dices;
}
