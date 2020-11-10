import { deflateRawSync } from 'zlib';
import JSON5 from 'json5';

export type LoggingFunction = (this: void, message: string) => unknown;

export interface Options {
	readonly type: 'json' | 'json5' | 'newline';
	readonly maxRounds: number;
	readonly logNormal: LoggingFunction;
	readonly logDebug: LoggingFunction;
}

type Chunk = string;
type JSONSerializable = string | number | boolean | null | Record<string, unknown> | unknown[];
type Variant = {
	readonly chunks: readonly Chunk[];
	readonly nucleusStart: number;
	readonly nucleusEnd: number;
	readonly score: number;
}

interface Padding {
	readonly banner: string;
	readonly separator: string;
	readonly footer: string;
}

export function temper(input: string | {readonly [key: string]: unknown} | readonly unknown[], options?: Partial<Options>): string;
export function temper(input: unknown, options?: {[key in keyof Options]?: unknown}): string {
	const {
		type,
		maxRounds,
		logNormal,
		logDebug
	} = normalizeOptions(options);

	let { chunks, padding } = makeChunks(input, type);

	if (chunks.length > 100) {
		logDebug('Looks like it will take a long time. Sit back and enjoy');
	}

	if (chunks.length < 2) {
		logNormal('There\'s nothing to shuffle');
		return assemble(chunks, padding);
	}

	let startOfRoundScore = estimate(chunks, padding);

	for (let round = 1; round <= maxRounds; round++) {
		logNormal(`Prev best: ${startOfRoundScore}. Round #${round}...`);

		let variants: Variant[] = [];
		for (let i = 0; i < chunks.length; i++) {
			variants.push({
				chunks: chunks,
				nucleusStart: i,
				nucleusEnd: i + 1,
				score: 0,
			});
		}
		while (variants[0].nucleusEnd - variants[0].nucleusStart < variants[0].chunks.length) {
			const newVariants = [];
			for (const oldVariant of variants) {
				for (const newVariant of combinations(oldVariant)) {
					newVariant.score = estimate(newVariant.chunks, padding);
					newVariants.push(newVariant);
				}
			}
			variants = newVariants.sort(sortByScore).slice(0, chunks.length);
			logDebug(`...${variants[0].score} so far`);
		};

		const bestVariant = variants[0];
		if (!bestVariant || bestVariant.score >= startOfRoundScore) {
			logNormal(`Round #${round} finished: No size reduction, exiting`);
			break;
		}

		logNormal(`Round #${round} finished: ${startOfRoundScore} -> ${bestVariant.score}`);
		chunks = bestVariant.chunks;
		startOfRoundScore = bestVariant.score;
	}

	return assemble(chunks, padding);
}


function normalizeOptions(options?: {[key in keyof Options]?: unknown}): Options {
	let maxRounds: Options['maxRounds'] = Infinity;
	if (options && options.maxRounds !== undefined) {
		maxRounds = Math.floor(options.maxRounds as number);
		if (isNaN(maxRounds) || maxRounds <= 0) {
			throw new RangeError('maxRounds should be a number > 1');
		}
	}

	let type: Options['type'] = 'json';
	if (options && options.type !== undefined) {
		if (options.type !== 'json' && options.type !== 'json5') {
			throw new TypeError('type should be either json or json5');
		}
		type = options.type;
	}

	let logNormal: Options['logNormal'] = () => {};
	if (options && options.logNormal !== undefined) {
		if (typeof options.logNormal !== 'function') {
			throw new TypeError('logNormal should be a function');
		}
		logNormal = options.logNormal as LoggingFunction;
	}

	let logDebug: Options['logDebug'] = () => {};
	if (options && options.logDebug !== undefined) {
		if (typeof options.logDebug !== 'function') {
			throw new TypeError('logDebug should be a function');
		}
		logDebug = options.logDebug as LoggingFunction;
	}

	return {
		type,
		maxRounds,
		logNormal,
		logDebug,
	};
}

function makeChunks(input: unknown, type: Options['type']): { chunks: readonly Chunk[]; padding: Padding } {
	if (type === 'json') {
		return makeJSONChunks(input);
	}

	if (type === 'json5') {
		return makeJSON5Chunks(input);
	}

	if (type === 'newline') {
		return makeNewlineChunks(input);
	}

	throw new Error(`Unknown type ${type}`);
}

