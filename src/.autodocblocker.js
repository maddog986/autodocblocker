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

const namedRegexp = require("named-js-regexp") //vscode doesnt support es2018 regex groups!! WTH!!!!!!!!!!

//author tag group
const author = [
	'{%- for auth in authors %}',
	'{%- if (author.name|trim) == (auth.name|trim) %}',
	'{%- set add_author = false %}',
	'{%- endif %}',
	'{{block_line}} @author	{{ auth.name|trim }}',
	'{%- endfor %}',
	'{%- if add_author == true %}',
	'{{block_line}} @author	{{author.name|trim}}',
	'{%- endif %}',
]

//since tag group
const since = [
	'{%- if since %}',
	'{{block_line}} @since	v{{ since | join("", "version") | trim }}',
	'{%- else %}',
	'{{block_line}} @since	v{{version}}',
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
	'{{block_line}} @version	v{{major}}.{{minor}}.{{patch}}	{{ version.date|trim }}.\t{{ version.description | default("") | trim }}',
	'{%- endfor %}',
	'{%- if not started_within_block %}',
	'{{block_line}} @version	v{{major}}.{{minor}}.{{(patch|int)+1}}	{{ now | date_format("dddd, mmmm dS, yyyy") }}.',
	'{%- endif %}'
]

//global tag group
const global = [
	'{%- if spaces == 0 %}',
	'{{block_line}} @global',
	'{%- endif %}',
]

//description tag group
const description = [
	'{%- for description in descriptions %}',
	'{{block_line}} {{ description.text | trim }}',
	'{%- endfor %}',
	'{{block_line}}'
]

const todo = [
	'{%- for todo in todos %}',
	'{{block_line}} @todo	{{todo.text|trim}}',
	'{%- endfor %}',
]

