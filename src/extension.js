/**
 * autodocblocker
 * Copyright (C) 2018. Drew Gauderman

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const vscode = require('vscode')
const dateformat = require('dateformat')
const nunjucks = require('nunjucks') //template engine
const fs = require('fs')
const configuration = require('./.autodocblocker')
const namedRegexp = require("named-js-regexp") //vscode doesnt support es2018 regex groups!! WTH!!!!!!!!!!

/**
 * isBoolean
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 * @global
 * @param	{*}  value
 * @return	{boolean}
 */
function isBoolean(value) {
	return typeof value === 'boolean' || value.toLowerCase() == 'false' || value.toLowerCase() == 'true';
}

/**
 * isNumber
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 * @global
 * @param	{*}  value
 * @return	{boolean}
 */
function isNumber(value) {
	return typeof value === 'number' || !isNaN(value);
}

/**
 * isArray
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 * @global
 * @param	{*}  value
 * @return	{boolean}
 */
function isArray(value) {
	if (value == '[') value = [];

	try {
		return Array.isArray(eval(value))
	} catch (error) {
		return false;
	}
}

/**
 * isObject
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Saturday, October 27th, 2018
 * @global
 * @param	{*}	value
 * @return	{boolean}
 */
function isObject(value) {
	if (value == '{' || value == '{}') value = {};

	try {
		return typeof JSON.parse(value) == 'object';
	} catch (error) {
		return typeof value == 'object';
	}
}

/**
 * isObject
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.1	Monday, October 30th, 2018
 * @global
 * @param	{*}	value
 * @return	{boolean}
 */
function isInt(value) {
	return value % 1 === 0;
}

/**
 * get_data_type
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 * @version	v1.0.1	Friday, October 26th, 2018 - Added integer, float, and better string detection.
 * @global
 * @return	{string}
 */
function get_data_type(value, type) {
	if (!value || value == 'null') return type ? type : 'mixed';

	if (isArray(value)) return 'array';
	if (isBoolean(value)) return 'boolean';
	if (isNumber(value)) return isInt(value) ? 'integer' : 'float';
	if (isObject(value)) return 'object';

	//looking for string
	if ((value.slice(-1) == "'" && value.slice(0, 1) == "'") || (value.slice(-1) == '"' && value.slice(0, 1) == '"')) {
		return 'string';
	}

	return (type ? type : 'mixed'); //we dont know, must be a custom data type.
}

/**
 * getData
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 * @version	v1.0.1	Tuesday, October 30th, 2018. Added error catching.
 * @global
 * @return	{object}
 */
function getData(config, text, tempdata = {}, templateStr = '') {
	try {
		for (var element of config) {
			let m

			for (var rege of (Array.isArray(element.regex) ? element.regex : [element.regex])) {
				//console.log('rege', rege)

				while ((m = rege.exec(text.trim())) !== null) {
					// This is necessary to avoid infinite loops with zero-width matches
					if (m.index === rege.lastIndex) {
						rege.lastIndex++
					}

					if (!tempdata[element.name]) {
						tempdata[element.name] = []
					}

					var groups = m.groups();

					tempdata[element.name].push(groups)

					if (!element.template) continue

					for (var line of element.template) {
						var el = tempdata[element.name]

						if (typeof line == 'object') {
							if (!groups[line.against]) continue;
							Object.assign(el[el.length - 1], getData([line], groups[line.against]).data)
						} else if (el.length == 1) {
							templateStr += line + "\n";
						}
					}
				}
			}
		}

		return {
			data: tempdata,
			str: templateStr
		}
	} catch (error) {
		console.log('getData error:', error)
	}
}

/**
 * activate
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 * @version	v1.0.1	Tuesday, October 30th, 2018. Added function return detection. Added error catching.
 */
