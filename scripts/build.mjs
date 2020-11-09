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
		copyFile('build/index.js', 'dist/index.js'),
		copyFile('build/index.d.ts', 'dist/index.d.ts'),
		copyFile('build/cli.js', 'dist/cli.js'),
	]);

	console.log('Copying package.json...');

	const pkgJson = JSON.parse(await readFile('package.json'), { encoding: 'utf-8' });
	for (const keyToDelete of PACKAGE_JSON_DELETE) {
		delete pkgJson[keyToDelete];
	}

	await writeFile('dist/package.json', JSON.stringify(pkgJson, null, 2));
}

main();



