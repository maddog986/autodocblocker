const vscode = require('vscode')
const dateformat = require('dateformat')
const nunjucks = require('nunjucks') //template engine
const fs = require('fs')
const configuration = require('./configuration')


//vsce package

/**
 * isBoolean
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 * @global
 * @param	mixed  value
 * @return	boolean
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
 * @param	mixed  value
 * @return	boolean
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
 * @param	mixed  value
 * @return	boolean
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
 * @param	mixed  value
 * @return	void
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
 * get_data_type
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 * @global
 * @param	mixed  name
 * @param	mixed  value
 * @return	void
 */
function get_data_type(name, value) {
	if (name && name.length > 0) return name; //custom name
	if (!value || value == 'null') return 'mixed';

	if (isArray(value)) return 'array';
	if (isBoolean(value)) return 'boolean';
	if (isNumber(value)) return 'number';
	if (isObject(value)) return 'object';

	return typeof value;
}

/**
 * getData
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 * @global
 * @param	mixed   config
 * @param	mixed   text
 * @param	object  tempdata     	Optional. Default: {}
 * @param	string  templateStr  	Optional. Default: ''
 * @return	object
 */
function getData(config, text, tempdata = {}, templateStr = '') {

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
}

/**
 * activate
 *
 * @author	Drew Gauderman
 * @since	v0.0.1
 * @version	v1.0.0	Friday, October 26th, 2018
 */
exports.activate = (context) => {
	//console logging
	console.log('Extension "docbuilder" is now active.');

	// The command has been defined in the package.json file
	context.subscriptions.push(vscode.commands.registerCommand('extension.docbuilder', async () => {
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

		//find custom .docblocker.js file
		for (var folder of vscode.workspace.workspaceFolders) {
			if (fs.existsSync(folder.uri.fsPath + "\\.docblocker.js")) {
				try {
					eval(fs.readFileSync(folder.uri.fsPath + '\\.docblocker.js', 'utf8'));
				} catch (error) {
					console.log('docblocker.js load ERROR!', error)
					vscode.window.showInformationMessage('docblocker.js load ERROR!');
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

		console.log('sub', editor.document.lineAt(startedOnLine - 1).text.substring(0, 2))

		//check for previous docblock
		if (editor.document.lineAt(startedOnLine - 1).text.trim()[0] == "*") {
			startLine--
		//single line comment
		} else if (editor.document.lineAt(startedOnLine - 1).text.trim().substring(0, 2) == "//") {
			startLine--
			endLine--

			Object.assign(data, {
				descriptions: [
					{text: editor.document.lineAt(startLine).text.trim().substring(2)}
				]
			})
		}

		//start loop to check for beginning of docblock
		while (editor.document.lineAt(startLine).text.trim()[0] == "*") {
			startLine--
		}

		if (editor.document.lineAt(endLine).text.trim().substring(0, 3) == "/**" || editor.document.lineAt(endLine).text.trim().substring(0, 2) == "//")
			endLine++

		//start loop to check for end of docblock
		while (editor.document.lineAt(endLine).text.trim()[0] == "*") {
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

		//const env = new nunjucks.Environment();
		//env.opts.autoescape = false;
		//console.log('workspacePath', workspacePath)

		const env = nunjucks.configure(workspacePath, {
			autoescape: false
		});

		//nunjucks.precompile(workspacePath, { env: env });

		env.addFilter('get_data_type', function (value, format) {
			//console.log('get_data_type', value, format)
			return get_data_type(value, format);
		})
		env.addFilter('date_format', function (value, format) {
			//console.log('date_format', value, format)
			return dateformat(value, format)
		})
		env.addFilter('make_length', function (value, length) {
			//console.log('make_length: ', value, length)
			return (length - value.length > 0) ? value + " ".repeat(length - value.length) : value
		})

		try {
			let compiled = getData(configuration.checkers, lineText, data)
			console.log('compiled.data', compiled.data)
			//console.log('compiled.str', compiled.str)

			//render the new code
			const docblock = env.renderString(compiled.str, compiled.data);
			//console.log('docblock', docblock)

			if (!docblock || docblock == '') return //nothing could be generated

			//remove the old code
			if (docblockRange) {
				editor.edit(function (edit) {
					edit.replace(docblockRange, '');
				});
			}

			editor.insertSnippet(new vscode.SnippetString(docblock.replace(/^/gm, indentSpace).replace(/\$/g,'\\\$') + "\n"), new vscode.Position(startLine, 0));
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
var fileName = '.docbuilder.txt';

var filePath = context.asAbsolutePath(fileName);
console.log('filepath: ' + filePath);

let text = vscode.workspace.openTextDocument(filePath).then((document) => {
	console.log(document.getText());
});

let editorLinePos = new vscode.Position(editorLine, 0);

let lineText = document.lineAt(editorLine).text;

		//vscode.workspace.openTextDocument('./package.json').then((document) => {
		//	return document.getText();
		//});


		//vscode.workspace.openTextDocument(context.asAbsolutePath('./package.json')).then((document) => {
		//	console.log(document);
		//})

function replaceLine(editor, line, oldText, newText) {
	editor.edit(function(edit) {
		edit.replace(new vscode.Range(line, 0, line, oldText.length), newText);
	});
}

// Display a message box to the user
		vscode.window.showInformationMessage('Code inserted.');

code samples
https://github.com/Microsoft/vscode-extension-samples


regex to remove all docblock: (^|\w?)/\*([^*]|[\r\n]|(\
*+([^
*
/]|[\r\n])))*\*+/








(?:(?<type>[\w]+)[\s])?(?<name>[&$\w.\->]+(?:(?<test>\['[\w]+\'])+)?)([\s=]{1,3}(?:(?<value>.['\w.,\}\{]+)))?(?=[,$]?)
$arry['test']['test'], $bla->test, String $test, $bla={'test','bla'}, $bla.test, $test={'test'}, test=123.234

*/