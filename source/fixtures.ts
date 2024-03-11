import {Fixtures, Page} from "@playwright/test";
import { test as base } from "@playwright/test";
import { Server } from "./server.js";

export type ServerWorkerOptions = {
    serverManager: { server: Server };
};

export type ServerFixtures = {
    server: Server;
};

const serverFixtures: Fixtures<ServerFixtures, ServerWorkerOptions> = {
    serverManager: [async ({}, run) => {
        const serverInstance = new Server();
        await run({ server: serverInstance });

        return serverInstance.stop();
    }, { scope: "worker" }],
    server: async ({ serverManager }, run, testInfo) => {
        serverManager.server.reset();
        await serverManager.server.init();
        await run(serverManager.server);
       throw new Error("foo");
    }
};

export const test = base.extend(serverFixtures);
