# autodocblocker README

Provides an easy to use docblock generator. Mainly tested with javascript and php. Very eary in development.

## Features

Simple docblock builder.
Uses nunjucks (https://mozilla.github.io/nunjucks/) for template handling.
Imports workspace package.json file into template data.
You can import your own set of rules be making a .autodocblocker.js within your workspace folder.

## Requirements

- Visual Studio Code v1.28.2 and above.
- node.js https://nodejs.org/en/download/

## Extension Settings

- By default press Ctrl-D when cursor is line of a variable, class, function.
- You can place your own .autodocblocker.js file within a workspace folder to make your own dockblocks.

## Known Issues

- Extension is coded in Javascript (out of the normal).
- Only tested with Javascript and PHP. Need to make more regex rules for other langauges.
- Doesnt support every type of argument or variable type.

## Future development

This was developed because i wanted something with more custimzation than the other docblocker extensions.
I would love to add autocomplete supported DocBlick tags and better code detection handling but that is out of my scope of programming.

## Release Notes

v1.0.0 - First release.

### 1.0.0

Initial release of autodocblocker.