# WhisperMom
## HealthHackGT'21 Whisper Mom !
An app to Help new mom know what's up about their pregnancy in Realtime !

This code is derived from base repository:
[Base project](https://github.com/mappmechanic/whats-up-realtime-status-update)
[View tutorial](https://pusher.com/tutorials/social-network-javascript/)

## Prerequisite Softwares
- NodeJS
- Yarn (Optional)

## Running the Project
In order to run the app on your machines, please follow the below given steps:

1. Run either of the following commands to install dependencies

```
 npm install
```

OR 

```
 yarn
```

2. If you just want to use the app run in command line and open localhost:9000 on web browser
```
yarn start
```
ELSE
3. Signup at [https://pusher.com/signup](https://pusher.com/signup). 

4. Create a new app to obtain the API Key, secret & appId. 

Replace the respective key, secret & appId for pusher initialisation in **server.js** file with your values:

```javascript
    var pusher = new Pusher({
    appId: '<your-app-id>',
    key: '<your-api-key>',
    secret: '<your-app-secret>',
    encrypted: true
    });
```

5. Finally you will have to also replace your app-key in **app.js** file too:

```javascript
 ...
 pusher = new Pusher('<your-api-key>', {
    authEndpoint: '/usersystem/auth',
    encrypted: true
 }),
 ...
```

6. Now we are ready to run our app using the following node commands

```
yarn start
```

7. We will be able to access the app at [http://localhost:9000](http://localhost:9000)

Credits for base code goes to  
[https://twitter.com/mappmechanic](https://twitter.com/mappmechanic)

