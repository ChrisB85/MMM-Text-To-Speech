/**
 * Magic Mirror
 * Node Helper: MMM-Text-To-Speech
 *
 * By Krzysztof Błachowicz
 * MIT Licensed.
 */

require("es6-promise").polyfill();

var NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const urlParse = require("url").parse;
const googleTTS = require("google-tts-api");
const md5 = require("md5");
const mqtt = require('mqtt');

module.exports = NodeHelper.create({
    isLoaded: false,
    config: null,

    /**
     * Downloads file and saves it at given location
     * @param {String} url File URL to download
     * @param {String} dest Local file path
     */
    downloadFile: function (url, dest) {
        return new Promise(function (resolve, reject) {
            var info = urlParse(url);
            var httpClient = info.protocol === "https:" ? https : http;
            var options = {
                host: info.host,
                path: info.path,
                headers: {
                    "user-agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
                },
            };
            httpClient
                .get(options, function (res) {
                    // check status code
                    if (res.statusCode !== 200) {
                        reject(
                            new Error(
                                "request to " +
                                url +
                                " failed, status code = " +
                                res.statusCode +
                                " (" +
                                res.statusMessage +
                                ")"
                            )
                        );
                        return;
                    }

                    var file = fs.createWriteStream(dest);
                    file.on("finish", function () {
                        // close() is async, call resolve after close completes.
                        file.close(resolve);
                    });
                    file.on("error", function (err) {
                        // Delete the file async. (But we don't check the result)
                        fs.unlink(dest);
                        reject(err);
                    });
                    res.pipe(file);
                })
                .on("error", function (err) {
                    reject(err);
                })
                .end();
        });
    },

    /**
     * Converts text to WAV file
     * @param {String} text Text to say
     * @param {Number} delay Delay in ms
     * @param {Boolean} cache 
     */
    tts: function (text, delay = 0, cache = true) {
        console.log(this.name + ': Downloading MP3 file for text: ', text);
        var self = this;
        var fileName = md5(text);
        var destDir = path.resolve(
            __dirname,
            "../" + self.config.soundModuleDir + "/sounds/tts/"
        );
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        var destFile = path.resolve(destDir, fileName + ".mp3"); // MP3 file
        var outFile = path.resolve(destDir, fileName + ".wav"); // WAV file
        if (fs.existsSync(outFile)) {
            if (fs.existsSync(destFile)) {
                // Delete MP3 file
                fs.unlinkSync(destFile);
            }
            self.sendSocketNotification(
                "MMM-Text-To-Speech-PLAY_SOUND",
                {
                    sound: "tts/" + fileName + ".wav",
                    delay: delay,
                    cache: cache
                }
            );
            return;
        }

        var url = googleTTS.getAudioUrl(text, {
            lang: self.config.language,
            slow: false,
            host: 'https://translate.google.com',
        });

        self.downloadFile(url, destFile)
            .then(() => {
                console.log(this.name + ": Download success! File saved as " + destFile);
                // Mp3 to WAV
                const Lame = require("node-lame").Lame;
                const decoder = new Lame({
                    output: outFile,
                }).setFile(destFile);
                decoder
                    .decode()
                    .then(function () {
                        // Delete MP3 file
                        fs.unlinkSync(destFile);
                        // Play WAV file
                        self.sendSocketNotification(
                            "MMM-Text-To-Speech-PLAY_SOUND",
                            {
                                sound: "tts/" + fileName + ".wav",
                                delay: delay,
                                cache: cache
                            }
                        );
                    })
                    .catch((error) => {
                        // Something went wrong
                        console.log(error);
                    });
            })
            .catch(function (err) {
                console.error(err.stack);
            });
    },

    // Override socketNotificationReceived method.
    socketNotificationReceived: function (notification, payload) {
        switch (notification) {
            case "CONFIG":
                if (!this.isLoaded) {
                    this.config = payload;
                    this.isLoaded = true;
                    if ('mqttServer' in this.config) {
                        this.addServer(this.config.mqttServer);
                    }
                }
                break;
            case "MMM-Text-To-Speech":
                this.tts(payload);
                break;
            default:
                break;
        }
    },

    makeServerKey: function (server) {
        return '' + server.address + ':' + (server.port | '1883' + server.user);
    },

    addServer: function (server) {
        if (server.address == undefined) {
            console.log(this.name + ': No MQTT server defined');
            return false;
        }
        console.log(this.name + ': Adding server: ', server.address);
        var serverKey = this.makeServerKey(server);
        var mqttServer = {}
        mqttServer.serverKey = serverKey;
        mqttServer.address = server.address;
        mqttServer.port = server.port;
        mqttServer.options = {};
        mqttServer.topics = [];
        if (server.user) mqttServer.options.username = server.user;
        if (server.password) mqttServer.options.password = server.password;

        mqttServer.topics.push(server.topic);
        this.startClient(mqttServer);
    },

    startClient: function (server) {

        console.log(this.name + ': Starting client for: ', server.address);

        var self = this;

        var mqttServer = (server.address.match(/^mqtts?:\/\//) ? '' : 'mqtt://') + server.address;
        if (server.port) {
            mqttServer = mqttServer + ':' + server.port
        }
        console.log(self.name + ': Connecting to ' + mqttServer);

        server.client = mqtt.connect(mqttServer, server.options);

        server.client.on('error', (err) => {
            console.log(self.name + ' ' + server.serverKey + ': Error: ' + err);
        });

        server.client.on('reconnect', (err) => {
            server.value = 'Reconnecting'; // Hmmm...
            console.log(self.name + ': ' + server.serverKey + ' reconnecting');
        });

        server.client.on('connect', (connack) => {
            console.log(self.name + ' Connected to ' + mqttServer);
            console.log(self.name + ': Subscribing to topic ' + server.topics);
            server.client.subscribe(server.topics);
        });

        server.client.on('message', (topic, payload) => {
            console.log(self.name + ' Recieved payload from topic ' + topic + ': ' + payload.toString());
            try {
                let object = JSON.parse(payload);
                let text = object.text ? object.text : "";
                let delay = object.delay ? object.delay : 0;
                let cache = object.cache ? object.cache : true;
                this.tts(text, delay, cache);
            } catch (e) {
                this.tts(payload.toString());
            }
        });

    }
});
