# autodocblocker

Simply provides an easy to use docblock generator with mininal amount of effort. Mainly tested with javascript and php. Very eary in development.

## Features

- Simple docblock builder. [What is a Docblock?](https://en.wikipedia.org/wiki/Docblock)
- Uses [nunjucks](https://mozilla.github.io/nunjucks/) for template handling.
- Imports workspace [package.json](https://code.visualstudio.com/docs/extensionAPI/extension-manifest) file into template data.
- You can import your own set of rules be creating a .autodocblocker.js within your root workspace folder.

## Preview:
![Preview}](/preview.png)

### Generating code:
- Press Ctrl-D when line is on a variable, function or class. This will generate the docblock. As a bonous, each time you press Ctrl-D it will add a new @version tag.
- Press Ctrl-D within an already generated DocBlock and it will do any nesscary updates to it (does not auto add @version like above).

Notes:
@version and @author is pulled from a workspace package.json file. If your folder does not have a package.json file, default is "@version 0.0.1" and "@author Unknown"

## Requirements

- Visual Studio Code v1.28.2 and above.
- node.js https://nodejs.org/en/download/

## Extension Settings

- By default press Ctrl-D when cursor is on line of a variable, class, or function.
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