<a href="https://flotiq.com/">
    <img src="https://editor.flotiq.com/fonts/fq-logo.svg" alt="Flotiq logo" title="Flotiq" align="right" height="60" />
</a>


flotiq-setup
============

This command makes it super-easy to fill in the local `.env` files with Flotiq API key.
By default the Global Read-Only key is used.

## Quickstart

```bash
npx flotiq-setup
```

## Usage

```
Use flotiq-setup to authenticate your local project using Global Read-Only key

Commands:
  index.mjs flotiq-setup [options]  Connect the project with Flotiq

Options:
      --version   Show version number                                        [boolean]
  -a, --authUrl   Authentication endpoint                                    [string]  [default: "https://editor.flotiq.com/login"]
  -r, --ro-key    Return Read only Flotiq api key as FLOTIQ_API_KEY          [boolean] [default: true]
  -w, --rw-key    Return Read and Write Flotiq api key as FLOTIQ_RW_API_KEY  [boolean] [default: false]
  -s, --silent    Suppress console output. Assumes no for all prompts.       [boolean] [default: false]
  -n, --no-store  Disable saving Flotiq api keys into env files              [boolean] [default: false]
  -h, --help      Show help                                                  [boolean]
```

## Surpressing output messages

If you don't want to receive output messages, pass `--silent`/`-s` option to limit number of logs.

```bash
npx flotiq-setup --silent
```

This is especially useful when you are using `flotiq-setup` with other automation tools or you are running setup function by hand.

## Node.js api

You can use command handler in your scripts by importing command handler

```javascript
const {handler} = require('flotiq-setup/commands/setup');

await handler({authUrl: 'https://editor.flotiq.com/login', roKey: true, rwKey: true, silent: false, noStore: false});
```



## Collaborating

If you wish to talk with us about this project, feel free to hop on
our [![Discord Chat](https://img.shields.io/discord/682699728454025410.svg)](https://discord.gg/FwXcHnX).

If you found a bug, please report it in [issues](https://github.com/flotiq/flotiq-setup).
