module.exports = () => {

    const exec = require('child_process').exec;
    const fcmPusher = exec('node ./index.js');

    fcmPusher.stdout.on('data', (data) => {
        console.log(data);
    });
    fcmPusher.stderr.on('data', (data) => {
        console.log(data);
    })

}