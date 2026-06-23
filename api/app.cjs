"use strict";

/**
 * Passenger startup file for prod
 *
 * CommonJS on purpose due to my own server setup
 *
 */

const path = require("path");
const { pathToFileURL } = require("url");

if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";

const serverEntry = pathToFileURL(path.join(__dirname, "src", "server.js")).href;

import(serverEntry).catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
