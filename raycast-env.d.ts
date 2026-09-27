/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `check-text` command */
  export type CheckText = ExtensionPreferences & {
  /** Siri Shortcut Name - Exact macOS Shortcut name to run */
  "shortcutName": string
}
}

declare namespace Arguments {
  /** Arguments passed to the `check-text` command */
  export type CheckText = {
  /** Text to spell-check */
  "text": string
}
}

