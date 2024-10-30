const chalk = require("chalk");
const express = require("express");
const {loginRedirect, saveTokenToEnv} = require("../src/helpers");
const {number} = require("yargs");

const LOCAL_REDIRECT_PORT = 5989;
const authUrlFlag = "authUrl";
const roKeyFlag = "ro-key";
const rwKeyFlag = "rw-key";
const silentFlag = "silent";
const noStoreFlag = "no-store";

/**
 * This function creates a local Express server and listens on LOCAL_REDIRECT_PORT
 * once it receives the redirect from user's browser - it fills in the .env files
 */
async function setup(authUrl, logger, roKey, rwKey, noStore) {

    loginRedirect(authUrl, LOCAL_REDIRECT_PORT, roKey, rwKey);

    const app = express();
    const startServer = async () => {
        return new Promise((resolve, reject) => {
            const server = app.listen(LOCAL_REDIRECT_PORT, () => {
                logger.log(chalk.blue(`Server listening at http://localhost:${LOCAL_REDIRECT_PORT}`));
            });

            server.on("connection", (client) => {
                client.setTimeout(100); // 100 ms keepalive timeout allows for instant server close after response
            });

            const closeServer = () => {
                server.close(() => {
                    logger.log(chalk.blue("Server closed."));
                });
            }

            app.get("/callback", (req, res) => {
                const {api_key, api_key_rw, status} = req.query;
                res.on("finish", () => {
                    closeServer();
                });
                if (status === 'rejected' || status === 'failed') {
                    res.status(500).send("Authentication failed, check CLI output for more information");
                    reject(status);
                    return;
                }

                try {
                    roKey && logger.log(
                        chalk.bgWhite.hex("#0083FC").inverse("Your FLOTIQ_API_KEY:"),
                        chalk.yellow(api_key)
                    );

                    rwKey && logger.log(
                        chalk.bgWhite.hex("#0083FC").inverse("Your FLOTIQ_RW_API_KEY:"),
                        chalk.yellow(api_key_rw)
                    );

                    resolve({
                        ...(roKey && {FLOTIQ_API_KEY: api_key}),
                        ...(rwKey && {FLOTIQ_RW_API_KEY: api_key_rw}),
                    });

                    res.send("Auth  entication successful! You can close this window.");

                    if (noStore) {
                        return;
                    }

                    // Save the token to .env file
                    if(roKey) {
                        saveTokenToEnv("GATSBY_FLOTIQ_API_KEY", api_key, ".env", logger);
                        saveTokenToEnv("FLOTIQ_API_KEY", api_key, ".env", logger);
                        saveTokenToEnv("GATSBY_FLOTIQ_API_KEY", api_key, ".env.development", logger);
                        saveTokenToEnv("FLOTIQ_API_KEY", api_key, ".env.development", logger);
                    }
                    if (rwKey) {
                        saveTokenToEnv("FLOTIQ_RW_API_KEY", api_key_rw, ".env", logger);
                        saveTokenToEnv("FLOTIQ_RW_API_KEY", api_key_rw, ".env.development", logger);
                    }

                    logger.log(chalk.bgWhite.hex("#0083FC").inverse("Your .env files have been adjusted with your Flotiq API keys. You can close this terminal."));

                } catch (error) {
                    logger.error(chalk.red("Failed to exchange token:"), error);
                    res.status(500).send("Authentication failed, check CLI output for more information");
                }
            });
        })
    }

    return await startServer();
}

const silentLogger = {
    log: () => {
    },
    error: () => {
    },
    warn: () => {
    },
    info: () => {
    },
    debug: () => {
    },
};

/**
 * Run setup command
 * @param {{authUrl: string, roKey: boolean, rwKey: boolean, silent: boolean, noStore: boolean}} argv
 */
const main = async (argv) => {
    const authUrl = argv.authUrl || 'https://editor.flotiq.com/login';
    const roKey = argv.roKey;
    const rwKey = argv.rwKey;
    const noStore = argv.noStore;
    const silent = argv.silent;
    const logger = silent ? silentLogger : console;

    try {
        return await setup(authUrl, logger, roKey, rwKey, noStore);
    } catch (e) {
        let message;

        switch (e) {
            case 'rejected':
                message = 'User did not consent to provide the keys. Authorization process has been terminated.';
                break;
            case 'failed':
                message = 'A system error occurred during the authorization attempt. Please try again later.';
                break;
            default:
                message = 'A system error occurred. Please try again later.';
                break;
        }

        logger.error(chalk.red(message), e);
    }
}

module.exports = {
    command: '$0 [options]',
    describe: 'Use flotiq-setup to authenticate your local project using Global Read-Only key',
    builder: (yargs) => {
        return yargs
            .option(authUrlFlag, {
                description: "Authentication endpoint",
                alias: "a",
                type: "string",
                default: "https://editor.flotiq.com/login",
            })
            .option(roKeyFlag, {
                description: "Return Read only Flotiq api key as FLOTIQ_API_KEY",
                alias: "r",
                type: "boolean",
                default: true,
                demandOption: false,
            })
            .option(rwKeyFlag, {
                description: "Return Read and Write Flotiq api key as FLOTIQ_RW_API_KEY",
                alias: "w",
                type: "boolean",
                default: false,
                demandOption: false,
            })
            .option(silentFlag, {
                description: "Suppress console output. Assumes no for all prompts.",
                alias: "s",
                type: "boolean",
                default: false,
                demandOption: false,
            })
            .option(noStoreFlag, {
                description: "Disable saving Flotiq api keys into env files",
                alias: "n",
                type: "boolean",
                default: false,
                demandOption: false,
            })
    },
    handler: main,
    setup
}
