var express = require('express');
var router = express.Router();
var csrf = require("csurf");

router.get('/', csrf(), function (req, res, next){
    res.render('vue_app', {_csrf: req.csrfToken()});
});

module.exports = router;