var express = require("express");
var bcrypt = require("bcrypt-inzi")
var jwt = require('jsonwebtoken'); // https://github.com/auth0/node-jsonwebtoken
var { userModel } = require("../dbrepo/models"); // problem was here, notice two dots instead of one
console.log("userModel: ", userModel);

var api = express.Router();

api.post("/signup", (req, res, next) => {
    if (!req.body.name
        || !req.body.email
        || !req.body.password
        || !req.body.phone
        || !req.body.gender) {

        res.status(403).send(`
            please send name, email, passwod, phone and gender in json body.
            e.g:
            {
                "name": "Sameer",
                "email": "kb337137@gmail.com",
                "password": "abc",
                "phone": "03121278181",
                "gender": "Male"
            }`)
        return;
    }
    userModel.findOne({ email: req.body.email }, function (err, doc) {
        if (!err && !doc) {
            bcrypt.stringToHash(req.body.password).then(function (hash) {

                var newUser = new userModel({
                    "name": req.body.name,
                    "email": req.body.email,
                    "password": hash,
                    "phone": req.body.phone,
                    "gender": req.body.gender,
                })
                newUser.save((err, data) => {
                    if (!err) {
                        res.send({
                            message: "User Create",
                            status: 200
                        });
                    }
                    else {
                        console.log(err);
                        res.send({
                            message: "User Create Error " + JSON.stringify(err),
                            status: 500
                        });
                    }
                });


            });
        } else if (err) {
            res.send({
                message: "DB ERROR",
                status: 500
            });
        } else {
            res.send({
                message: "User Already Exist",
                status: 409
            });
        }
    });
});

api.post("/login", (req, res, next) => {

    




})