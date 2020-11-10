# Dict Tempering

Change properties order for better GZIPpability. Works with JSON/JSON5 objects (dicts) and arrays and arbitrary newline separated strings.

## Usage:

```sh
<some-unordered-array.json npx dict-tempering --type=json >reshuffled-array.json
```
```sh
<some-object.json5 npx dict-tempering >reshuffled-object.json5
```
```sh
<newline-separated.txt npx dict-tempering --type=newline >reshuffled.txt
```
