

console.log('array: ', getDataType("['test']") );
console.log('string: ', getDataType("'test'") );
console.log('number: ', getDataType("123456") );

// Returns if a value is a boolean
function isBoolean (value) {
	return typeof value === 'boolean' || value.toLowerCase() == 'false' || value.toLowerCase() == 'true';
}

function isNumber(value) {
	return typeof value === 'number' || !isNaN(value);
}

function isArray(value) {
	try {
		return Array.isArray(eval(value))
	} catch (error) {
		return false;
	}
}

function getDataType(value) {
	if (!value) return 'mixed';

	if (isArray(value)) return 'array';
	if (isBoolean(value)) return 'boolean';
	if (isNumber(value)) return 'number';

	return typeof value;
}