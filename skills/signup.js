var moment = require('moment-timezone');

module.exports = function(controller) {

  controller.hears(['sign up'],'direct_mention', function(bot, message) {
    const now = moment().tz('America/New_York');
    if(now.hour() > 11 || (now.hour() === 11 && now.minute() > 29)) {
      bot.reply(message, `The lunch sign up is already closed for today as it's after 11:30am, <@${message.user}>. You can always try again tomorrow!`);
    } else {

      const todayFormat = now.format('MM_DD_YYYY');
      controller.storage.channels.get(message.channel, function(err, channel) {

        if (!channel) {
            channel = {id: message.channel, team_id: message.team_id, dates: []}
        };

        const is_today_already_setup = channel.dates.filter(date => date.fullDate === todayFormat).length > 0;

        if(!is_today_already_setup){
            date = {};
            date.fullDate = todayFormat;
            date.month = now.month()+1;
            date.date = now.date();
            date.year = now.year();
            date.eligible_users = [];
            date.matched_users = [];
            channel.dates.push(date);
        }

        const today_index = channel.dates.findIndex(date => {
          if(date.fullDate === todayFormat) {
            return date;
          }
        });

        const is_user_already_eligible = channel.dates[today_index].eligible_users.includes(message.user);

        if(is_user_already_eligible) {
          bot.reply(message, `You're already on the list for today, <@${message.user}>.`);
        } else {
          channel.dates[today_index].eligible_users.push(message.user);

          controller.storage.channels.save(channel, function(err,saved) {
            if(err) {
              bot.reply(message, `Uh oh,  <@${message.user}>. I think my wires got tangled. Could you try that again?`);
            } else {
              bot.reply(message, `You got it, <@${message.user}>! \n You've been added to today's lunch list.`);
            }
          })
        }

      });

    }
  });

  controller.hears(['take me off'],'direct_mention', function(bot, message) {
    const now = moment().tz('America/New_York');

    if(now.hour() > 11 || (now.hour() === 11 && now.minute() > 29)) {
      bot.reply(message, `The lunch sign up is already closed for today as it's after 11:30am, <@${message.user}>. You can always try again tomorrow!`);
    } else {

      controller.storage.channels.get(message.channel, function(err, channel) {
        const todayFormat = now.format('MM_DD_YYYY');
        const is_today_already_setup = channel && channel.dates && channel.dates.filter(date => date.fullDate === todayFormat).length > 0;

        if (!channel || !is_today_already_setup) {
          bot.reply(message, `You're not on the lunch list, <@${message.user}>.`);
        } else {
          const today_index = channel.dates.findIndex(date => {
            if(date.fullDate === todayFormat) {
              return date;
            }
          });

          const is_user_already_eligible = channel.dates[today_index].eligible_users.includes(message.user);

          if(is_user_already_eligible) {
            const user_index = channel.dates[today_index].eligible_users.findIndex(user => {
              if(user === message.user) {
                return user;
              }
            });

            channel.dates[today_index].eligible_users.splice(user_index,1);

            controller.storage.channels.save(channel, function(err,saved) {
              if(err) {
                bot.reply(message, `Uh oh,  <@${message.user}>. I think my wires got tangled. Could you try that again?`);
              } else {
                bot.reply(message, `No worries, <@${message.user}>. I took you off the list for today.`);
              }
            })

          } else {
            bot.reply(message, `You're not on the lunch list, <@${message.user}>.`);
          }
        }
      })
    }
  });

  controller.hears(['list'],'direct_mention', function(bot, message) {
    controller.storage.channels.get(message.channel, function(err, channel) {
      const now = moment().tz('America/New_York');

      if(now.hour() > 11 || (now.hour() === 11 && now.minute() > 29)) {
        return bot.reply(message, `It's after 11:30am, so I'm all done with matches for the day. Ask me again tomorrow morning!`);
      }

      const todayFormat = now.format('MM_DD_YYYY');
      const is_today_already_setup = channel && channel.dates && channel.dates.filter(date => date.fullDate === todayFormat).length > 0;

      if (!channel || !is_today_already_setup) {
        bot.reply(message, `The lunch list is empty for today.`);
      } else {
        const today_index = channel.dates.findIndex(date => {
          if(date.fullDate === todayFormat) {
            return date;
          }
        });

        const is_today_empty = channel.dates[today_index].eligible_users === 0;

        if(is_today_empty) {
          bot.reply(message, `The lunch list is empty for today.`);
        } else {
          const eligible_users = channel.dates[today_index].eligible_users.map(user => `\n <@${user}>`);
          const response_string = `We've got the following people on the list for today: ${eligible_users}`;
          bot.reply(message, response_string);
        }
      }
    })

  })

  controller.on('direct_mention', function(bot, message) {
    bot.reply(message,`Hey <@${message.user}>, I wish I were more chatty... but the only commands I can understand are 'sign up', 'take me off' and 'list'. Maybe give 'em a try?`);
  });

}
