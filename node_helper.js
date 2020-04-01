/* Magic Mirror
 * Node Helper: MMM-TTS
 *
 * By Krzysztof Błachowicz
 * MIT Licensed.
 */

require('es6-promise').polyfill();

var NodeHelper = require("node_helper");
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var urlParse = require('url').parse;
var googleTTS = require('google-tts-api');
var md5 = require('md5');

module.exports = NodeHelper.create({

    downloadFile: function (url, dest) {
        return new Promise(function (resolve, reject) {
            var info = urlParse(url);
            var httpClient = info.protocol === 'https:' ? https : http;
            var options = {
                host: info.host,
                path: info.path,
                headers: {
                    'user-agent': 'WHAT_EVER'
                }
            };
            httpClient.get(options, function (res) {
                // check status code
                if (res.statusCode !== 200) {
                    reject(new Error('request to ' + url + ' failed, status code = ' + res.statusCode + ' (' + res.statusMessage + ')'));
                    return;
                }

                var file = fs.createWriteStream(dest);
                file.on('finish', function () {
                    // close() is async, call resolve after close completes.
                    file.close(resolve);
                });
                file.on('error', function (err) {
                    // Delete the file async. (But we don't check the result)
                    fs.unlink(dest);
                    reject(err);
                });
                res.pipe(file);
            })
                    .on('error', function (err) {
                        reject(err);
                    })
                    .end();
        });
    },

    tts: function (text) {
        googleTTS(text)
                .then(function (url) {
                    console.log(url); // https://translate.google.com/translate_tts?...
                    var fileName = md5(text);
                    var destDir = path.resolve(__dirname, '../MMM-Sounds/sounds/tts/');
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir);
                    }
                    var destFile = path.resolve(__dirname, fileName + '.mp3'); // file destination
                    var outFile = path.resolve(destDir, fileName + '.wav');
                    console.log('Download to ' + destFile + ' ...');

                    const Lame = require("node-lame").Lame;
                    const decoder = new Lame({
                        output: outFile
                    }).setFile(destFile);

                    decoder
                            .decode()
                            .then(() => {
                                // Decoding finished
                                fs.unlink(destFile);
                                this.sendNotification('PLAY_SOUND', fileName + '.wav');
                            })
                            .catch(error => {
                                // Something went wrong
                            });

                    return downloadFile(url, destFile);
                })
                .then(function () {
                    console.log('Download success');
                })
                .catch(function (err) {
                    console.error(err.stack);
                });

    },

    // Override socketNotificationReceived method.

    /* socketNotificationReceived(notification, payload)
     * This method is called when a socket notification arrives.
     *
     * argument notification string - The identifier of the noitication.
     * argument payload mixed - The payload of the notification.
     */
    socketNotificationReceived: function (notification, payload) {
        if (notification === "MMM-TTS") {
            console.log("Working notification system. Notification:", notification, "payload: ", payload);
            // Send notification
            this.tts(payload);
        }
    },

    // Example function send notification test
    sendNotificationTest: function (payload) {
//        this.sendSocketNotification("MMM-TTS", payload);
    },

    // this you can create extra routes for your module
    extraRoutes: function () {
        var self = this;
        this.expressApp.get("/MMM-TTS/extra_route", function (req, res) {
            // call another function
            values = self.anotherFunction();
            res.send(values);
        });
    },

    // Test another function
    anotherFunction: function () {
        return {date: new Date()};
    }
});
