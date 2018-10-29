var selectedText = "	$var = 'rssting';";
var configuration = [{
	name: 'vars',
	regex: /(?<type>[\w]+?)?[\s;]?(?<name>\$[\w\.?]+)[\s]?(?<seperator>[=]+)[\s]?(['"\[]?)(?<value>[\d\w\s\.?]+)?\4;/gi,
	template: [
		'{%- for var in vars %}',
		'/**',
		'{%- if selected_text %}',
		'* {{selected_text}}',
		'{%- endif %}',
		'* @since	v1.0.0	{{date}}',
		'{%- if var.type %}',
		'* @access	{{var.type}}',
		'{%- endif %}',
		'* @var	{{arg.type}}	{{arg.name}}',
		'*/',
		'{%- endfor %}'
	]
}, {
	name: 'functions',
	regex: /(?<type>[\w\s]+?)?[\s;]?function (?<name>[\w\s\.?]+)\((?<args_full>[='",\s\w\.\$?]+)?/gi,
	template: [{
			name: 'args',
			against: 'args_full',
			regex: /[\s]?(?<type>[\w+|^]+\s)?(?<name>.\w+)[\s]?(?<seperator>=)?[\s]?(?:['"\]]?)(?<value>[\w\s\.?]+)?(?:['"\]]?)/gi
		},
		'{%- for function in functions %}',
		'/**',
		'* {{function.name}}{% if selected_text %}: {{selected_text}}{% endif %}',
		'*',
		'* @author	{{author}} <{{email}}>',
		'* @since	v1.0.0',
		'* @version	v1.0.0	{{date}}',
		'{%- if function.type %}',
		'* @access	{{function.type}}',
		'{%- endif %}',
		'{%- for arg in function_args %}',
		'* @param	{{arg.type}}	{{arg.name}}{% if arg.value %}	Optional. Default: {{arg.value}}{% endif %}',
		'{%- endfor %}',
		'*/',
		'{%- endfor %}'
	]
}];

let compiled = getData(configuration, selectedText, {}, '')

let indentSpace = (new RegExp(/^(\s+)/).test(selectedText)) ? RegExp.$1 : ''
let newTemplate = compiled.str.replace(/^/gm, indentSpace)

//console.log('templateData: ', compiled.data)
console.log('indentSpace:', indentSpace)
console.log('templateString:', newTemplate)
//console.log('templateStr:\n', templateStr)

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

			tempdata[element.name].push(m.groups)

			if (!element.template) continue

			for (var line of element.template) {
				var el = tempdata[element.name]

				if (typeof line == 'object') {
					Object.assign(el[el.length - 1], getData([line], m.groups[line.against]).data)
				} else if (el.length == 1) {
					templateStr += line + "\n";
				}
			}
		}
	}

	return {data: tempdata, str: templateStr}
}