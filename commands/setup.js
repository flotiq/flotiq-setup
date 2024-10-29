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

    loginRedirect(authUrl, LOCAL_REDIRECT_PORT, rwKey);

    const app = express();
    let key, key_rw, status;

    const startServer = async () => {
        return new Promise((resolve, reject) => {
            const server = app.listen(LOCAL_REDIRECT_PORT, () => {
                logger.log(chalk.blue(`Server listening at http://localhost:${LOCAL_REDIRECT_PORT}`));
            });

            const closeServer = () => {
                setTimeout(() => {
                    server.close(() => {
                        logger.log(chalk.blue("Server closed."));
                    });
                }, 100);
            }

            app.get("/callback", (req, res) => {
                ({key, key_rw, status} = req.query);
                if (status === 'rejected' || status === 'failed') {
                    res.status(500).send("Authentication failed, check CLI output for more information");
                    closeServer();
                    reject(status);
                    return;
                }

                try {
                    roKey && logger.log(
                        chalk.bgWhite.hex("#0083FC").inverse("Your FLOTIQ_API_KEY:"),
                        chalk.yellow(key)
                    );

                    rwKey && logger.log(
                        chalk.bgWhite.hex("#0083FC").inverse("Your FLOTIQ_RW_API_KEY:"),
                        chalk.yellow(key_rw)
                    );

                    res.send("Auth  entication successful! You can close this window.");

                    if (noStore) {
                        closeServer();
                        return;
                    }

                    // Save the token to .env file
                    saveTokenToEnv("GATSBY_FLOTIQ_API_KEY", key, ".env", logger);
                    saveTokenToEnv("FLOTIQ_API_KEY", key, ".env", logger);
                    saveTokenToEnv("GATSBY_FLOTIQ_API_KEY", key, ".env.development", logger);
                    saveTokenToEnv("FLOTIQ_API_KEY", key, ".env.development", logger);

                    logger.log(chalk.bgWhite.hex("#0083FC").inverse("Your .env files have been adjusted with your Flotiq API keys. You can close this terminal."));

                    closeServer();

                } catch (error) {
                    logger.error(chalk.red("Failed to exchange token:"), error);
                    res.status(500).send("Authentication failed, check CLI output for more information");
                }
            });

            server.on("close", () => {
                resolve();
            });
        })
    }

    try {
        await startServer();
    } catch (e) {
        throw e;
    }

    return {
        ...(roKey && {FLOTIQ_API_KEY: key}),
        ...(rwKey && {FLOTIQ_RW_API_KEY: key_rw}),
    };
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
    const authUrl = argv.authUrl;
    const roKey = argv.roKey;
    const rwKey = argv.rwKey;
    const noStore = argv.noStore;
    const silent = argv.silent;
    const logger = silent ? silentLogger : console;

    try {
        //@todo for tests change authUrl to localhost
        await setup(authUrl, logger, roKey, rwKey, noStore);
        process.exit(0);
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
        process.exit(1);
    }

}

module.exports = {
    command: 'flotiq-setup [options]',
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
