import { rm, mkdir, readdir, copyFile, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
process.chdir(projectRoot);

const PACKAGE_JSON_DELETE = [
	'scripts',
	'devDependencies',
]

async function main() {
	console.log('Cleaning up...');

	let filesToDelete = [];
	try {
		const localEntries = await readdir('dist');
		filesToDelete = localEntries.map(fn => resolve('dist', fn));
	} catch (e) {
		// ENOENT == There's no such dir, that's okay
		if (e.code !== 'ENOENT') {
			console.log('Something weird happened');
			filesToDelete = ['dist'];
		}
	}

	await Promise.all(
		filesToDelete.map(filename => rm(filename, { force: true, recursive: true }))
	);

	console.log('Copying files...');

	try {
		await mkdir('dist');
	} catch (e) {
		if (e.code !== 'EEXIST') { // EEXIST == Such directory already exists
			throw e;
		}
	}

	await Promise.all([
		copyFile('build/base.js', 'dist/base.js'),
		copyFile('build/base.d.ts', 'dist/base.d.ts'),

		copyFile('build/json.js', 'dist/json.js'),
		copyFile('build/json.d.ts', 'dist/json.d.ts'),

		copyFile('build/json5.js', 'dist/json5.js'),
		copyFile('build/json5.d.ts', 'dist/json5.d.ts'),

		copyFile('build/newline.js', 'dist/newline.js'),
		copyFile('build/newline.d.ts', 'dist/newline.d.ts'),

		copyFile('build/cli.js', 'dist/cli.js'),
		copyFile('README.md', 'dist/README.md'),
	]);

	console.log('Enhancing DX...');

	let cliCode = await readFile('dist/cli.js', { encoding: 'utf-8' });
	cliCode = cliCode.replace(/\bimport\b.*/, '$& //\u001b[31;1m You need node >= 12.0.0! \u001b[m');
	await writeFile('dist/cli.js', cliCode);


	console.log('Copying package.json...');

	const pkgJson = JSON.parse(await readFile('package.json'), { encoding: 'utf-8' });
	for (const keyToDelete of PACKAGE_JSON_DELETE) {
		delete pkgJson[keyToDelete];
	}

	await writeFile('dist/package.json', JSON.stringify(pkgJson, null, 2));
}

main();