//https://regex101.com/r/m6NqCf/13
const reg_vars_args = namedRegexp(/(?!$)(?:(:<declaration>const|let|var|local|static|protected|private|return)\s)?(?:(:<type>[\w*]+|[\w]+[.]{3})\s)?(:<name>[^{\[\(\s'"][$&.\w\-\>\(\)\['"\]]+)?(:<seperator>\s=\s)?(:<value>[\d.]+|\[[^\[\]]*(?:\]|$)|{[^{}]*(?:}|$)|'[^']*(?:'|$)|"[^"]*(?:"|$)|[&$\w][\w \t.{}()='"\[\],;:]+)?(?:,\s?|;\n?|$)/gi)

//https://regex101.com/r/o1qngQ/8
const reg_functions = namedRegexp(/^([\s]+)?(?:(:<modifier>(?:local|protected|private|public|const|static|\s)+)\s)?(?:(:<function>[$\w.:*]+)\s)(?:(:<name>[$\w.:]+))\((:<args_full>.*)\)/gi)

//https://regex101.com/r/AdapjC/2
const reg_assign_functions = namedRegexp(/^([\s]+)?(?:(:<name>[$\w.:]+))\s?(:<seperator>=)\s?(?:(:<function>[$\w.:*]+))\((:<args_full>.*)\)/gi)

//https://regex101.com/r/bcrDWk/1
const reg_classes = namedRegexp(/(?:^|\t|\s)(?:(:<return>return)?\s?new )?class\s?(?:(:<name>[\w:.]+)?(?:\((:<args_full>.*)\))?)?(?:\s?extends\s(:<extends>\w+))?(?:\s?implements\s(:<implements>\w+))?/gi)

//stuff to expose
module.exports = {
	languages: [
		{
			language: "al;c;cpp;csharp;dart;flax;fsharp;go;haxe;java;javascript;javascriptreact;typescript;typescriptreact;jsonc;kotlin;less;pascal;objectpascal;php;rust;scala;scss;stylus;swift;verilog;vue",
			block_start: '/**', //start of comment block
			block_line: ' *', //line of commment block
			block_end: ' */', //end of comment block
			single_line: '//', //single line of comments
			function_start: /{/, //start of function check
			function_end: /}/, //end of function check
			function_return: namedRegexp(/\s?(?:return\s)(:<returns>[$&\w.\->'"(){}\[\]]+)/gi) //regex to get return info
		}, { //sorta based on https://stevedonovan.github.io/ldoc/manual/doc.md.html
			language: "lua",
			block_start: '------------', //start of comment block
			block_line: '--', //line of commment block
			block_end: '', //end of comment block
			single_line: '--', //single line of comments
			function_start: /(\bfunction|\bthen)/gi, //start of function check
			function_end: /\bend/gi, //end of function check
			function_return: namedRegexp(/\s?(?:return\s)(:<returns>[$&\w.\->'"(){}\[\]]+)/gi) //regex to get return info
		}
	],

	//existing params to check for when updating existing docblock
	params: [
		{
			name: 'versions',
			regex: namedRegexp(/@version\s+v(:<major>\d+)\.(:<minor>\d+)\.(:<patch>\d+)\s+(:<date>[\w\s,]+)\.(:<description>.+)?$/gmi)
		}, {
			name: 'authors',
			regex: namedRegexp(/@author\s+(:<name>.*)$/gmi)
		}, {
			name: 'since',
			regex: namedRegexp(/@since\s+v(:<version>[\w.]+)/gm)
		}, {
			name: 'descriptions',
			regex: namedRegexp(/^[/*\-#\s]+(:<text>[^@/\n\-#*\s].*)$/gmi)
		}, {
			name: 'todos',
			regex: namedRegexp(/@todo\s+(:<text>.*)$/gmi)
		}, {
			name: 'returns',
			regex: namedRegexp(/@return\s+(:<text>.*)$/g)
		}, {
			name: 'previous_vars',
			regex: namedRegexp(/^[\s*\/\-#]+@var\s+(:<type>\w+)\s+(:<name>[$&.\->\w]+)(?:[ \t]+)?(:<description>.*)$/gm)
		}, {
			name: 'previous_params',
			regex: namedRegexp(/^[\s*\/\-#]+@param\s+(:<type>\w+)\s+(:<name>[$&.\->\w]+)(?:[ \t]+)?(:<description>.*)$/gm)
		}
	],

	//what to look out for when checking the code, and the template to use to spit back out
	checkers: [
		{
			name: 'functions',
			regex: [reg_functions, reg_assign_functions],
			/*
			Tested with (mix of php, javascript, lua, ino):
				Receive = function( len, ply )
				function ENT:StartTouch( ent )
				const char* wifi_pkt_type2str(wifi_promiscuous_pkt_type_t type, wifi_mgmt_subtypes_t subtype) {
				Receive = function( len, ply )
				local function Extract_SBPlanetName( value, planet )
				function hook.Call( name, GM, ... )
				Receive = function( len, ply )
				function Receive( len, ply )
				function test()
				$var = function(test, test2) {
				void wifi_sniffer_packet_handler(void* buff, wifi_promiscuous_pkt_type_t type) {
			*/
			//v1.0.1: namedRegexp(/(?:(:<modifier>\w+)\s)?(?:(:<type>function|void|)\s)(:<name>[\w:.]+)\((:<args_full>.*)\)(?:[\s:]+(:<returns>[\w]+))?/gi),
			//v1.0.0: regex: namedRegexp(/(?:(:<modifier>\w+)\s)?[\s;]?function (:<name>.+)\((:<args_full>.+)?\)/gi),
			template: [
				{
					name: 'args',
					against: 'args_full',
					regex: reg_vars_args
				},

				'{%- for function in functions -%}',
				'{{ block_start }}',

				'{%- if descriptions %}',
				...description,
				'{%- else %}',
				'{{block_line}} {{function.name | default(function.name2) }}{% if selected_text %}: {{selected_text|trim}}{% endif %}.',
				'{{block_line}}',
				'{%- endif %}',

				'{%- set add_author = true %}',
				...author,
				...since,
				...version,

				'{%- if function.modifier %}',
				'{{block_line}} @access	{{function.modifier | trim}}',
				'{%- endif %}',

				...global,

				'{%- set max_type = 0 %}',
				'{%- set max_name = 0 %}',
				'{%- for arg in function.args %}',
				'{%- set length = (arg.value | get_data_type(arg.type) | length) %}',
				'{%- if (length > max_type) %}',
				'{%- set max_type = length %}',
				'{%- endif %}',
				'{%- set length = (arg.name or arg.value) | length %}',
				'{%- if (length > max_name) %}',
				'{%- set max_name = length %}',
				'{%- endif %}',
				'{%- endfor -%}',

				'{%- for arg in function.args %}', //start args
				'{%- set type = (arg.value | get_data_type(arg.type) | make_length(max_type) | lower ) %}',
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

				'{{block_line}} @param	{{ type }}\t{{ name }}\t{{ desc | default("") | trim }}',
				'{%- endfor %}', //end args

				'{%- set returns = "void" %}',
				'{%- if function.returns %}', //looped through the code and found a return statement
				'{%- set returns = function.returns | default("mixed") | get_data_type("mixed") %}',
				'{%- endif %}',
				'{{block_line}} @return	{{ returns }}',

				...todo,

				'{{ block_end }}',
				'{%- endfor -%}'
			]
		}, {
			name: 'vars',
			regex: reg_vars_args,
			template: [
				'{%- if not functions and not classes and not copyright -%}',
				'{%- for var in vars -%}{%- if var.type != "return" -%}',
				'{{ block_start }}',

				'{%- if descriptions %}',
				...description,
				'{%- else %}',
				'{%- if selected_text %}',
				'{{block_line}} {{selected_text}}.',
				'{{block_line}}',
				'{%- endif %}',
				'{%- endif %}',

				'{%- set add_author = false %}',
				...author,

				'{%- if var.modifier %}',
				...since,
				'{%- endif %}',

				'{%- set name = var.name | trim %}',

				'{%- for p in previous_vars %}',
				'{%- if p.description and (p.name|trim) == name %}',
				'{%- set name = name + "\t" + p.description %}',
				'{%- endif %}',
				'{%- endfor %}',

				'{{block_line}} @var		{{ var.value | get_data_type(var.type) | lower}}	{{name | trim}}',

				'{%- if var.modifier %}',
				'{{block_line}} @access	{{var.modifier}}',
				'{%- endif %}',

				...global,
				...todo,

				'{{ block_end }}',
				'{%- endif -%}{%- endfor -%}',
				'{%- endif -%}'
			]
		}, {
			name: 'classes',
			regex: reg_classes,
			template: [
				{
					name: 'args',
					against: 'args_full',
					regex: reg_vars_args
				},

				'{%- for class in classes -%}',
				'{{ block_start }}',

				'{%- if descriptions %}',
				...description,
				'{%- else %}',
				'{{block_line}} {{class.name | default("anonymouse class")}}{% if selected_text %}: {{selected_text|trim}}{% endif %}.',
				'{{block_line}}',
				'{%- endif %}',

				'{%- set add_author = true %}',
				...author,
				...since,
				...version,

				'{%- if class.extends %}',
				'{{block_line}} @see		{{class.extends}}',
				'{%- endif %}',

				'{%- for arg in class.args %}',
				'{{block_line}} @param	{{ arg.value | get_data_type(arg.type) | lower }}{% for p in previous_params %}{% if p.description and (p.name|trim) == (arg.name|trim) %}\t{{ p.description | default("") | trim }}{% endif %}{% endfor %}',
				'{%- endfor %}',

				...global,
				...todo,

				'{{ block_end }}',
				'{%- endfor -%}'
			]
		}
	],
};