import type {
    Express,
    Request,
    Response
} from "express";
import { readFile } from 'fs/promises';
import type { AddressInfo } from "node:net";
import type http from "http";
import bodyParser from "body-parser";
import express from "express";
import * as path from 'path';

export class Server {
    #app: Express;
    #server: http.Server;
    #initialized = false;

    public PORT: number;
    public PREFIX: string;
    public EMPTY_HTML_PAGE: string;
    public BEACONS_ENDPOINT: string;

    static create(): Server {
        return new Server();
    }

    init(): Promise<void> {
        if (this.#initialized) {
            return;
        }
        this.#app = express();
        this.#app.disable("x-powered-by");
        this.#app.use(bodyParser.json());
        this.#app.use(bodyParser.text());
        this.#setAppHeaders()
            .#createServer();
        this.#app.use(this.#serveHTML.bind(this));

        return new Promise((resolve) => {
            this.#server.once("listening", resolve);
        });
    }

    #setAppHeaders(): this {
        this.#app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "*");
            res.header("Access-Control-Allow-Methods", "*");
            res.header("Access-Control-Expose-Headers", "*");
            res.header("Timing-Allow-Origin", "*");
            res.header("Cache-Control", ["no-cache", "no-store", "must-revalidate"]);
            res.header("Pragma", "no-cache");
            res.header("Expires", "0");
            next();
        });
        return this;
    }

    #createServer(): this {
        // We use 0 here, to let os pick free port for itself
        this.#server = this.#app.listen(0, () => {
            const port = (this.#server.address() as AddressInfo).port;
            this.#initialized = true;
            const protocol = "http";
            this.PORT = port;
            this.PREFIX = `${protocol}://localhost:${port}`;
            this.BEACONS_ENDPOINT = `${this.PREFIX}/dynatraceMonitor`;
            this.EMPTY_HTML_PAGE = `${this.PREFIX}/home.html`;
            console.log(`server listening on port ${this.PORT}`);
        });
        return this;
    }

    async #serveHTML(req: Request, res: Response, next): Promise<void> {
        if (req.path.endsWith(".html")) {
            const filePath = path.join(__dirname, "..", "html", req.path);
            const fileContent = await readFile(filePath, "utf8");
            await res.send(fileContent);
        } else {
            next();
        }
    }

    reset(): void {
    }

    stop(): Promise<void> {
        if (!this.#initialized) {
            return;
        }
        return new Promise<void>((resolve, reject) => {
            this.#server.close((err) => {
                if (err) {
                    reject(err);
                    console.error(err.message);
                    return;
                }
                console.log(`server listening on port ${this.PORT} is closed.`);
                resolve();
            });
        });
    }
}
