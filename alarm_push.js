var fcm_admin = require('./fcm_pusher_admin');
var Alarm = require('./alarmModel');
var User = require('./userModel');

module.exports = async (curHours, curMinute, day) => {

    /* find db and get Token list */
    var query = {
        isAlarmOn: true,
        hour: curHours,
        minute: curMinute
    };
    var day_selected_query = "day_selected." + day;
    query[day_selected_query] = true;

    var pushAlarmList = await Alarm.find(query)
        .catch(err => {
            console.log(err);
        });

    console.log('pushAlarmList : ' + JSON.stringify(pushAlarmList));

    var pushInfo = new Object();
    var userIdArray = new Array();
    for (var alarm of pushAlarmList) {
        console.log('alarm : ' + JSON.stringify(alarm));
        pushInfo[alarm.userId] = {
            userId: alarm.userId,
            title: alarm.title,
            hour: alarm.hour,
            minute: alarm.minute
        }
        userIdArray.push(alarm.userId);
    }

    console.log('pushInfo(noToken) : ' + JSON.stringify(pushInfo));

    var pushUserList = await User.find({
        userId: userIdArray
    }).catch(err => {
        console.log(err);
    })

    for (var user of pushUserList) {
        pushInfo[user.userId].token = user.fcm_token;
    }

    /* fcm push */
    console.log('pushInfo : ' + JSON.stringify(pushInfo));
    for (var uid of userIdArray) {
        var pushObj = pushInfo[uid];
        var message = {
            data: {
                type: 'alarm',
                title: pushObj.title,
                hour: pushObj.hour,
                minute: pushObj.minute
            },
            token: pushObj.token
        };

        /* Error Catch 해야 함 - token 이 없을 수도 있음. */
        console.log('message : ' + JSON.stringify(message));
        var response = await fcm_admin.messaging()
            .send(message)
            .catch(err => {
                console.log('Error sending message:', error);
            });

        console.log('Successfully sent message:', response);

    }

};