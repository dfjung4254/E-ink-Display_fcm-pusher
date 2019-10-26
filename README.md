# E-ink-Display_fcm-pusher

```

$ docker build -t fcm-pusher:0.1 .
$ docker run -d -e "TZ=Asia/Seoul" --name="fcm" --network="host" -v /etc/localtime:/etc/localtime:ro fcm-pusher:0.1

```