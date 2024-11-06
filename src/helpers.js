const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const chalk = require("chalk");
const open = require('open');
const dotenvFlow = require('dotenv-flow');

/**
 * This function opens the Flotiq login screen and requests a redirect
 * to local Express server.
 */
function loginRedirect(authUrl, port, roKey, rwKey) {
    let keyType = rwKey ? 'rw' : 'ro'

    if (roKey && rwKey) {
        keyType = 'both';
    }

    const url = new URL(authUrl);

    url.searchParams.append('response_type', 'code');
    url.searchParams.append('key_type', keyType);
    url.searchParams.append('application_name', 'Flotiq Setup CLI');
    url.searchParams.append('redirect_uri', `http://localhost:${port}/callback`);

    open(url.toString());
}

function saveTokenToEnv(key, value, files, logger) {
    files.forEach((file) => {
        const envFilePath = path.resolve(process.cwd(), file);

        // Check if .env file exists, if not, create it
        if (!fs.existsSync(envFilePath)) {
            fs.writeFileSync(envFilePath, "", {encoding: "utf8"});
            //logger.log(chalk.magenta(".env file created"));
        }

        const envConfig = dotenvFlow.parse(envFilePath);

        if (typeof envConfig[key] === "undefined") {
            fs.appendFileSync(`${envFilePath}`, `\n${key}=${value}`);
            logger.log(chalk.green(`${key} updated in`), chalk.yellow(file));
        }
    });
}

module.exports = {
    loginRedirect,
    saveTokenToEnv
}
