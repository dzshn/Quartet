/*
 * Quartet, a client mod for TETR.IO
 * Copyright (c) 2023 Sofia Lima and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { anonymousUA } from "@api/constants";
import { IpcChannel } from "types";
import browser from "webextension-polyfill";

browser.webRequest.onBeforeSendHeaders.addListener(
    ({ requestHeaders }) => {
        const settings = QuartetBeryl.ipc.sendSync(IpcChannel.GET_SETTINGS);
        if (!settings?.Quartet.anonymiseFingerprint)
            return;

        if (!requestHeaders)
            return { requestHeaders: [{ name: "User-Agent", value: anonymousUA }] };

        for (const header of requestHeaders)
            if (header.name.toLowerCase() === "user-agent")
                header.value = anonymousUA;

        return { requestHeaders };
    },
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"],
);

browser.tabs.getCurrent().then(tab => {
    browser.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ["quartet.js"],
    });
});
