/**
 * Program description.
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

const namedRegexp = require("named-js-regexp") //vscode doesnt support es2018 regex groups!! WTH!!!!!!!!!!

//author tag group
const author = [
	'{%- for auth in authors %}',
		'{%- if (author.name|trim) == (auth.name|trim) %}',
			'{%- set add_author = false %}',
		'{%- endif %}',
		' * @author	{{ auth.name|trim }}',
	'{%- endfor %}',
	'{%- if add_author == true %}',
	' * @author	{{author.name|trim}}',
	'{%- endif %}',
]

//since tag group
const since = [
	'{%- if since %}',
	' * @since	v{{ since | join("", "version") | trim }}',
	'{%- else %}',
	' * @since	v{{version}}',
	'{%- endif %}',
];

//version tag group
const version = [
	'{%- set major = 1 %}',
	'{%- set minor = 0 %}',
	'{%- set patch = -1 %}',
	'{%- for version in versions %}',
		'{%- set major = version.major %}',
		'{%- set minor = version.minor %}',
		'{%- set patch = version.patch %}',
		' * @version	v{{major}}.{{minor}}.{{patch}}	{{ version.date|trim }}{{ version.description }}',
	'{%- endfor %}',
	'{%- if not started_within_block %}',
		' * @version	v{{major}}.{{minor}}.{{(patch|int)+1}}	{{ now | date_format("dddd, mmmm dS, yyyy") }}.',
	'{%- endif %}'
]

//global tag group
const global = [
	'{%- if spaces == 0 %}',
	' * @global',
	'{%- endif %}',
]

//description tag group
const description = [
	'{%- for description in descriptions %}',
	' * {{ description.text | trim }}',
	'{%- endfor %}',
	' *',
]

//todo tag group
const todo = [
	'{%- for todo in todos %}',
	' * @todo	{{todo.text|trim}}',
	'{%- endfor %}',
]


//stuff to expose
module.exports = {
	//existing params to check for when updating existing docblock
	params: [{
		name: 'versions',
		regex: namedRegexp(/(?:@version)\tv(:<major>[\d]+).(:<minor>[\d]+).(:<patch>[\d]+)\t(:<date>[\w\s,]+)(:<description>.+)?$/gmi)
	}, {
		name: 'authors',
		regex: namedRegexp(/(?:@author)\t(:<name>[\w\s<>@.]+)$/gmi)
	}, {
		name: 'since',
		regex: namedRegexp(/(?:@since)\tv(:<version>[\w.]+)/gm)
	}, {
		name: 'descriptions',
		regex: namedRegexp(/\*\s(:<text>[\\/\$&\->\w\s.:'"\[\]{}\(\)]+)$/gmi)
	}, {
		name: 'todos',
		regex: namedRegexp(/(?:@todo)[\t\s]+(:<text>[\\/\$&\->\w\s.:'"\[\]{}\(\)]+)/gmi)
	}, {
		name: 'returns',
		//v1.0.0: regex: namedRegexp(/(?:@return)[\t\s]+(:<text>[\\/\$&\->\w\s.:'"\[\]{}\(\)]+)/gmi)
		regex: namedRegexp(/(?:@return)[\t\s]?(:<text>.*)/g)
	},{
		name: 'previous_vars',
		regex: namedRegexp(/@var[\s]+(:<type>[\w]+)[\s]+(:<name>[$&.\->\w]+)(?:[\s]+(:<description>[\\/\$&\->\w\s.:'"\[\]{}\(\)]+)$)?/gm)
	},{
		name: 'previous_params',
		regex: namedRegexp(/@param[\s]+(:<type>[\w]+)[\s]+(:<name>[$&.\->\w]+)(?:[\s]+(:<description>[\\/\$&\->\w\s.:'"\[\]{}\(\)]+)$)?/gm)
	}],

	//what to look out for when checking the code, and the template to use to spit back out
	checkers: [{
		name: 'classes',
		regex: namedRegexp(/(?:^|\t|\s)(?:(:<return>return)?\s?new )?class\s?(?:(:<name>\w+)?(?:\((:<args_full>.*)\)))?(?:\s?extends\s(:<extends>\w+))?/gi),
		//v1.0.0: regex: namedRegexp(/(?:^|\t|\s)(?:(?:return )?new )?class[\s]?(:<name>[\w]+)?(?:[\(](:<args_full>[\$\-\>.\s\w,\[\]'"]+)[\)])?(?:\sextends\s(:<extends>[\w]+))?/gi),
		template: [{
				name: 'args',
				against: 'args_full',
				regex: namedRegexp(/(?:^|,[\s]+)(?:(:<type>[\w]+)[\s])?(:<name>[$\->\w]+)?[\s]?(:<seperator>=)?[\s]?(:<value>[$\w]+|[\d.]+|[{][^{}]*[}]|['][^']*[']|["][^"]*["]|[\[][^\[\]]*[\]])?/g)
				///v1.0.0: regex: namedRegexp(/(?:^|,[\s]+)(?:(:<type>[\w]+)[\s])?(:<name>[$\->\w]+)?[\s]?(:<seperator>=)?[\s]?(:<value>[$\w]+|[\d.]+|[{][^{}]*[}]|['][^']*[']|["][^"]*["]|[\[][^\[\]]*[\]])?/g)
			},
			'{%- for class in classes -%}',
				'/**',

				'{%- if descriptions %}',
					...description,
				'{%- else %}',
					' * {{class.name | default("anonymouse class")}}{% if selected_text %}: {{selected_text|trim}}{% endif %}.',
					' *',
				'{%- endif %}',

				'{%- set add_author = true %}',
				...author,
				...since,
				...version,

				'{%- if class.extends %}',
					' * @see		{{class.extends}}',
				'{%- endif %}',

				'{%- for arg in class.args %}',
					' * @param	{{ arg.value | get_data_type | lower }}{% for p in previous_params %}{% if p.description and (p.name|trim) == (arg.name|trim) %}\t{{ p.description }}{% endif %}{% endfor %}',
				'{%- endfor %}',

				...global,
				...todo,

				' */',
			'{%- endfor -%}'
		]
	}, {
		name: 'vars',
		//https://regex101.com/r/9wQynL/1/
		regex: namedRegexp(/(?:^|\t|\s|;)(?:(:<declaration>const|let|var)\s)?(?:(:<scope>public|private|static|protected)\s)?(?:(:<type>[\w]+?)\s)?(:<name>[\$\-\>\w\.]+)[\s]?(:<seperator>[=]+)?[\s]?(:<value>[$\[\]{}\d\w\s\.,'"\/:?]+)?(?:;|,|$)/gi),
		template: [
			'{%- if not functions and not classes and not copyright -%}',
				'{%- for var in vars -%}',
					'/**',

					'{%- if descriptions %}',
						...description,
					'{%- else %}',
						'{%- if selected_text %}',
							' * {{selected_text}}',
							' *',
						'{%- endif %}',
					'{%- endif %}',

					'{%- set add_author = false %}',
					...author,

					'{%- if var.scope %}',
					...since,
					'{%- endif %}',

					'{%- set name = var.name | trim %}',
					'{%- for p in previous_vars %}',
						'{%- if p.description and (p.name|trim) == name %}',
							'{%- set name = name + "\t" + p.description %}',
						'{%- endif %}',
					'{%- endfor %}',

					' * @var		{{ var.value | get_data_type | lower}}	{{name | trim}}',

					'{%- if var.scope %}',
						' * @access	{{var.scope}}',
					'{%- endif %}',

					...global,
					...todo,

					' */',
				'{%- endfor -%}',
			'{%- endif -%}'
		]
	}, {
		name: 'functions',
		regex: namedRegexp(/(?:(:<scope>[\w]+)\s)?(?:(:<type>function)[\s])(:<name>[\w]+)\((:<args_full>.*)\)/gi),
		//v1.0.0: regex: namedRegexp(/(?:(:<scope>[\w]+)\s)?[\s;]?function (:<name>.+)\((:<args_full>.+)?\)/gi),
		template: [{
				name: 'args',
				against: 'args_full',
				regex: namedRegexp("(?:^|,\\s?)(?:(?<name>[$\\w]+)?\\s?(?<seperator>=)\\s?)?(?<value>[&$\\w]+|[\\d.]+|\\{[^{}]*\\}|'[^']*'|\"[^\"]*\"|\\[[^\\[\\]]*\\])?", "g")
				//v1.0.0: regex: namedRegexp(/(?:(:<type>[\w]+)[\s])?(:<name>[$\w->]+)([\s=]+(:<value>[->\w\s.'":\[\]{}]+))?(?:,|$)/g)
			},
			'{%- for function in functions -%}',
				'/**',

				'{%- if descriptions %}',
					...description,
				'{%- else %}',
					' * {{function.name}}{% if selected_text %}: {{selected_text|trim}}{% endif %}',
					' *',
				'{%- endif %}',

				'{%- set add_author = true %}',
				...author,
				...since,
				...version,

				'{%- if function.scope %}',
					' * @access	{{function.scope | trim}}',
				'{%- endif %}',

				...global,

				'{%- set max_type = 0 %}',
				'{%- set max_name = 0 %}',
				'{%- for arg in function.args %}',
					'{%- set length = (arg.value | get_data_type | length) %}',
					'{%- if (length > max_type) %}',
						'{%- set max_type = length %}',
					'{%- endif %}',
					'{%- set length = (arg.name or arg.value) | length %}',
					'{%- if (length > max_name) %}',
						'{%- set max_name = length %}',
					'{%- endif %}',
				'{%- endfor -%}',

				'{%- for arg in function.args %}', //start args
					'{%- set type = (arg.value | get_data_type | make_length(max_type) ) %}',
					'{%- set name = (arg.name or arg.value) | make_length(max_name)  %}',
					'{%- set desc = "" %}',

					'{%- if arg.seperator %}',
						'{%- set desc = "Default: " + arg.value | trim %}',
					'{%- endif %}',

					'{%- for p in previous_params %}',
						'{%- if p.name == (name | trim) %}',
							'{%- set desc = p.description %}',
						'{%- endif %}',
					'{%- endfor %}',

					' * @param	{{ type }}\t{{ name }}\t{{ desc }}',
				'{%- endfor %}', //end args

				'{%- for return in returns %}',
					' * @return	{{return.text|trim}}',
				'{%- endfor %}',

				'{%- if not returns %}',
					'{%- set returns = "void" %}',
					'{%- if function.returns %}',
						'{%- set returns = function.returns | default("mixed") | get_data_type %}',
					'{%- endif %}',
					' * @return	{{ returns }}',
				'{%- endif %}',

				...todo,

				' */',
			'{%- endfor -%}'
		]
	}],
};