module.exports = {
    microservices: {
        my: 'https://my.itrex.io',
        staffPortal: 'https://sp.itrex.io'
    },
    session: {
        cookie: {
            httpOnly: true,
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 30 * 3, // eslint-disable-line
            secure: false
        },
        name: 'itrexio_sid',
        resave: false,
        saveUninitialized: true,
        secret: 'PX55i1vd0wbd34CJVakKRBFZw1lr4m'
    },
    databaseProcess: {
        seed: process.env.SEED_RUN || false,
        migration: process.env.MIGRATION_RUN || true
    },
    mongodb: {
        description: 'localhost',
        options: { autoReconnect: true },
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/itrexio'
    },
    redis: {
        description: 'Redis instance',
        host: process.env.REDIS_HOST || 'itrex.io',
        pass: process.env.REDIS_PASS || 'LFhV1wtPuNN3fSsblHUI0zhecuVQvK',
        port: process.env.REDIS_PORT || '9736'
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '909973327597-emvoja96r5qpeben56rq1pr1jn2eo8ps.apps.googleusercontent.com',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectURL: process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5001/google',
        redirectLocalURL: process.env.GOOGLE_REDIRECT_LOCAL_URL || 'http://localhost:9001/google'
    },
    jira: {
        host: process.env.JIRA_HOST || 'pm.itrexgroup.com',
        username: process.env.JIRA_USERNAME || '',
        password: process.env.JIRA_PASSWORD || '',
        pluginApiToken: process.env.TEMPO_PLUGIN_API_TOKEN || '',
        pluginBaseUrl: process.env.TEMPO_PLUGIN_BASE_URL || 'https://pm.itrexgroup.com/plugins/servlet/tempo-getWorklog/'
    },
    sockets: {
        enable: false,
        rest: false
    },
    enforceSSL: process.env.ENFORCE_SSL || 'false',
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 5000, // eslint-disable-line
    url: process.env.URL || '//' + (process.env.HOST || 'localhost') + ((process.env.PORT && process.env.PORT !== 80) ? (':' + process.env.PORT) : ''), // eslint-disable-line
    uploadsDir: process.env.UPLOADS_FILE_DIR || `${__dirname}/../../uploads`
};
