const passport = require('passport');
const OpenIDStrategy = require('passport-openid').Strategy;

const {STEAM_REALM, STEAM_RETURN_URL} = process.env;

passport.use(
    'steam',
    new OpenIDStrategy(
        {
        providerURL: 'http://steamcommunity.com/openid',
        returnURL: STEAM_RETURN_URL,
        realm: STEAM_REALM,
        stateless: true,
        },
        (identifier, done) => {
            const match = identifier.match(/(\d+)$/);
            const steamId = match ? match[1] : identifier;
            
            return done(null, { steamId });
        }
    )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;
