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
	if (!value || value == 'null') return 'mixed';

	if (isArray(value)) return 'array';
	if (isBoolean(value)) return 'boolean';
	if (isNumber(value)) return isInt(value) ? 'integer' : 'float';
	if (isObject(value)) return 'object';

	//looking for string
	if ((value.slice(-1) == "'" && value.slice(0, 1) == "'") || (value.slice(-1) == '"' && value.slice(0, 1) == '"')) {
		return 'string';
	}

	return (type) ? type : 'mixed'; //we dont know, must be a custom data type.
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

			while ((m = element.regex.exec(text)) !== null) {
				// This is necessary to avoid infinite loops with zero-width matches
				if (m.index === element.regex.lastIndex) {
					element.regex.lastIndex++
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

			const editor = vscode.window.activeTextEditor
			const selection = editor.selection
			const startedOnLine = selection.active.line

			let startLine = startedOnLine;
			let endLine = startLine

			let data = {
				now: new Date(),
				version: json_package.version,
				started_within_block: (editor.document.lineAt(startLine).text.trim()[0] == "*") ? true : false,
				...json_package //apply the json config file
			};
			//console.log('data', data)

			//console.log('Started On lineText:', editor.document.lineAt(startedOnLine).text.trim())

			//check for previous docblock
			if (editor.document.lineAt(startedOnLine - 1).text.trim()[0] == "*") {
				//console.log('started in middle of comment block')

				startLine--
				//single line comment
			} else if (editor.document.lineAt(startedOnLine - 1).text.trim().substring(0, 2) == "//") {
				//console.log('started on comment line')

				startLine--
				endLine--

				Object.assign(data, {
					descriptions: [{
						text: editor.document.lineAt(startLine).text.trim().substring(2)
					}]
				})
			}

			//if starting on the first line, add to end line
			if (editor.document.lineAt(endLine).text.trim().substring(0, 3) == "/**" || editor.document.lineAt(endLine).text.trim().substring(0, 2) == "//")
				endLine++

			//start loop to check for beginning of docblock
			while (editor.document.lineAt(startLine).text.trim()[0] == "*") {
				//console.log('searching for beginning of comment block')
				startLine--
			}

			//start loop to check for end of docblock
			while (editor.document.lineAt(endLine).text.trim()[0] == "*") {
				//console.log('searching for ending of comment block')
				endLine++
			}

			if (startedOnLine != startLine) {
				var docblockRange = new vscode.Range(startLine, 0, endLine, 0);
				//console.log('docblockRange Text', editor.document.getText(docblockRange))

				//saved parsed information
				Object.assign(data, getData(configuration.params, editor.document.getText(docblockRange), {}).data)
				//console.log('block data', data)
			}

			//console.log('startLine finished', editor.document.lineAt(startLine).text)
			//console.log('endline finished', editor.document.lineAt(endLine).text)

			const lineText = editor.document.lineAt(endLine).text;
			//console.log('lineText', lineText)

			const indentSpace = (new RegExp(/^(\s+)/).test(lineText)) ? RegExp.$1 : '';
			//console.log('indentSpace', indentSpace)

			//save indent spaces
			Object.assign(data, {
				spaces: indentSpace.length
			})

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

			let compiled = getData(configuration.checkers, lineText, data)

			console.log('compiled.data before function', compiled.data)
			//console.log('compiled.str', compiled.str)

			//i feel like this is hacky, but it works
			if (compiled.data.functions && compiled.data.functions[0] && !compiled.data.functions[0].returns) {
				let openBrackets = 0;
				let checkLine = startLine;

				//start loop to check for end of docblock
				while (true) {
					if (!editor.document.lineAt(checkLine)) {
						console.log("EOF?")
						break;
					}

					const line = editor.document.lineAt(checkLine).text;

					console.log('line', line)

					if (line.includes("{")) {
						openBrackets++
					}

					if (openBrackets == 1 && line.includes("return")) {
						const returnStr = namedRegexp(/[\s]?(?:return\s)(:<returns>([^;]*))/g).exec(line);
						console.log('returnStr', returnStr)

						if (!returnStr) break; //found return, but it was blank

						//save return info
						Object.assign(compiled.data.functions[0], {
							returns_loop: returnStr.group('returns')
						})

						break;
					}

					if (line.includes("}")) {
						openBrackets--
						if (openBrackets <= 0) break; //out of the function now
					}

					checkLine++
				}
				//console.log('returns:', getData(configuration.checkers, test, {}))
			}

			console.log('compiled.data', compiled.data)

			//render the new code
			const docblock = env.renderString(compiled.str, compiled.data);
			//console.log('docblock', docblock)

			if (!docblock || docblock == '') {
				//console.log('docblock empty, exited. compiled data:', compiled)
				return //nothing could be generated
			}

			//remove the old code
			if (docblockRange) {
				editor.edit(function (edit) {
					edit.replace(docblockRange, '');
				});
			}

			editor.insertSnippet(new vscode.SnippetString(docblock.replace(/^/gm, indentSpace).replace(/\$/g, '\\\$') + "\n"), new vscode.Position(startLine, 0));
		} catch (error) {
			console.log('docblocker ERROR!', error)
			vscode.window.showInformationMessage('docblocker ERROR!' + error);
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
*/