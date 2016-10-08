var TelegramBot = require('node-telegram-bot-api');

var token = process.env.bot_key;

var bot = new TelegramBot(token, {polling: true});

bot.onText(/\/echo/, function(msg) {
    var fromId = msg.chat.id;
    bot.sendMessage(fromId, "Hello world!");
});
