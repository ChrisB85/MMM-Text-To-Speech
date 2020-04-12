/* global Module */

/* Magic Mirror
 * Module: MMM-Text-To-Speech
 *
 * By Krzysztof Błachowicz
 * MIT Licensed.
 */

Module.register("MMM-Text-To-Speech", {
    defaults: {
        language: "en",
        speed: 1,
        soundModuleDir: "MMM-Sounds",
    },

    requiresVersion: "2.1.0", // Required version of MagicMirror

    start: function () {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("CONFIG", this.config);
    },

    getScripts: function () {
        return [];
    },

    getStyles: function () {
        return ["MMM-Text-To-Speech.css"];
    },

    // Load translations files
    getTranslations: function () {
        return {
            en: "translations/en.json",
            es: "translations/es.json",
        };
    },

    notificationReceived: function (notification, payload, sender) {
        if (
            notification === "MMM-Text-To-Speech" ||
            notification === "MMM-TTS"
        ) {
            this.sendSocketNotification("MMM-Text-To-Speech", payload);
        }
    },

    // socketNotificationReceived from helper
    socketNotificationReceived: function (notification, payload) {
        if (notification === "MMM-Text-To-Speech-PLAY_SOUND") {
            this.sendNotification("PLAY_SOUND", payload);
        }
    },
});
