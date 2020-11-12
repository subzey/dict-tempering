import JSON5 from 'json5';
import * as assert from 'assert';
import { gzipSync } from 'zlib';
import { JSONTemperer } from '../dist/json.js';
import { JSON5Temperer } from '../dist/json5.js';
import { NewlineTemperer } from '../dist/newline.js';

function gzippedSize(input) {
	return gzipSync(input).byteLength;
}

{
	console.log('Testing JSON array...');
	const original = JSON.stringify(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);
	const tempered = new JSONTemperer().process(original);

	assert.strictEqual(
		tempered.length, original.length,
		'raw string size'
	)

	assert.ok(
		gzippedSize(tempered) < gzippedSize(original),
		'gzipped size should decrease'
	);

	assert.deepStrictEqual(
		[...JSON.parse(original)].sort(),
		[...JSON.parse(tempered)].sort(),
		'should have all the same values'
	);
}
{
	console.log('Testing JSON5 array...');
	const original = JSON5.stringify(['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']);
	const tempered = new JSON5Temperer().process(original);

	assert.strictEqual(
		tempered.length, original.length,
		'raw string size'
	)

	assert.ok(
		gzippedSize(tempered) < gzippedSize(original),
		'gzipped size should decrease'
	);

	assert.deepStrictEqual(
		[...JSON5.parse(original)].sort(),
		[...JSON5.parse(tempered)].sort(),
		'should have all the same values'
	);
}
{
	console.log('Testing JSON object...');
	const original = JSON.stringify({
		aqua:'#0ff', black:'#000', blue:'#00f', fuchsia:'#f0f',
		gray:'#808080', green:'#008000', lime:'#0f0', maroon:'#800000',
		navy:'#000080', olive:'#808000', purple:'#800080', red:'#f00',
		silver:'#c0c0c0', teal:'#008080', white:'#fff', yellow:'#ff0',
	});
	const tempered = new JSONTemperer().process(original);

	assert.strictEqual(
		tempered.length, original.length,
		'raw string size'
	)

	assert.ok(
		gzippedSize(tempered) < gzippedSize(original),
		'gzipped size should decrease'
	);

	assert.deepStrictEqual(
		JSON.parse(original),
		JSON.parse(tempered),
		'should have all the same values'
	);
}
{
	console.log('Testing JSON5 object...');
	const original = JSON5.stringify({
		'whitespace in key': 'whitespace in value',
		'not primitive': ['a', 'not', 'primitive', 'value', null, [1, 2, 3]],
		primitive: true,
		1: 'one',
		2: 'two times one',
		3: 'two times one plus one',
	});
	const tempered = new JSON5Temperer().process(original);

	assert.strictEqual(
		tempered.length, original.length,
		'raw string size'
	)

	assert.ok(
		gzippedSize(tempered) < gzippedSize(original),
		'gzipped size should decrease'
	);

	assert.deepStrictEqual(
		JSON5.parse(original),
		JSON5.parse(tempered),
		'should have all the same values'
	);
}
{
	console.log('Testing newline separated text...');
	const original = [
		'Lorem ipsum dolor sit amet',
		'consectetur adipiscing elit',
		'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
		'Ut enim ad minim veniam',
		'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat',
		'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
		'Excepteur sint occaecat cupidatat non proident',
		'sunt in culpa qui officia deserunt mollit anim id est laborum',

		'\u0020...and one more line to check that leading and trailing newlines are presereved\u0020'
	].join('\n');
	const tempered = new NewlineTemperer().process(original);

	assert.strictEqual(
		tempered.length, original.length,
		'raw string size'
	)

	assert.ok(
		gzippedSize(tempered) < gzippedSize(original),
		'gzipped size should decrease'
	);

	assert.deepStrictEqual(
		original.split('\n').sort(),
		tempered.split('\n').sort(),
		'should have all the same lines'
	);
}
