var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exp_validator = require('express-validator');
var session = require('express-session');
var fileUpload = require("express-fileupload");
//var csrf = require('csurf');
var history = require("connect-history-api-fallback");

var admin_firebase = require("firebase-admin");
var serviceAccount = require("./config/serviceAccountKey.json");
admin_firebase.initializeApp({
    credential: admin_firebase.credential.cert(serviceAccount),
    databaseURL: require('./config/private.json').config_fb.databaseURL
});

var api = require('./routes/api');
var web = require('./routes/web');
var admin = require('./routes/admin');
var drivers = require('./routes/drivers');

var app = express();

// here enable ssl and proxy
app.enable("trust proxy");
app.use(function (req, res, next) {
    if (req.secure) {
        return next();
    }
    res.redirect('https://' + req.headers.host + req.url);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(exp_validator({
    customValidators: {
        matchVal: function(val, param){
            if(param.indexOf("|") !== -1){
                return param.split("|").indexOf(val) !== -1;
            }
            return param === val;
        }
    },
    customSanitizers: {
        trimValRis: function(value){
            return value.split(" ").join("");
        },
        trimVal: function (value) {
            var newValueSplit = value.trim().split("");
            var genVal = "";
            var prevChar = "";
            for (var i = 0; i < newValueSplit.length; i++) {
                if (prevChar === " " && newValueSplit[i] === " ") {
                    continue;
                } else {
                    genVal += newValueSplit[i];
                }
                prevChar = newValueSplit[i];
            }
            return genVal;
        },
    },
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.'), root = namespace.shift(), formParam = root;
        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));
app.use(cookieParser());
app.use(session({secret: "This is RoadioApp Secret!", resave: false, saveUninitialized: false}));
//app.use(csrf());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

app.use('/api', api);
app.use('/', web);
app.use('/admin/drivers', drivers);

app.use(history({
    logger: console.log.bind(console),
    rewrites: [
        {from: /\/admin/, to: '/admin'}
    ]
}));
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
    /*if (err.status === 404) {
        res.render('pages/error_404');
    } else {
        res.render('pages/error_500');
    }*/
});

module.exports = app;
