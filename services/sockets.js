const config = require('../config');
const socketio = require('socket.io');
const { each } = require('lodash');
const parseUrl = require('parseurl');
const socketsConfig = config.get('sockets');

class SocketsService {

    init(server, cookieParser, sessionParser, deserializeSessionParser) {
        this.socketEnabled = true;
        this.routes = [];
        this.deserializeSessionParser = deserializeSessionParser;
        this.io = socketio(server);
        this.io.use(async(socket, next) => {
            try {
                if (socket.handshake.headers && socket.handshake.headers.cookie) {
                    const req = {
                        originalUrl: '/',
                        headers: socket.handshake.headers
                    };

                    await this.__expressCallbackWrapper(cookieParser, req, {});
                    await this.__expressCallbackWrapper(sessionParser, req, {});
                    socket.expressRequest = req;
                }
                return next();

            } catch (error) {
                return next(error);
            }

        });

        this.io.on('connection', (socket) => {
            socket.on('join-room', (room) => {
                socket.join(room);
            });

            socket.on('leave-room', (room) => {
                socket.leave(room);
            });

            if (socketsConfig.rest) {
                socket.on('request', async(data, fn) => {
                    const req = socket.expressRequest;
                    if (data.body) {
                        req.body = JSON.parse(data.body);
                    }

                    req.method = data.method || 'get';
                    req.url = data.url;
                    parseUrl(req);
                    await this.__expressCallbackWrapper(this.deserializeSessionParser, req, {});

                    const result = await this.__executeRoute(req, this.io);
                    return fn(result);
                });
            }

            socket.on('disconnect', () => {
                // TODO: do something on user disconnect
            });
        });
    }

    addRoutes(routes) {
        if (this.socketEnabled) {
            this.routes = this.routes.concat(routes);
        }
    }

    async __executeRoute(req, io) {
        let neededRoute = null;

        each(this.routes, (route) => {
            if (route.method === req.method) {
                const parsedUrl = req._parsedUrl;
                const params = route.regexp.exec(parsedUrl.pathname);

                if (params) {
                    let query = {};
                    if (parsedUrl.query) {
                        query = JSON.parse('{"' + decodeURI(parsedUrl.query).replace(/"/g, '\\"')
                            .replace(/&/g, '","')
                            .replace(/=/g, '":"') + '"}'); // eslint-disable-line
                    }

                    neededRoute = {
                        route,
                        params
                    };
                    req.query = query;
                    return false;
                }
            }

            return true;
        });

        if (neededRoute) {
            const result = await this.__handleErrorSuccessResponse(() => neededRoute.route.middleware(req));


            if (!result.status) {
                return result.data;
            }

            if (result.status && !result.data) {
                return Promise.resolve({ statusCode: 400 });
            }


            const resultController = await this.__handleErrorSuccessResponse(() => neededRoute.route.controller(req));
            if (!resultController.status) {
                return resultController.data;
            }

            if (neededRoute.route.socketNotify) {
                io.emit(`${req.method}::${req._parsedUrl.pathname}`, resultController.data);
            }

            return resultController.data;
        }

        return Promise.resolve({ statusCode: 404 });
    }

    async __handleErrorSuccessResponse(executer) {
        const [ error, success ] = await executer();
        return error ? { status: false, data: error } : { status: true, data: success };
    }

    __expressCallbackWrapper(executer, req, res) {
        return new Promise((resolve) => {
            executer(req, res, resolve);
        });
    }

}

const instance = new SocketsService();
module.exports = {
    name: 'SocketsService',
    services: instance
};
