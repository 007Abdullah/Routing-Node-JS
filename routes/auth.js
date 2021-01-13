var express = require("express");
var bcrypt = require("bcrypt-inzi")
var jwt = require('jsonwebtoken'); // https://github.com/auth0/node-jsonwebtoken
var { userModel, otpModel } = require("../dbrepo/models"); // problem was here, notice two dots instead of one
// console.log("userModel: ", userModel);
var postmark = require("postmark");
var { SERVER_SECRET } = require("../core/index");

var client = new postmark.Client("POSTMARK-SERVER-API-TOKEN-HERE");


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

    if (!req.body.email || !req.body.password) {
        res.send({
            message: `please send email and passwod in json body.
            e.g:
            {
                "email": "malikasinger@gmail.com",
                "password": "abc",
            }`,
            status: 403
        });
        return
    }
    userModel.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            res.send({
                message: "An Error Occure :" + JSON.stringify(err),
                status: 500
            });
        }
        else if (user) {
            bcrypt.varifyHash(req.body.password, user.password).then(isMatched => {
                if (isMatched) {
                    console.log("Matched");

                    var token = jwt.sign({
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        gender: user.gender
                    }, SERVER_SECRET);

                    res.cookie('jToken', token, {
                        maxAge: 86_400_000,
                        httpOnly: true
                    });

                    // when making request from frontend:
                    // var xhr = new XMLHttpRequest();
                    // xhr.open('GET', 'http://example.com/', true);
                    // xhr.withCredentials = true;
                    // xhr.send(null);


                    res.send({
                        message: "Login Success",
                        user: {
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            gender: user.gender,

                        }
                    });
                } else {
                    console.log("not matched");
                    res.send({
                        message: "inncorrect Password",
                        status: 401
                    })
                }
            }).catch(e => {
                console.log("error: ", e)
            });
        } else {
            res.send({
                message: "User NOT Found",
                status: 403
            });
        }
    });
});
api.post("/logout", () => {
    res.cookie("jToken", "", {
        maxAge: 86_400_000,
        httpOnly: true
    });
    res.send("logout success");
});


api.post("/forget-password", (req, res, next) => {
    if (!req.body.email) {
        res.status(403).send(` please send email in json body.
        e.g:
        {
            "email": "malikasinger@gmail.com"
        }`)
        return;
    }
    userModel.findOne({ email: req.body.email }), function (err, user) {
        if (err) {
            res.status(500).send({
                message: "An Error occured" + JSON.stringify(err)
            })
        }
        else if (user) {
            const otp = Math.floor(getRandomArbitrary(11111, 99999));

            otpModel.save({
                email: req.body.email,
                optCode: otp
            }).then((doc) => {
                client.sendEmail({
                    "From": "abdullah_student@sysborg.com",
                    "To": req.body.email,
                    "Subject": "Reset your password",
                    "TextBody": `Here is your pasword reset code: ${opt}`
                }).then((status) => {
                    console.log("Status :", status);
                    res.send({
                        message: "Email Send  With Otp"
                    });
                });
            }).catch((err) => {
                console.log("error in creating otp: ", err);
                res.send({
                    message: "Unexpected Error",
                    status: 500
                });
            });
        } else {
            res.send({
                message: "User Not Found",
                status: 403
            });
        }
    }

});


api.post("/forget-password-step2", (req, res, next) => {
    if (!req.body.email && !req.body.opt && !req.body.newPassword) {
        res.status(403).send(`
            please send email & otp in json body.
            e.g:
            {
                "email": "kb337137@gmail.com",
                "newPassword": "xxxxxx",
                "otp": "xxxxx" 
            }`)
        return;
    }
    userModel.findOne({ email: req.body.email }), function (err, user) {
        if (err) {
            res.send({
                message: "An Error Occure " + JSON.stringify(err),
                status: 500
            });
        }
        else if (user) {

            otpModel.find({ email: req.body.email }), function (err, otpData) {
                if (err) {
                    res.send({
                        message: "An Error Occure" + JSON.stringify(err),
                        status: 500
                    });
                }
                else if (otpData) {
                    otpData = otpData[otpData.length - 1]

                    console.log("otpData: ", otpData);

                    const now = new Date().getTime();
                    const otpIat = new Date(otpData.createdOn).getTime();// 2021-01-06T13:08:33.657+0000
                    const diff = now - otpIat;// 300000 5 minute
                    console.log("diff: ", diff);
                    
                    if(otpData){

                    }






                }



            }







        } else {

        }
    }
});



module.exports = api;

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}