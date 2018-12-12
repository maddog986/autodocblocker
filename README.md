# autodocblocker

![Preview}](https://raw.githubusercontent.com/maddog986/autodocblocker/alpha/images/preview.gif)

Tired of typing all that [Docblock](https://en.wikipedia.org/wiki/Docblock) data all the time? This provides a simple & quick semi-auto generated docblock based on the line of code. This plugin does its best to figure out whats going on and make a detailed docblock.

There are tons of other docblock plugins out there but I could not find any that suited my needs. This provides a qucik and easy system to auto generate a docblock for common languages I use every day. The best part is you can customize it to your needs using templates (keep reading below). If your langauge is not supported, request it and I will do my best to support it.

Install at [Visuak Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=maddog986.autodocblocker) or download the .vsix file and [install manually](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix).

## Features

- Simple semi-auto docblock builder that fills in author, version, params, vars, function names/args/returns, class names, and more.
- Create your own set of rules by creating a .autodocblocker.js within your root workspace folder. Just copy the .autodocblocker.js file and make your changes. No need to restart the plugin or vscode.
- Uses [nunjucks](https://mozilla.github.io/nunjucks/) templating for the docblock output.
- Imports workspace [package.json](https://code.visualstudio.com/docs/extensionAPI/extension-manifest) file into template data for author, version, and whatever else information you want to include within the docblock.
- Supported Languages (more coming at request): al, c, cpp, csharp, dart, flax, fsharp, go, haxe, ino, java, javascript, javascriptreact, typescript, typescriptreact, jsonc, kotlin, less, lua, pascal, objectpascal, php, rust, scala, scss, stylus, swift, verilog, vue.

### Generating code:
- Press Ctrl-D when line is on a variable, function or class. This will generate the docblock. As a bonous, each time you press Ctrl-D it will add a new @version tag.
- Press Ctrl-D within an already generated DocBlock and it will do any nesscary updates to it (does not auto add @version like above).

Notes:
- @version and @author is pulled from a workspace package.json file. If your folder does not have a package.json file, default is "@version 0.0.1" and "@author Unknown"

## Requirements

- Visual Studio Code v1.28.2 and above.

## Extension Settings

- By default press Ctrl-D when cursor is on line of a variable, class, or function. You may want to customize this as other default settings use Ctrl-D.
- You can place your own .autodocblocker.js file within a workspace folder to make your own dockblocks.

## Release Notes

[See Changelog](https://github.com/maddog986/autodocblocker/blob/alpha/CHANGELOG.md)