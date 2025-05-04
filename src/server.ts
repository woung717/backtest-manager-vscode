import { Request, Response, NextFunction, Application } from 'express';

// This is a server class for the custom backtest result saving endpoint
export class ExtensionServer {
    private express = require('express');
    private app: Application;
    private server: any = null;
    private port = 3000;

    constructor(port?: number) {
        if (port) {
            this.port = port;
        }
        this.app = this.express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(this.express.json());
        this.app.use((_req: Request, res: Response, next: NextFunction) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }

    private setupRoutes(): void {
        // Handle status check
        this.app.get('/status', (_req: Request, res: Response) => {
            res.json({ status: 'running', port: this.port });
        });

        // Handle unknown routes
        this.app.use((_req: Request, res: Response) => {
            res.status(404).json({ error: 'Not Found' });
        });
    }

    public start(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port)
                .on('error', (err: any) => {
                    if (err.code === 'EADDRINUSE') {
                        // Try another port
                        this.port++;
                        this.server?.close();
                        this.start()
                            .then(port => resolve(port))
                            .catch(error => reject(error));
                    } else {
                        reject(err);
                    }
                })
                .on('listening', () => {
                    console.log(`Extension server running on port ${this.port}`);
                    resolve(this.port);
                });
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }

            this.server.close((err: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.server = null;
                    resolve();
                }
            });
        });
    }
}
