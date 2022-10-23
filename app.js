const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override')
const logger = require('morgan');
const {openConnection} = require("./helpers");

const indexRouter = require("./routes/index");
const studentRouter = require("./routes/student");
const groupRouter = require('./routes/groups');
const disciplineRouter = require('./routes/discipline');
const teacherRouter = require('./routes/teacher');
const reportRouter = require('./routes/report');
const apiRouter = require('./routes/api');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'))

// app.use(route, router);
app.use("/", indexRouter);
app.use("/students/", studentRouter);
app.use("/groups/", groupRouter);
app.use("/disciplines/", disciplineRouter);
app.use("/teachers/", teacherRouter);
app.use('/reports/', reportRouter);
app.use('/api/', apiRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
