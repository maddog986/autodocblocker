# Change Log
All notable changes to the "autodocblocker" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1]
- Added addtional language support.
- BREAKING CHANGE: Changed autodocblock.js formats and added languages table. If you have a custom autodocblock.js you will need to update!
	- You can now specify different formatting options for individual langauges.
	- Changed regex and templates for params a little to support addtional language types.
	- You can not change the return type regex to customize the function return check.
	- Renamed field 'scope' to 'modifier'.
- Fixed a bug when starting with first or last line of the document.
- Fixed only grabbing one line comment when building a new docblock.
- autodocblocker.author setting now sets the author user. Overrides the package.json author.
- Bunch of other stuff (forgot to make notes, sorry).

## [1.1.1]
- Added a rudimentary function @return detection. Tested with php and javascript.

### Added
- Added some extra error catching that will be improved in later versions.
- Added "integer" and "float" types detection.
- Added @return checks for functions.
- Added support for description in the @version tag.

### Changed
- Changed get_data_type call. This is a breaking change if you made your own .autodocblocker.js.
- Changed .autodocblocker.js and improved a few regexp things around for functions and classes.
	- Detects arguments better within class and functions.
	- Spacing is a little bit better for params.
	- Breaking change with the way names and values are parsed and stored in data table.
- Changed vscode engine to latest 1.28.2

## [1.0.0]
- Initial release