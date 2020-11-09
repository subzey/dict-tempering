#!/usr/bin/env node

import { temper } from './index.js';

async function readEntireStream(inputStream: AsyncIterable<Uint8Array>): Promise<string> {
	const chunks: Uint8Array[] = [];
	for await (const chunk of inputStream) {
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString('utf-8');
}

async function main(): Promise<void> {
	if (process.stdin.isTTY && process.stderr.isTTY) {
		process.stderr.write('Avaiting JSON string in stdin...\n');
	}

	const res = temper(
		await readEntireStream(process.stdin),
		{
			type: 'json5',
			logDebug(str: string) { process.stderr.write(str + '\n') },
			logNormal(str: string) { process.stderr.write(str + '\n') },
		}
	);

	process.stdout.write(res);
}

main().catch(
	(error: Error) => {
		console.error(error.stack);
		process.exit(1);
	}
)
