module.exports = {
    microservices: {
        my: 'https://my-dev.itrex.io',
        staffPortal: 'https://sp-dev.itrex.io'
    },
    google: { redirectURL: process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5001/google' }
};
