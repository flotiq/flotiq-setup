#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import express from "express";
import fs from "fs";
import path from "path";
import open from "open";
import dotenv from "dotenv";
import chalk from "chalk";

const LOCAL_REDIRECT_PORT = 5989;

const argv = yargs(hideBin(process.argv))
  .command("flotiq-setup [options]", "Connect the project with Flotiq", {})
  .usage("Use flotiq-setup to authenticate your local project using Global Read-Only key")
  .option("apiUrl", {
    description: "Flotiq API URL",
    alias: "u",
    type: "string",
    default: "https://api.flotiq.com/v1",
    demandOption: false, // This makes the name argument required
  })
  .option("authUrl", {
    description: "Authentication endpoint",
    alias: "a",
    type: "string",
    default: "https://editor.flotiq.com/login",
  })
  .help()
  .alias("help", "h").argv;

localListener();
loginRedirect();

/**
 * This function opens the Flotiq login screen and requests a redirect
 * to local Express server.
 */
function loginRedirect() {
  const authUrl = `${argv.authUrl}?response_type=code&redirect_uri=http://localhost:${LOCAL_REDIRECT_PORT}/callback`;
  open(authUrl);
}

/**
 * This function creates a local Express server and listens on LOCAL_REDIRECT_PORT
 * once it receives the redirect from user's browser - it fills in the .env files
 */
function localListener() {
  const app = express();

  app.get("/callback", async (req, res, next) => {
    const { api_key } = req.query;

    try {
      console.log(
        chalk.bgWhite.hex("#0083FC").inverse("Your FLOTIQ_API_KEY:"),
        chalk.yellow(api_key)
      );

      // Save the token to .env file
      await saveTokenToEnv("GATSBY_FLOTIQ_API_KEY", api_key, ".env");
      await saveTokenToEnv("FLOTIQ_API_KEY", api_key, ".env");
      await saveTokenToEnv(
        "GATSBY_FLOTIQ_API_KEY",
        api_key,
        ".env.development"
      );
      await saveTokenToEnv(
        "FLOTIQ_API_KEY",
        api_key,
        ".env.development"
      );

      res.send("Authentication successful! You can close this window.");
      
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

  async function saveTokenToEnv(key, value, file) {
    const envFilePath = path.resolve(process.cwd(), file);

    // Check if .env file exists, if not, create it
    if (!fs.existsSync(envFilePath)) {
      fs.writeFileSync(envFilePath, "", { encoding: "utf8" });
      console.log(chalk.magenta(".env file created"));
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
