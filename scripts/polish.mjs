import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

import { JSONTemperer } from '../dist/json.js';

const projectRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
process.chdir(projectRoot);

async function main() {
	console.log('Final touches...');

    const pkgJson = JSON.parse(await readFile('dist/package.json'), { encoding: 'utf-8' });
	delete pkgJson.private;

	if (pkgJson.keywords) {
		// Process our own package.json.
		// Because why not?
		let keywordsAsJson = JSON.stringify(pkgJson.keywords);
		console.log(keywordsAsJson);
		keywordsAsJson = new JSONTemperer().process(keywordsAsJson);
		console.log(keywordsAsJson);
		pkgJson.keywords = JSON.parse(keywordsAsJson);
	}

	await writeFile('dist/package.json', JSON.stringify(pkgJson, null, 2));
}

main();