exports.activate = (context) => {
	//console logging
	console.log('Extension "autodocblocker" is now active.');

	/*
	TODO: make an auto complete

		context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
	        ['php','javascript'],
	        {
	            provideCompletionItems: (document, position) => {
					const line = document.lineAt(position).text;
					const prefix = line.slice(0, position.character);

					console.log('line:', line)
					console.log('prefix:', prefix)

					if (!prefix.includes('@')) return [];

					return []];

	                return;
	            }
	        },
			['@']));
	*/

	// The command has been defined in the package.json file
	context.subscriptions.push(vscode.commands.registerCommand('extension.autodocblocker', async () => {
		try { //error catch everything
			//basic stuff used if no package.json file exists in workspace folders
			let json_package = {
				version: '0.0.1',
				author: {
					name: 'Unknown'
				}
			};

			let workspacePath = '';

			if (vscode.workspace.workspaceFolders) {
				//find package.json file to include into template vars
				for (var folder of vscode.workspace.workspaceFolders) {
					if (fs.existsSync(folder.uri.fsPath + "\\package.json")) {
						json_package = JSON.parse(fs.readFileSync(folder.uri.fsPath + '\\package.json', 'utf8'));

						workspacePath = folder.uri.fsPath
						break
					}
				}

				//find custom .autodocblocker.js file
				for (var folder of vscode.workspace.workspaceFolders) {
					if (fs.existsSync(folder.uri.fsPath + "\\.autodocblocker.js")) {
						try {
							eval(fs.readFileSync(folder.uri.fsPath + '\\.autodocblocker.js', 'utf8'));
						} catch (error) {
							console.log(".autodocblocker.js load ERROR!\n", error)
							vscode.window.showInformationMessage('.autodocblocker.js load ERROR!');
						}
						break
					}
				}
			}

			//startup nunjucks
			const env = nunjucks.configure(workspacePath, {
				autoescape: false
			});
			env.addFilter('get_data_type', function (value, type) {
				//console.log('get_data_type', value)
				return get_data_type(value, type);
			})
			env.addFilter('date_format', function (value, format) {
				//console.log('date_format', value, format)
				return dateformat(value, format)
			})
			env.addFilter('make_length', function (value, length) {
				//console.log('make_length: ', value, length)
				if (!value || !value.length) return value;
				return (length - value.length > 0) ? value + " ".repeat(length - value.length) : value
			})

			const editor = vscode.window.activeTextEditor
			const document = editor.document
			const selection = editor.selection
			const startedOnLine = selection.active.line
			const languageId = document.languageId

			let startLine = startedOnLine;
			let endLine = startLine

			let data = {
				now: new Date(),
				version: json_package.version,
				started_within_block: (document.lineAt(startLine).text.trim()[0] == "*") ? true : false,
				...json_package //apply the json config file
			};

			//set author override
			if (vscode.workspace.getConfiguration('autodocblocker').get('author')) {
				data.author.name = vscode.workspace.getConfiguration('autodocblocker').get('author')
			}

			//console.log('data', data)
			//console.log('Started On lineText:', document.lineAt(startedOnLine).text.trim())

			//check for language configuration
			for (var lang of configuration.languages) {
				if (lang.language.split(';').includes(languageId)) {
					Object.assign(data, lang)
					Object.assign(data, { languageId: languageId })
					break
				}
			}

			//language configuration was never set, so i guess it doesnt exist
			if (!data.languageId) {
				vscode.window.showInformationMessage('autodocblocker: This langauge is not supported: ' + languageId);
				return
			}

			const getLine = function (num) {
				return document.lineAt(num).text
			}

			const escapeRegExp = function (string) {
				return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
			}

			const single_line = data.single_line.trim()
			const block_start = data.block_start.trim()
			const block_end = data.block_end.trim()
			const block_line = data.block_line.trim()

			//const prevLineText = getLine(selection.active.line - 1).trim()

			let commentLineStart = selection.active.line - 1

			while (commentLineStart > 0 && (getLine(commentLineStart).trim().substring(0, single_line.length) == single_line || (block_end.length > 0 && getLine(commentLineStart).trim().substring(0, block_end.length) == block_end) || getLine(commentLineStart).trim().substring(0, block_line.length) == block_line || getLine(commentLineStart).trim().substring(0, block_start.length) == block_start)) {
				commentLineStart--
			}

			let commentLineEnd = commentLineStart + 1

			while (commentLineEnd <= document.lineCount && (getLine(commentLineEnd).trim().substring(0, single_line.length) == single_line || (block_end.length > 0 && getLine(commentLineEnd).trim().substring(0, block_end.length) == block_end) || getLine(commentLineEnd).trim().substring(0, block_line.length) == block_line || getLine(commentLineEnd).trim().substring(0, block_start.length) == block_start)) {
				commentLineEnd++
			}

			const cRange = new vscode.Range(commentLineStart + 1, 0, commentLineEnd, 0)
			//console.log('range', document.getText(cRange))

			const paramData = getData(configuration.params, document.getText(cRange), {}).data
			//console.log('paramData', paramData)

			//saved parsed information
			Object.assign(data, paramData)

			const onLineText = getLine(commentLineEnd)
			const compiled = getData(configuration.checkers, onLineText, data)
			//console.log('compiled:', compiled)

			//try and figure out the return value of a function
			if (compiled.data.functions && compiled.data.functions[0] && !compiled.data.functions[0].returns && data.function_start && data.function_end && data.function_return) {
				let openBrackets = 0
				let nextLine = commentLineEnd

				//start loop to check for end of docblock
				while (openBrackets >= 0 && document.lineCount > nextLine) {
					const line = document.lineAt(nextLine).text;

					if (data.function_start.exec(line)) {
						openBrackets++
					}

					if (openBrackets == 1) {
						//console.log('line', line)

						let matches = data.function_return.exec(line)

						if (matches) {
							//save return info
							Object.assign(compiled.data.functions[0], matches.groups())
							break;
						}
					}

					if (data.function_end.exec(line)) {
						openBrackets--
						if (openBrackets == 0) { break; }
					}

					nextLine++
				}
			}

			const indentSpace = (new RegExp(/^(\s+)/).test(onLineText)) ? RegExp.$1 : '';
			//console.log('indentSpace', indentSpace)

			//save indent spaces
			Object.assign(data, {
				spaces: indentSpace.length
			})
			console.log('data', data)

			//render the new code
			const docblock = env.renderString(compiled.str, compiled.data)
			//console.log('docblock:', docblock)

			//replace or add the docblock
			editor.edit(function (edit) {
				edit.replace(cRange, docblock.trim().replace(/^/gm, indentSpace) + "\n");
			});

			//editor.insertSnippet(new vscode.SnippetString(docblock.trim().replace(/^/gm, indentSpace).replace(/\$/g, '\\\$') + "\n"), new vscode.Position(startLine, 0));
		} catch (error) {
			console.log('autodocblocker ERROR!', error)
			vscode.window.showInformationMessage('autodocblocker ERROR!' + error);
		}
	}));
}


/**
 * deactivate
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 */
exports.deactivate = () => {

};

/*
to package up: vsce package

stuff that may help later:
finds the correct comma:
(?=([^\"\[\]]*\[[^\"\[\]]*\])*[^\"\[\]]*$)(,|$)
$test2, $wtf2=123.345, String test2 = 'test2', $test3, $test4='bla', $test5, $test6, {test:'test2'}, ['test','test'], $test7 = 'bla2 ', $test8 = ['test','test2'], $test9='new Array'


//^(?:(?<scope>\w+)\s)?(:(?<testname>[\w:.]+)?[\s=]+?)?(?:(?<type>function|void)\s?)(?<name>[\w:.]+)?\(\s?(?<args_full>.*)\s+?\)(?:[\s:]+(?<returns>[\w]+))?$

//(?:^|,\s?)(?:(?<type>[\w]+)\s)?(?<name>[$&\w.]+)?\s?(?<seperator>=)\s?(?<value>'[\w.]+'|[\d.]+|[&$\w.]+|{[^{}]*}|'[^']*'|"[^"]*"|\[[^\[\]]*\])?
*/