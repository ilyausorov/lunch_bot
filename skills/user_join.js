module.exports = function(controller) {

    controller.on('user_channel_join,user_group_join', function(bot, message) {
        bot.reply(message, 'Welcome, <@' + message.user + '>!');
        bot.reply(message, `In this channel, you can type '@lunchbot sign up' every day by 11:30am to be randomly matched up for lunch with someone else.`);
        bot.reply(message, `In case you can't make lunch anymore and it's still before 11:30am, you can type '@lunchbot take me off' to get off the list. Otherwise, contact the person you're matched with directly to let them know.`);
        bot.reply(message, `You can also type '@lunchbot list' to see who's already signed up to be matched for lunch today.`);
    });

}
