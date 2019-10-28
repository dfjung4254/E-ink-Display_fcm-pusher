var Alarm = require('./alarmModel');
var User = require('./userModel');
var dbConnect = require('./dbConnect');
var fcm_admin = require('./fcm_pusher');
dbConnect('user_auth');
/* TODO: Author 정근화 */
/*

    Express 서버의 이벤트루프에 영향받지 않고
    따로 이벤트루프를 돌아야 더 정확한 시간 캐치가능.

    1. 초단위로 Interval 을 돌면서 현재 시간 확인
    2. 분이 바뀌었을 때를 캐치
    3. DB에 아직 push 되지 않았고 현재 시간보다 이전의 시간 -5분까지 조회
     - 5분까지만 조회하는 이유는 어떠한 오류에 따라서 DB에 push 완료처리까지 로직이
     - 돌아가지 않았을 때 FCM 을 발송해야 하는 데이터가 갈수록 증가하는 것을 방지.
     - 일정시간(5분)이 지날때 까지 FCM 발송이 되지 않았다면 그냥 버림
    4. 해당되는 DB 리스트 모두 FCM Push 발송
    5. 발송이 완료되었으면 DB 에 push 완료 처리

*/

const dayString = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const initialDate = new Date();
var targetMinute = initialDate.getMinutes() + 1;
var targetHour = initialDate.getHours();

intervalFunc = async () => {

    /* get current time */
    const now = new Date();

    /* get current day */
    const day = now.getDay();
    const curMinute = now.getMinutes();
    const curHours = now.getHours();

    /* catch minute changed */
    if (curMinute == targetMinute && curHours == targetHour) {
        console.log("Minute changed! Check DB to Push! [" + dayString[day] + " / " + curHours + " / " + curMinute + "]");

        /* target minute change */
        targetMinute = (targetMinute + 1) % 60;
        if (targetMinute == 0) {
            targetHour = (targetHour + 1) % 24;
        }

        /* find db and get Token list */
        /* TODO: 각 기기에 해당하는 id의 토큰에 각 메세지를 전송 */
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

    }

}

setInterval(intervalFunc, 1000);