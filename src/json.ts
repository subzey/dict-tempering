import { Temperer } from './base.js';

export class JSONTemperer extends Temperer<string> {
	protected _banner!: string;
	protected _footer!: string;

	protected _split(input: string): readonly string[] {
		const stuff = JSON.parse(input);

		if (Array.isArray(stuff)) {
			this._banner = '[';
			this._footer = ']';

			const chunks: string[] = [];
			for (const value of stuff) {
				chunks.push(JSON.stringify(value));
			}
			return chunks;
		}

		if (stuff !== null && typeof stuff === 'object') {
			this._banner = '{';
			this._footer = '}';

			const chunks: string[] = [];
			for (const [key, value] of Object.entries(stuff)) {
				chunks.push(`${JSON.stringify(key)}:${JSON.stringify(value)}`);
			}
			return chunks;
		}

		throw new TypeError('A JSON object or array is expected');
	}

	protected _assemble(chunks: readonly string[]): string {
		return `${ this._banner }${ chunks.join(',') }${ this._footer }`;
	}
}
