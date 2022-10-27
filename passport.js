const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const {openConnection} = require("./helpers");

// стратегия регистрации пользователя
passport.use('register', new LocalStrategy({
        usernameField: 'username', // указываем, что для логина будет использоваться поле 'username' (из таблицы user)
        passwordField: 'password', // указываем, что для пароля будет использоваться поле 'password' (также из таблицы user)
        passReqToCallback: true
    },

    (req, username, password, done) => { // done - обратный вызов (после регистрации в вызывающий метод будет возвращена информация об успешной/неуспешной операции)
        const db = openConnection();
        const user = done(db.prepare(`SELECT * FROM user WHERE username = ?`).get(username));
        if (user)
            return done(null, false, req.flash("message", "Пользователь с данным логином существует"));

        bcrypt.hash(password, 10, (err, hash) => { // генерируем хеш пароля, 10 - длина генерируемой "соли" (про "соль" подробно написано в задании)
            if (err) {
                throw err;
            }
            const user = {
                username: username,
                password: hash
            };
            db.prepare(`INSERT INTO user(username, password) VALUES (@username, @password);`).run(user);
            return done(null, user);
        });
    }));

// стратегия аутентификации пользователя по логину и паролю. Данная функция находит пользователя по логину в базе данных и проверяет правильность введённого пароля.
passport.use('login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    (req, username, password, done) => {
        const db = openConnection();
        const row = db.prepare(`SELECT * FROM user u WHERE u.username = ?`).get(username);
        if (!row)
            return done(null, false, req.flash("message", "Неверно введенный логин и/или пароль"));
        console.log(row);
        bcrypt.compare(password, row.password, (err, res) =>
            res
                ? done(null, row)
                : done(null, false, req.flash("message", "Неверно введенный логин и/или пароль"))
        )
    }));

passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser((username, done) => {
    const db = openConnection();
    const user = db.prepare(`SELECT * FROM user WHERE username = ?`).get(username);
    done(null, user);
});