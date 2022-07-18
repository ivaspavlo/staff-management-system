const models = require('../database/models');
const { SessionService } = require('../services');
const config = require('../config');
const validator = require('../validators');

const { Employee, PersonalInfo } = models;
const googleConfig = config.get('google');
const google = require('googleapis');
const { OAuth2 } = google.auth;

class AuthController {

    constructor() {
        this.oauth2Client = this.__createGoogleOAuthClient(googleConfig.redirectURL);
        this.oauth2LocalClient = this.__createGoogleOAuthClient(googleConfig.redirectLocalURL);
    }

    __createGoogleOAuthClient(redirectURL) {
        return new OAuth2(
            googleConfig.clientId,
            googleConfig.clientSecret,
            redirectURL
        );
    }

    __getGoogleOAuthClient(isLocalAuth = false) {
        return isLocalAuth === 'true' ? this.oauth2LocalClient : this.oauth2Client;
    }

    me({ user }) {
        return user;
    }

    getLoginLink({ query }) {
        query.isLocalAuth = query.isLocalAuth.toString();

        validator.validate([
            {
                data: query,
                rules: { isLocalAuth: [ 'required', 'string' ] }
            }
        ]);

        const { isLocalAuth = 'false' } = query;
        return { url: this.__getGoogleOAuthClient(isLocalAuth).generateAuthUrl({ scope: [ 'profile', 'email' ] }) };
    }

    async login({ req, body, query }) {
        validator.validate([
            {
                data: body,
                rules: {
                    code: [ 'required', 'string' ],
                    isLocalAuth: [ 'required', 'string' ]
                }
            }
        ]);

        const { code, isLocalAuth } = body;
        let tokens = null;

        if (code) {
            tokens = await this.getToken(code, isLocalAuth);
        } else {
            tokens = { access_token: query.access_token }; // eslint-disable-line
        }

        const userInfo = await this.processToken(tokens, isLocalAuth);
        const { email, gender, name } = userInfo;
        const [ firstName, lastName ] = name.split(' ');

        let employee = await Employee.findOne({ email })
            .lean()
            .exec();

        if (!employee) {
            employee = await Employee.create({
                email,
                gender,
                firstName,
                lastName
            });
            await PersonalInfo.create({ employee: employee._id });
        }

        SessionService.serialize(req, employee._id);
        return { statusCode: 204, data: '' };
    }

    getToken(code, isLocalAuth) {
        return new Promise((resolve, reject) => {
            this.__getGoogleOAuthClient(isLocalAuth).getToken(code, (err, tokens) => {
                if (err) {
                    return reject(err);
                }

                return resolve(tokens);
            });
        });
    }

    processToken(tokens, isLocalAuth) {
        return new Promise((resolve, reject) => {
            this.__getGoogleOAuthClient(isLocalAuth).credentials = tokens;

            const oauth2 = google.oauth2({
                auth: this.__getGoogleOAuthClient(isLocalAuth),
                version: 'v2'
            });

            oauth2.userinfo.v2.me.get((oauthErr, userinfo) => {
                if (oauthErr) {
                    return reject(oauthErr);
                }

                if (userinfo) {
                    if (userinfo.hd === 'itrexgroup.com') {
                        // try to find in database
                        resolve(userinfo);
                        // return reject(new Error('No user found by this email. Please contact administrator to create account for you!'));
                    } else {
                        return reject(new Error('You should sign-in using your itrexgroup.com Gmail account'));
                    }
                } else {
                    return reject(new Error('No user information'));
                }
            });
        });
    }

    logout({ req }) {
        req.logout(req);
        return { statusCode: 204, data: '' };
    }

}

module.exports = {
    name: 'AuthController',
    controller: new AuthController()
};
