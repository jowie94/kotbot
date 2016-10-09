var TelegramBot = require('node-telegram-bot-api');

var token = process.env.bot_key;

var bot = new TelegramBot(token, {polling: true});

String.prototype.contains = function (v) {
    return this.indexOf(v) > -1;
}

Array.prototype.contains = function (v) {
    return this.indexOf(v) > -1;
}

var games = {};

var GameStates = {
    JOINING: 0,
    PREROLL: 1,
    DICESELECT: 2,
    RESOLVE: 3
}

var dices = {
    ONE: 0,
    TWO: 1,
    THREE: 2,
    ENERGY: 3,
    ATTACK: 4,
    HEART: 5
}

var emojis = [
    '\u0031\u20E3',
    '\u0032\u20E3',
    '\u0033\u20E3',
    '\u26A1',
    '\u2694',
    '\u2665',
    '\u2B50'
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
        console.log('Game started, game id: ' + fromId);
        console.log(Object.keys(games).length + ' games are running in total');
        var game = {
            'id': fromId,
            'players': [],
            'join': true,
            'tokyo': undefined,
            'state': GameStates.JOINING,
            'dices': [-1, -1, -1, -1, -1, -1],
            'selected_dices': [false, false, false, false, false, false],
            'currentPlayerPos': -1
        };
        games[fromId] = game;
        bot.sendMessage(fromId, 'GAME STARTED!.\nJoin the game typing /join in the chat.\nStart playing typing /close.');
    }
});