function makeJSONChunks(input: unknown): { chunks: readonly Chunk[]; padding: Padding } {
	// JSON is parsed as JSON5
	const stuff: JSONSerializable = typeof input === 'string' ? JSON5.parse(input) : input;

	if (Array.isArray(stuff)) {
		const chunks: Chunk[] = [];
		for (const value of stuff) {
			chunks.push(JSON.stringify(value));
		}
		return {
			chunks: chunks,
			padding: { banner: '[', separator: ',', footer: ']' },
		};
	}

	if (stuff !== null && typeof stuff === 'object') {
		const chunks: Chunk[] = [];
		for (const [key, value] of Object.entries(stuff)) {
			chunks.push(`${JSON.stringify(key)}:${JSON.stringify(value)}`);
		}
		return {
			chunks: chunks,
			padding: { banner: '{', separator: ',', footer: '}' },
		};
	}

	throw new TypeError('A JSON object or array is expected');
}

function makeJSON5Chunks(input: unknown): { chunks: readonly Chunk[]; padding: Padding } {
	const stuff: JSONSerializable = typeof input === 'string' ? JSON5.parse(input) : input;

	if (Array.isArray(stuff)) {
		const chunks: Chunk[] = [];
		for (const value of stuff) {
			chunks.push(JSON.stringify(value));
		}
		return {
			chunks: chunks,
			padding: { banner: '[', separator: ',', footer: ']' },
		};
	}

	if (stuff !== null && typeof stuff === 'object') {
		const chunks: Chunk[] = [];
		for (const [key, value] of Object.entries(stuff)) {
			chunks.push(`${escapeJSON5Key(key)}:${JSON5.stringify(value)}`);
		}
		return {
			chunks: chunks,
			padding: { banner: '{', separator: ',', footer: '}' },
		};
	}

	throw new TypeError('A JSON5 object or array is expected');
}

function escapeJSON5Key(str: string): string {
	try {
		if (/\s/.test(str)) {
			throw new SyntaxError('A key should not contain whitespaces');
		}
		void JSON5.parse(`{${str}: null}`);
		return str;
	} catch {
		return JSON5.stringify(str);
	}
}

function makeNewlineChunks(input: unknown): { chunks: readonly Chunk[]; padding: Padding } {
	if (Array.isArray(input)) {
		const chunks = [];
		for (const chunk of input) {
			if (typeof chunk !== 'string') {
				throw new TypeError('The input array should be an array of strings');
			}
			chunks.push(chunk);
		}
		return {
			chunks: chunks,
			padding: { banner: '', separator: '\n', footer: '' },
		};
	}

	if (typeof input === 'string') {
		const chunks = input.split(/\r?\n/).filter(Boolean);
		return {
			chunks: chunks,
			padding: { banner: '', separator: '\n', footer: '' },
		};
	}

	throw new TypeError('A string or JS array of strings is expected');
}

function assemble(chunks: readonly Chunk[], padding: Padding): string {
	return padding.banner + chunks.join(padding.separator) + padding.footer;
}

function estimate(chunks: readonly Chunk[], padding: Padding): number {
	return deflateRawSync(assemble(chunks, padding)).byteLength;
}

function* combinations(variant: Variant) {
	const nucleus: Chunk[] = [];
	const pool: Chunk[] = [];

	for (let i = 0; i < variant.chunks.length; i++) {
		if (i >= variant.nucleusStart && i < variant.nucleusEnd) {
			nucleus.push(variant.chunks[i]);
		} else {
			pool.push(variant.chunks[i]);
		}
	}

	for (let i = 0; i < pool.length; i++) {
        pool.unshift(pool.pop()!);
        {
			const chunks = [...nucleus, ...pool];
			yield {
				chunks: chunks,
				nucleusStart: 0,
				nucleusEnd: nucleus.length + 1,
				score: 0,
			}
        }
        {
			const chunks = [...pool, ...nucleus];
			yield {
				chunks: chunks,
				nucleusStart: chunks.length - nucleus.length - 1,
				nucleusEnd: chunks.length,
				score: 0,
			}
        }
    }
}

function sortByScore(v1: Variant, v2: Variant) {
	return v1.score - v2.score;
}
