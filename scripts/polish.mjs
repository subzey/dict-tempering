import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
process.chdir(projectRoot);

async function main() {
	console.log('Final touches...');

    const pkgJson = JSON.parse(await readFile('dist/package.json'), { encoding: 'utf-8' });
	delete pkgJson.private;
	let serialized = JSON.stringify(pkgJson, null, 2);
	await writeFile('dist/package.json', serialized);
}

main();



