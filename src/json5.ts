import JSON5 from 'json5';
import { JSONTemperer } from './json.js';

export class JSON5Temperer extends JSONTemperer {
	protected _split(input: string): readonly string[] {
		const stuff = JSON5.parse(input);

		if (Array.isArray(stuff)) {
			this._banner = '[';
			this._footer = ']';

			const chunks: string[] = [];
			for (const value of stuff) {
				chunks.push(JSON5.stringify(value));
			}
			return chunks;
		}

		if (stuff !== null && typeof stuff === 'object') {
			this._banner = '{';
			this._footer = '}';

			const chunks: string[] = [];
			for (const [key, value] of Object.entries(stuff)) {
				chunks.push(`${escapeKey(key)}:${JSON5.stringify(value)}`);
			}
			return chunks;
		}

		throw new TypeError('A JSON5 object or array is expected');
	}
}

function escapeKey(key: string): string {
	try {
		if (/\s/.test(key)) {
			throw new SyntaxError('An unquoted key should not contain whitespaces');
		}
		void JSON5.parse(`{${key}: null}`);
		return key;
	} catch {
		return JSON5.stringify(key);
	}
}
