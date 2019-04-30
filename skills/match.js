var moment = require('moment-timezone');
var schedule = require('node-schedule-tz');

module.exports = function(controller) {

  var match_job = schedule.scheduleJob('match_job', '0 30 11 * * *', 'America/New_York', function(){
    const now = moment().tz('America/New_York');
    const todayFormat = now.format('MM_DD_YYYY');

    //Get all teams data to loop through
    controller.storage.teams.all(function(err, all_teams_data) {
      all_teams_data.forEach(team => {

        //Spawn a new bot for each team
        const token = team.bot.token;
        controller.spawn({token: token}, function(bot) {

          //Get each active channel that the bot is in for each team
          controller.storage.channels.all(function(err, all_channel_data) {
            all_channel_data.forEach(channel => {

              if(channel.team_id != team.id) return console.log("Team & Channel don't match. Stop here.");

              const is_today_already_setup = channel.dates.filter(date => date.fullDate === todayFormat).length > 0;

              //No one signed up today so there is no object in dates that matches the current date
              if(!is_today_already_setup) {

                bot.say({
                  text: "It's that time again... lunch time! But, oh no. Looks like we don't have anyone who signed up today. I'll skip matching folks for today then.",
                  channel: channel.id
                });

              } else {

                const today_index = channel.dates.findIndex(date => {if(date.fullDate === todayFormat) {return date}});
                const is_today_empty = channel.dates[today_index].eligible_users.length === 0;

                //Someone signed up today and then went off the list, so the date is set up but there are no eligible users
                if(is_today_empty) {

                  bot.say({
                    text: "It's that time again... lunch time! But, oh no. Looks like we don't have anyone who signed up today. I'll skip matching folks for today then.",
                    channel: channel.id
                  })

                } else {

                  bot.say({
                    text: "It's that time again... lunch time! Let's do this thing. Here we gooooooo....! Here's our lunch groups for today:",
                    channel: channel.id
                  })

                  //Wait 2 seconds so that the initial message comes before the lists of people.
                  setTimeout(() => {
                    const only_one_person = channel.dates[today_index].eligible_users.length === 1;

                    //Can't do much with one person so we just let them know that we don't have any matches for them.
                    if(only_one_person) {
                      const the_one_person = channel.dates[today_index].eligible_users[0];

                      bot.say({
                        text: `Hey <@${the_one_person}>, it looks like you're the only one who signed up for lunch today, so I have nobody to pair you with. Let's try this again tomorrow.`,
                        channel: channel.id
                      })
                    } else {

                      //Assign all eligibe users to a new array with a random value for order to arrange them in a random order
                      let { eligible_users } = channel.dates[today_index];
                      const eligible_users_to_order = sortByKey(
                        eligible_users.map(user => {
                          return {
                            id: user, order: Math.random()
                          }
                        }), "order");

                      const even_number = eligible_users_to_order.length % 2 === 0;

                      //If it's not even, it means we'll need to have one group of 3, so we splice 3 off the end.
                      if(!even_number) {
                        const last_three = eligible_users_to_order.splice(-3, 3);
                        let three_group = "";
                        let matched_list = [];
                        last_three.map((user, index) => {
                          three_group = three_group.concat(`<@${user.id}>`);
                          matched_list.push(user.id);
                          if(index == 0) {
                            three_group = three_group.concat(`, `)
                          };
                          if(index == 2) {
                            three_group = three_group.concat(`, and `)
                          };
                        });

                        bot.say({
                          text: three_group,
                          channel: channel.id
                        });

                        channel.dates[today_index].matched_users.push(matched_list);
                        controller.storage.channels.save(channel, function(err,saved) {})
                      }

                      let two_group = "";
                      let matched_list = [];
                      eligible_users_to_order.map((user, index) => {
                        two_group = two_group.concat(`<@${user.id}>`);
                        matched_list.push(user.id);
                        if((index+1) % 2 === 0) {
                          bot.say({
                            text: two_group,
                            channel: channel.id
                          });

                          channel.dates[today_index].matched_users.push(matched_list);
                          controller.storage.channels.save(channel, function(err,saved) {})

                          two_group = "";
                          matched_list = [];
                        } else {
                          two_group = two_group.concat(`, and `);
                        }
                      })

                    }
                  }, 2000)
                }
              }
            })
          })
        });
      })
    })

  });
}

function sortByKey(array, key) {
  return array.sort(function(a, b) {
      var x = a[key]; var y = b[key];
      return ((x > y) ? -1 : ((x < y) ? 1 : 0));
  });
}
