# E-ink-Display_fcm-pusher

```

# auto build in docker hub
$ git push -u origin master
$ docker run -d -e "TZ=Asia/Seoul" --name="fcm" --network="host" ${MY_IMAGE_ID}

```