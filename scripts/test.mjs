import { gzipSync } from 'zlib';
import { JSONTemperer } from '../dist/json.js';

function gzippedSize(input) {
	return gzipSync(input).byteLength;
}

function check(label, monthNames) {
	console.log(`Testing ${label}...`);

	const strOrd = JSON.stringify(monthNames);
	const strAlpha = JSON.stringify(monthNames.slice().sort());
	const strTempered = new JSONTemperer().process(strOrd);

	console.assert(
		JSON.stringify(JSON.parse(strTempered).sort()) === strAlpha,
		'should contain all the original values'
	);

	console.assert(
		gzippedSize(strTempered) < gzippedSize(strOrd),
		'should be less than naturally ordered'
	);
	console.assert(
		gzippedSize(strTempered) < gzippedSize(strAlpha),
		'should be less than alphabetically ordered'
	);
	console.log('OK');
}

check('en month names', ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);
check('ru month names', ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']);
