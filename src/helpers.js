const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const chalk = require("chalk");
const openurl = require('openurl');

/**
 * This function opens the Flotiq login screen and requests a redirect
 * to local Express server.
 */
function loginRedirect(authUrl, port, roKey, rwKey) {

    let keyType = rwKey ? 'rw' : 'ro'

    if (roKey && rwKey) {
        keyType = 'both';
    }

    const url = `${authUrl}?response_type=code&key_type=${keyType}&redirect_uri=http://localhost:${port}/callback`;
    openurl.open(url);
}

function saveTokenToEnv(key, value, file, logger) {
    const envFilePath = path.resolve(process.cwd(), file);

    // Check if .env file exists, if not, create it
    if (!fs.existsSync(envFilePath)) {
        fs.writeFileSync(envFilePath, "", {encoding: "utf8"});
        //logger.log(chalk.magenta(".env file created"));
    }

    const envConfig = dotenv.parse(fs.readFileSync(envFilePath));

    // Update or add the key-value pair in the env file
    envConfig[key] = value;
    const newEnvContent = Object.keys(envConfig)
        .map((k) => `${k}=${envConfig[k]}`)
        .join("\n");

    fs.writeFileSync(envFilePath, newEnvContent);
    logger.log(chalk.green(`${key} updated in`), chalk.yellow(file));
}

module.exports = {
    loginRedirect,
    saveTokenToEnv
}
