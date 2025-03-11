import {expect, Fixtures} from "@playwright/test";
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

expect.extend({
    toIncludeMultiple(data: string, items: string[]) {
        const failures = items.filter(item => !data.includes(item));
        const message = (): string => `expected ${data} to contain ${failures}`;
        return { pass: failures.length === 0, message };
    },
    toHaveName(action: any, name: string) {
        const pass = true;
        const message = (): string => `expected action ${JSON.stringify(action)} to have name of "${name}"`;
        return { pass, message };
    },
    toBeBetween(number: number, num1: number, num2: number) {
        const pass = number >= num1 && number <= num2;
        const message = (): string => {
            return `expected ${number} to be between ${num1} and ${num2}`;
        };
        return { pass, message };
    },
    undefinedOrAny(value: unknown, sample: unknown) {
        if (typeof sample !== "function") {
            throw new Error("sample must be of type function");
        }
        const pass = typeof value === "undefined" || typeof value === typeof sample();
        const message = (): string => {
            return `expected ${value} to be of type "${typeof sample()}" or "undefined" but was "${typeof value}"`;
        };
        return { pass, message };
    }
});
