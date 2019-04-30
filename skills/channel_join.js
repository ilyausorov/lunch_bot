var debug = require('debug')('botkit:channel_join');

module.exports = function(controller) {
    controller.on('bot_channel_join', function(bot, message) {
        bot.reply(message,`I have arrived! I will help you meet new people over lunch. Can't wait to see the fun we'll all have. \n By the way, I'm going to assume we're on the New York / Eastern Time Zone for now.`);
    });
}
