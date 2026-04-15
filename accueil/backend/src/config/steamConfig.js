const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;

const {STEAM_API_KEY, STEAM_RETURN_URL} = process.env;

passport.use(
    new SteamStrategy(
        {
            returnURL: STEAM_RETURN_URL,
            realm: process.env.STEAM_REALM,
            apiKey: STEAM_API_KEY,
        },
        (identifier, profile, done) => {
            const steamId = profile.id;
            return done(null, { steamId, profile });
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
