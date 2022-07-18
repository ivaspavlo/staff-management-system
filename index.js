/**
 * Module dependencies.
 */
const path = require('path');
const http = require('http');

const config = require('./config/index');
const express = require('express');
const redis = require('redis');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const connectRedis = require('connect-redis');
const { connectMongoWrapper, readyMongoose } = require('./database/mongodb');
const models = require('./database/models');
const policies = require('./policies/index');
const mappers = require('./mappers/index');
const RedisStore = connectRedis(session);
const swaggerUi = require('swagger-ui-express');
const coreRoutes = require('./routes');
const validator = require('./validators');

const services = require('./services/index');
const { SwaggerService, SessionService, SocketsService, setupTest, queryParser } = services;

const controllers = require('./controllers');
const uploadFileDir = config.get('uploadsDir');
const socketsConfig = config.get('sockets');

class CoreApp {

    init() {
        this.routerScope = '/api';
        this.allRoutes = [];
        this.app = express();
        this.server = http.Server(this.app);

        /*
         * Enable enforcement of SSL to redirect http to https
         * Disabled by default on development, enabled on production
         */

        if (config.get('enforceSSL') === 'true') {
            this.app.all('*', (req, res, next) => {
                if (req.headers['x-forwarded-proto'] === 'https') {
                    return next();
                }
                res.redirect(config.get('url') + req.originalUrl);
            });
        }

        this.enableBodyParser();
        this.enableQueryParser();
        this.enableSession();
        this.deserializeSession();

        if (socketsConfig.enable) {
            this.enableSocketClient();
        }

        return this.connectToMongo();
    }

    connectToMongo() {
        return connectMongoWrapper(config.get('mongodb'));
    }

    enableBodyParser() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }

    enableQueryParser() {
        this.app.use(queryParser());
    }

    deserializeSession() {
        this.__prepareDeserializeSessionParser();
        this.app.use(this.deserializeSessionParser);
    }

    __prepareDeserializeSessionParser() {
        this.deserializeSessionParser = (req, res, next) => {
            req.logout = SessionService.logout;
            SessionService.deserializeEmployee(req, models)
                .then(next);
        };
    }

    __prepareCookieParser() {
        const sessionSettings = config.get('session');
        this.cookieParser = cookieParser(sessionSettings.secret);
    }

    __prepareSessionParser() {
        const redisConf = config.get('redis'),
            sessionSettings = config.get('session'),
            redisClient = redis.createClient(redisConf.port, redisConf.host, { auth_pass: redisConf.pass }), // eslint-disable-line
            storeObject = {
                host: redisConf.host,
                port: redisConf.port,
                pass: redisConf.pass,
                client: redisClient
            };

        redisClient.on('error', (err) => {
            console.log('Redis connection error: ' + err); // eslint-disable-line
            throw new Error('Redis connection error');
        });

        sessionSettings.store = new RedisStore(storeObject);

        this.sessionParser = session(sessionSettings);
    }

    enableSession() {
        this.__prepareCookieParser();
        this.__prepareSessionParser();
        this.app.use(this.cookieParser);
        this.app.use(this.sessionParser);
    }

    addMiddleware(handler) {
        this.app.use(handler);
    }

    addRoutes(router) {
        this.allRoutes.push(router);
    }

    enableSwagger(info, availableSchemas = null) {
        SwaggerService.addInfo(info);
        this.app.use(`${this.routerScope}/docs`, swaggerUi.serve, swaggerUi.setup(SwaggerService.generate(availableSchemas)));
    }

    enableCoreRoutes() {
        this.allRoutes.push(coreRoutes);
    }

    enableSocketClient() {
        const socketClientToolPath = path.join(__dirname, './_socket-client-tool/');
        this.static(socketClientToolPath);
        this.app.use('/api/socket-client-tool', (req, res) => {
            res.sendFile(`${socketClientToolPath}/sockets.html`);
        });

        SocketsService.init(this.server, this.cookieParser, this.sessionParser, this.deserializeSessionParser);
    }

    proceedRoutes() {
        if (this.allRoutes.length) {
            this.allRoutes.forEach((r) => {
                this.app.use(this.routerScope, r.generateExpress());
                SwaggerService.addRoutes(r.generateSwagger(this.routerScope));
                if (socketsConfig.enable && socketsConfig.rest) {
                    SocketsService.addRoutes(r.generateSockets(this.routerScope));
                }
            });
        }
    }

    static(...pathToFiles) {
        return pathToFiles.forEach((p) => this.app.use(express.static(p)));
    }

    start(mainFrontPath = null) {
        if (mainFrontPath !== null) {
            this.static(mainFrontPath, uploadFileDir);
            this.app.all('*', (req, res) => {
                res.sendFile(`${mainFrontPath}/index.html`);
            });
        }

        return new Promise((resolve) => {
            this.server.listen(config.get('port'), (appError) => {
                if (appError) {
                    console.log('Server starting error.'); // eslint-disable-line
                    throw appError;
                }
                console.log('Main process started %s', process.pid);  // eslint-disable-line
                console.log('Server was started successfully'); // eslint-disable-line
                console.log(`Listening: ${config.get('host')}:${config.get('port')}`); // eslint-disable-line

                if (socketsConfig.enable) {
                    console.log('Sockets enabled on the server'); // eslint-disable-line
                    if (socketsConfig.rest) {
                        console.log('Sockets REST enabled on the server'); // eslint-disable-line
                    }
                }

                if (config.get('env') === 'production') {
                    // Do some specific staff on production
                }

                resolve(this.server);
            });
        });
    }

    getApp() {
        return this.app;
    }

    get swagger() {
        return SwaggerService;
    }

    get models() {
        return models;
    }

    get config() {
        return config;
    }

    get services() {
        return services;
    }

    get policies() {
        return policies;
    }

    get mappers() {
        return mappers;
    }

    get RestController() {
        return controllers.RestController;
    }

    get controllers() {
        return controllers;
    }

    get validator() {
        return validator;
    }

    get readyMongoose() {
        return readyMongoose;
    }

    get setupTest() {
        return setupTest;
    }

}

module.exports = CoreApp;
