const express = require("express");
const router = express.Router();
const passport = require('passport');

// переход к странице для ввода логина и пароля
router.get('/login', (req, res) => {
    res.render('login', {
        message: req.flash('message') // по умолчанию передаётся пустое сообщение
    });
});

// осуществление входа пользователя в систему: выполняется переход к стратегии входа, которая определена в файле passport.js
router.post('/login', passport.authenticate('login', {
    successRedirect: '/', // маршрут, по которому будет выполнен переход в случае успешного входа в систему, можете поменять на другой
    failureRedirect: '/login', // маршрут, по которому будет выполнен переход в случае ошибок идентификации или аутентификации
    failureFlash : true // включение возможности вывода ошибок в виде флэш-сообщений (сообщения, которые никуда не сохраняются)
}), (req, res) => {
    res.send('OK');
});

// переход к странице регистрации
router.get('/register', (req, res) => {
    res.render('register',{
        message: req.flash('message')});
});

// осуществление регистрации пользователя в системе: выполняется переход к стратегии регистрации, которая определена в файле passport.js
router.post('/register', passport.authenticate('register', {
        successRedirect: '/login',
        failureRedirect: '/register',
        failureFlash : true
    }
));

// обработчик для выхода пользователя из системы (делает недействительной сессию пользователя)
router.get('/logout', (req, res) => {
    req.logout((err) => {  // завершаем сессию
        if (err) {
            throw err;
        }
        res.redirect('/login'); // переходим к странице ввода логина и пароля
    });
});


module.exports = router;