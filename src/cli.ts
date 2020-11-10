#!/usr/bin/env node

import yargs from 'yargs';

import { ITemperer, Options } from './base.js';
import { NewlineTemperer } from './newline.js';
import { JSONTemperer } from './json.js';
import { JSON5Temperer } from './json5.js';

const availTypes = ['json', 'json5', 'newline'] as const;

async function readEntireStream(inputStream: AsyncIterable<Uint8Array>): Promise<string> {
	const chunks: Uint8Array[] = [];
	for await (const chunk of inputStream) {
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString('utf-8');
}

async function main(): Promise<void> {
	const argv = (yargs(process.argv.slice(2))
		.usage(`dict-tempering`)
		.usage('Change properties order for better GZIPpability.')
		.usage('Pass the input sting into stdin and the the result from stdout.')
		.options({
			type: { choices: availTypes, default: 'json5', description: 'Type of the input and output' },
			'max-rounds': { type: 'number', description: 'Max amount of rounds' },
		})
		.example('$0 <input.json5 >output.json5', '')
		.example('$0 --type=json <input.json5 >output.json5', '')
		.example('$0 --type=newline <input.txt >output.txt', '')
		.argv
	);

	if (process.stdin.isTTY && process.stderr.isTTY) {
		process.stderr.write('Pipe or type the string into stdin!\n');
	}

	let Implementation: { new(opts?: Partial<Options>): ITemperer<string> } = (
		argv.type === 'json5' ? JSON5Temperer :
		argv.type === 'json' ? JSONTemperer :
		argv.type === 'newline' ? NewlineTemperer :
		null as never
	);

	class LoggingImpl extends Implementation {
		protected _log(message: string): void {
			process.stderr.write(message + '\n');
		}
	}

	const res = new LoggingImpl({ maxRounds: argv['max-rounds'] }).process(await readEntireStream(process.stdin));

	process.stdout.write(res);
}

main().catch(
	(error: Error) => {
		console.error(error.stack);
		process.exit(1);
	}
)
