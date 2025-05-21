# MMM-Text-To-Speech

Text-To-Speech module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

## Prerequisites

1. It uses external [MMM-Sounds](https://github.com/jc21/MMM-Sounds) module to play sound, so you must install it first.
    - Navigate into your MagicMirror's `modules` folder and execute `git clone https://github.com/jc21/MMM-Sounds.git`
2. If you don't have LAME package on your system, follow the [instructions](https://www.npmjs.com/package/node-lame#install-on-debian) to install it.
3. Needs the node module es6-promise
    - npm install es6-promise

## Using the module

1. Navigate into your MagicMirror's `modules` folder and execute `git clone https://github.com/ChrisB85/MMM-Text-To-Speech.git`
2. Go to MMM-Text-To-Speech directory and run `npm install`
3. Add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        {
            module: 'MMM-Text-To-Speech',
            config: {
                // See below for configurable options
                ...
                mqttServer: {
                ...
                }
            }
        }
    ]
}
```
4. Send notification with text as payload:
```
this.sendNotification("MMM-Text-To-Speech", "Hello " + payload);
```
or 
```
this.sendNotification("MMM-TTS", "Hello " + payload);
```

## Configuration options

| Option           | Description
|----------------- |-----------
| `language`       | *Optional* Speech language. Defaults to `en`.
| `speed`          | *Optional* Speech speed.
| `soundModuleDir` | *Optional* Name of sound module folder. Defaults to `MMM-Sounds`.
| `mqttServer`     | *Optional* MQTT server section:
|                  | `address` Host name or IP address
|                  | `port` Port, defaults to 1883
|                  | `topic` Topic to subscribe to
|                  | `user` *Optional* User name
|                  | `password` *Optional* Password