bot.onText(/\/close/, function(msg) {
    var fromId = msg.chat.id;
    var game = games[fromId];
    if (game.players.length < 2) {
        bot.sendMessage(fromId, 'You need at least 2 players');
    }
    else if (game.join === true) {
        console.log('Game ' + fromId + ' starts with ' + game.players.length + ' players');
        game.join = false;
        //bot.sendMessage(fromId, 'No more players are accepted.');
        game.currentPlayer = game.players[0];
        game.currentPlayerPos = 0;
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
    else if (game.players.length > 6) {
        bot.sendMessage(fromIs, 'There are too many players!');
    }
    else {
        var player = {
            'id': msg.from.id,
            'name': msg.from.username,
            'life': 10,
            'score': 0,
            'energy': 0
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
    if (game.currentPlayer.id !== msg.from.id) {
        bot.sendMessage(fromId, 'It isn\'t your turn', {'reply_to_message_id': msg.message_id});
        return;
    }

    if (game.state !== GameStates.PREROLL) {
        bot.sendMessage(fromId, 'You can\'t roll the dices now', {'reply_to_message_id': msg.message_id});
        return;
    }

    var result = rollDices(6);
    game.dices = result;
    var str = toEmoji(result);
    bot.sendMessage(fromId, 'Result:\n' + str);
    var delay=500; //1 second
    setTimeout(function() {
       changeDices(fromId, game); 
    }, delay);
    //changeDices(fromId, game);
});

bot.onText(/\/stats/, function (msg) {
    var fromId = msg.chat.id;

    if (!gameIsRunning(fromId)) {
        bot.sendMessage(fromId, 'There is no game running on this chat!');
        return;
    }

    var game = games[fromId];
    var result = game.players.filter((player) => player.id === msg.from.id);
    if (result.length != 1) {
        bot.sendMessage(fromId, 'You aren\'t currently playing');
    }
    else {
        var player = result[0];
        var msg = '@' + player.name + ' stats:\n' + createStats(player);
        if (player.id === game.tokyo.id) {
            msg += '\n- You\'re in Tokyo';
        }
        bot.sendMessage(fromId, msg);
    }
});

bot.on('callback_query', function(msg) {
    var fromId = msg.id;
    var game = games[msg.message.chat.id];

    if (game.state === GameStates.DICESELECT && msg.from.id === game.currentPlayer.id) {
        if (msg.data.contains('dice_')) {
            var options = {};
            var the_message = msg.message.text;

            if (msg.data === 'dice_done') {
                var dicesToChange = [];
                game.selected_dices.forEach((value, index) => {
                    if (value)
                        dicesToChange.push(index);
                });
                var newDices = rollDices(dicesToChange.length);
                dicesToChange.forEach((value, index) => {
                    game.dices[value] = newDices[index];
                });

                var emoji = toEmoji(game.dices);
                var delay=500; //1 second
                
                // bot.sendMessage(msg.message.chat.id, 'Final result:\n' + emoji);
                the_message = 'Final result:\n' + emoji;
                
                setTimeout(function() {
                    resolve(game);
                }, delay);
            }
            else {
                var index = parseInt(msg.data.replace('dice_', ''));
                game.selected_dices[index] = !game.selected_dices[index];
                options['inline_keyboard'] = createDiceKeyboard(game);
            }

            bot.editMessageText(the_message, {
                    'message_id': msg.message.message_id,
                    'chat_id': msg.message.chat.id,
                    'reply_markup': options
                });
        }
    }
});

bot.onText(/Yes, I want to leave Tokyo/, function (msg) {
    var fromId = msg.chat.id;

    if (!gameIsRunning(fromId)) {
        bot.sendMessage(fromId, 'There is no game running on this chat!');
        return;
    }

    var game = games[fromId];
    if (game.tokyo.id !== msg.from.id) {
        bot.sendMessage(fromId, 'It isn\'t your turn', {'reply_to_message_id': msg.message_id});
        return;
    }

    if (game.state === GameStates.RESOLVE) {
        game.tokyo = game.currentPlayer;
        bot.sendMessage(game.id, 'The new King of Tokyo is @' + game.tokyo.name);
        endTurn(fromId, game);
    }
});

bot.onText(/No, I don't want to leave Tokyo/, function (msg) {
    var fromId = msg.chat.id;

    if (!gameIsRunning(fromId)) {
        bot.sendMessage(fromId, 'There is no game running on this chat!');
        return;
    }

    var game = games[fromId];
    if (game.tokyo.id !== msg.from.id) {
        bot.sendMessage(fromId, 'It isn\'t your turn', {'reply_to_message_id': msg.message_id});
        return;
    }

    if (game.state === GameStates.RESOLVE) {
        endTurn(fromId, game);
    }
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
    var delay=500; //1 second
    setTimeout(function() {
        bot.sendMessage(chatId, '@' + player.name + ' roll the dice, please', {'reply_markup': keyboard});
    }, delay);
}

function rollDices(amount) {
    var dices = [];
    for (i = 0; i < amount; i++) { 
        dices[i] = Math.floor(Math.random() * 11)%6;
    }
    return dices;
}

function changeDices(chatId, game) {
    game.state = GameStates.DICESELECT;

    var cancelKeyboard = {
        'inline_keyboard': createDiceKeyboard(game)
    };

    if (game.tokyo) {
        bot.sendMessage(chatId, '@' + game.tokyo.name + ' is currently in Tokyo');
    } else {
        bot.sendMessage(chatId, 'No one is in Tokyo');
    }
    bot.sendMessage(chatId, '@' + game.currentPlayer.name + ' do you want to change any dice?', {'reply_markup': cancelKeyboard});

}

function createDiceKeyboard(game) {
    var diceKeyboard = [];
    for (var i = 0; i < game.dices.length; i++) {
        var value = createDiceKey(emojis[game.dices[i]], game.selected_dices[i], ['{', '}']);
        diceKeyboard.push({'text': value, 'callback_data': 'dice_' + i});
    }

    var keyboard = [
        diceKeyboard,
        [
            {
                'text': 'Done',
                'callback_data': 'dice_done'
            }
        ]
    ];

    return keyboard;
}

function toEmoji(dices) {
    var str = '';
    dices.forEach((value, index) => str += emojis[value]);
    return str;
}

function createDiceKey(value, selected, marks) {
    var msg = value;
    if (selected) {
        msg = marks[0] + value + marks[1];
    }

    return msg;
}

function endTurn(chatId, game) {
    bot.sendMessage(chatId, 
        '@' + game.currentPlayer.name + ' stats:\n' + createStats(game.currentPlayer));
    game.dices = [-1, -1, -1, -1, -1, -1];
    game.selected_dices = [false, false, false, false, false, false]
    var todelete = [];
    game.players.forEach((value, index) => {
        if (value.life === 0) {
            todelete.push(index);
            bot.sendMessage(chatId, '@' + value.name + ' is dead')
            if (game.tokyo && value.id === game.tokyo) {
                game.tokyo = game.currentPlayer;
                bot.sendMessage(game.id, 'The new King of Tokyo is @'+game.currentPlayer.name);
            }
        }
    });

    todelete.forEach((value, index) => {
        game.players.splice(value-index, 1);
    });

    if (game.players.length === 1) {
        win(chatId, game.players[0]);
    }
    else if (game.currentPlayer.scores >= 20) {
        win(chatId, game.currentplayer);
    }
    else {
        game.currentPlayer = game.players[++game.currentPlayerPos % game.players.length]

        if (game.tokyo && game.currentPlayer.id === game.tokyo.id) {
            score(chatId, game.currentPlayer, 2);
        }
        beginRollDice(chatId, game.currentPlayer, game);
    } 
}

function resolve(game) {
    game.state = GameStates.RESOLVE;
    var num = [0, 0, 0];
    var move = false;
    var life_taken = 0;
    var old_life = game.currentPlayer.life;
    var old_tokyo = 0;
    if (game.tokyo) {
        old_tokyo = game.tokyo.life;
    }
    var old_energy = game.currentPlayer.energy;
    var old_lifes = game.players.map((value) => value.life);
    var new_score = 0;
    game.dices.forEach((value) => {
        if (value < 3) {
            num[value]++;
        }
        else if (value === dices.ENERGY) {
            game.currentPlayer.energy++;
        }
        else if (value === dices.ATTACK) {
            life_taken++;
            move = !game.tokyo;
            if (!move)
                attack(game);
        }
        else if (value === dices.HEART && game.currentPlayer.life < 10 && (!game.tokyo || game.currentPlayer.id !== game.tokyo.id)) {
            game.currentPlayer.life++;
        }
    });

    if (old_life < game.currentPlayer.life) {
        bot.sendMessage(game.id, '@' + game.currentPlayer.name + '\'s life increased ' + (game.currentPlayer.life - old_life) + ' point(s)');
    }

    num.forEach((value, index) => {
        if (value >= 3) {
            new_score += index + 1 + value - 3;
        }
    });

    var msg = '';

    game.players.filter((value, index) => value.id !== game.currentPlayer.id && value.life < old_lifes[index])
        .forEach((value) => {
            msg += '@' + value.name + ' lost ' + life_taken + ' points of life: ' + value.life + '\n';
        });

    if (msg) {
        bot.sendMessage(game.id, msg);
    }

    if (move) {
        game.tokyo = game.currentPlayer;
        new_score += 1;
        bot.sendMessage(game.id, 'The new King of Tokyo is @'+game.currentPlayer.name);
    }

    if (game.currentPlayer.energy >= 5) {
        new_score += Math.floor(game.currentPlayer.energy / 5)
        game.currentPlayer.energy %= 5;
    }

    score(game.id, game.currentPlayer, new_score);

    if (game.tokyo && game.currentPlayer.id !== game.tokyo.id && old_tokyo > game.tokyo.life && game.tokyo.life > 0) {
        var keyboard = {
            'resize_keyboard': true,
            'one_time_keyboard': true,
            'selective': true,
            'keyboard': [['Yes, I want to leave Tokyo', 'No, I don\'t want to leave Tokyo']]
        };
        
        bot.sendMessage(game.id, '@' + game.tokyo.name + ' do you want to leave tokyo?', {'reply_markup': keyboard});
    } else {
        setTimeout(function () {endTurn(game.id, game);}, 500)
    }
}

function attack(game) {
    if (game.currentPlayer.id === game.tokyo.id) {
        game.players.filter((value) => value.id !== game.currentPlayer.id).forEach((player) => {
            player.life--;
            checkPlayerLife(player)
        });
    }
    else {
        game.tokyo.life--;
        checkPlayerLife(game.tokyo);
    }
}

function checkPlayerLife(player) {
    if (player.life < 0) player.life = 0;
}

function win(chatId, player) {
    bot.sendMessage(chatId, '@' + player.name + ' won!\nScore: ' + player.score);
    delete games[chatId];
}

function score(chatId, player, amount) {
    player.score += amount;
    bot.sendMessage(chatId, 'Player @' + player.name + ' scored ' + amount + ' points.')
}

function createStats(player) {
    return '- ' + emojis[6] + ': ' + player.score
        + '\n- ' + emojis[dices.HEART] + ': ' + player.life 
        + '\n- ' + emojis[dices.ENERGY] + ': ' + player.energy;
}

console.log('Server started!');

// Workaround for heroku
var http = require('http');

function handleRequest(request, response){
    response.end('It Works!! Path Hit: ' + request.url);
}

var PORT = process.env.PORT || 3000;


//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
