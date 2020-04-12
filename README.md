# MMM-Text-To-Speech

This is a Text-To-Speech module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

## Prerequisites

It uses external [MMM-Sounds](https://github.com/jc21/MMM-Sounds) module to play sound, so you must install it first.

## Using the module

1. Navigate into your MagicMirror's `modules` folder and execute `git clone https://github.com/jc21/MMM-Sounds.git`

2. Sdd the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        {
            module: 'MMM-Text-To-Speech',
            config: {
                // See below for configurable options
            }
        }
    ]
}
```

## Configuration options

| Option           | Description
|----------------- |-----------
| `language`        | *Optional* Speech language. Defaults to `en`.
| `speed`        | *Optional* Speech speed.
| `soundModuleDir`        | *Optional* Name of sound module folder. Defaults to `MMM-Sounds`.
