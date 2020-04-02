/* global Module */

/* Magic Mirror
 * Module: MMM-TTS
 *
 * By Krzysztof Błachowicz
 * MIT Licensed.
 */

Module.register("MMM-TTS", {
    defaults: {
        language: 'en',
        speed: 1
    },

    requiresVersion: "2.1.0", // Required version of MagicMirror

    start: function () {
        // Flag for check if module is loaded
        this.loaded = false;
    },

    getScripts: function () {
        return [];
    },

    getStyles: function () {
        return [
            "MMM-TTS.css",
        ];
    },

    // Load translations files
    getTranslations: function () {
        return {
            en: "translations/en.json",
            es: "translations/es.json"
        };
    },

    notificationReceived: function (notification, payload, sender) {
        if (notification === 'MMM-TTS') {
            this.sendSocketNotification("MMM-TTS", payload);
        }
    },

    // socketNotificationReceived from helper
    socketNotificationReceived: function (notification, payload) {
        if (notification === "MMM-TTS-PLAY_SOUND") {
            this.sendNotification('PLAY_SOUND', payload);
        }
    },
});
