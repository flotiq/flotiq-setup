const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const chalk = require("chalk");
const openurl = require('openurl');
const express = require("express");


const LOCAL_REDIRECT_PORT = 5989;

/**
 * This function opens the Flotiq login screen and requests a redirect
 * to local Express server.
 */
function loginRedirect(authUrl) {
    const url = `${authUrl}?response_type=code&redirect_uri=http://localhost:${LOCAL_REDIRECT_PORT}/callback`;
    openurl.open(url);
}

/**
 * This function creates a local Express server and listens on LOCAL_REDIRECT_PORT
 * once it receives the redirect from user's browser - it fills in the .env files
 */
function setup(authUrl) {

    loginRedirect(authUrl);

    const app = express();

    app.get("/callback", async (req, res, next) => {
        const {api_key} = req.query;

        try {
            console.log(
                chalk.bgWhite.hex("#0083FC").inverse("Your FLOTIQ_API_KEY:"),
                chalk.yellow(api_key)
            );

            // Save the token to .env file
            saveTokenToEnv("GATSBY_FLOTIQ_API_KEY", api_key, ".env");
            saveTokenToEnv("FLOTIQ_API_KEY", api_key, ".env");
            saveTokenToEnv(
                "GATSBY_FLOTIQ_API_KEY",
                api_key,
                ".env.development"
            );
            saveTokenToEnv(
                "FLOTIQ_API_KEY",
                api_key,
                ".env.development"
            );

            res.send("Authentication successful! You can close this window.");
            console.log(chalk.bgWhite.hex("#0083FC").inverse("Your .env files have been adjusted with your Flotiq API keys. You can close this terminal."));

            setTimeout(() => {
                server.close(() => {
                    console.log(chalk.blue("Server closed."));
                    process.exit(0); // Exit with a 'success' code
                });
            }, 100);


        } catch (error) {
            console.error(chalk.red("Failed to exchange token:"), error);
            res
                .status(500)
                .send("Authentication failed, check CLI output for more information");
        }
    });

    const server = app.listen(LOCAL_REDIRECT_PORT, () => {
        console.log(
            chalk.blue(`Server listening at http://localhost:${LOCAL_REDIRECT_PORT}`)
        );
    });

    function saveTokenToEnv(key, value, file) {
        const envFilePath = path.resolve(process.cwd(), file);

        // Check if .env file exists, if not, create it
        if (!fs.existsSync(envFilePath)) {
            fs.writeFileSync(envFilePath, "", {encoding: "utf8"});
            //console.log(chalk.magenta(".env file created"));
        }

        const envConfig = dotenv.parse(fs.readFileSync(envFilePath));

        // Update or add the key-value pair in the env file
        envConfig[key] = value;
        const newEnvContent = Object.keys(envConfig)
            .map((k) => `${k}=${envConfig[k]}`)
            .join("\n");

        fs.writeFileSync(envFilePath, newEnvContent);
        console.log(chalk.green(`${key} updated in`), chalk.yellow(file));
    }
}

/**
 * Run setup command
 * @param {{apiUrl: string, authUrl: string}} argv
 */
const main = (argv) => {
    const authUrl = argv.authUrl;
    setup(authUrl);
}

module.exports = {
    command: 'flotiq-setup [options]',
    describe: 'Use flotiq-setup to authenticate your local project using Global Read-Only key',
    builder: (yargs) => {
        return yargs
            .option("authUrl", {
                description: "Authentication endpoint",
                alias: "a",
                type: "string",
                default: "https://editor.flotiq.com/login",
            })

    },
    handler: main,
    setup
}
