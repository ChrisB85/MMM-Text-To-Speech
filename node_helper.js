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
    isLoaded: false,
    config: null,

    downloadFile: function (url, dest) {
        return new Promise(function (resolve, reject) {
            var info = urlParse(url);
            var httpClient = info.protocol === 'https:' ? https : http;
            var options = {
                host: info.host,
                path: info.path,
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36'
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
        var self = this;
        var fileName = md5(text);
        var destDir = path.resolve(__dirname, '../' + self.config.soundModuleDir + '/sounds/tts/');
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        var outFile = path.resolve(destDir, fileName + '.wav');
        if (fs.existsSync(outFile)) {
            self.sendSocketNotification('MMM-TTS-PLAY_SOUND', 'tts/' + fileName + '.wav');
            return;
        }
        var destFile = path.resolve(destDir, fileName + '.mp3'); // file destination
        googleTTS(text, self.config.language, self.config.speed)
                .then(function (url) {
                    console.log(url); // https://translate.google.com/translate_tts?...
                    console.log('Download to ' + destFile + ' ...');
                    return self.downloadFile(url, destFile);
                })
                .then(() => {
                    console.log('Download success');
                    // Mp3 to WAV
                    const Lame = require("node-lame").Lame;
                    const decoder = new Lame({
                        output: outFile
                    }).setFile(destFile);
                    decoder.decode()
                            .then(function () {
                                // Play file
                                self.sendSocketNotification('MMM-TTS-PLAY_SOUND', 'tts/' + fileName + '.wav');
                            })
                            .catch(error => {
                                // Something went wrong
                                console.log(error);
                            });
                    ;
                })
                .catch(function (err) {
                    console.error(err.stack);
                });
    },

    // Override socketNotificationReceived method.
    socketNotificationReceived: function (notification, payload) {
        switch (notification) {
            case 'CONFIG':
                if (!this.isLoaded) {
                    this.config = payload;
                    this.isLoaded = true;
                }
                break;
            case 'MMM-TTS':
                this.tts(payload);
                break;
            default:
                break;
        }
    }
});
