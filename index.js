const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const {
    getMoreImages,
    getImages,
    insertUpload,
    commentModal,
    commentInsert,
    delPicture,
    polling
} = require("./db.js");
///////MULTER///////
const multer = require("multer");
const uidSafe = require("uid-safe");
const path = require("path");

const diskStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function(req, file, callback) {
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152
    }
});
///////MULTER//////

const s3 = require("./s3.js");

const conf = require("./config.json");

const basicAuth = require("basic-auth");

app.use(bodyParser.json());
app.use(express.static("./public"));
app.use(express.static("./uploads"));

//////////////////////express basic Auth//////////
var auth = function(req, res, next) {
    var creds = basicAuth(req);
    if (!creds || creds.name != "admin" || creds.pass != "admin") {
        res.setHeader(
            "WWW-Authenticate",
            'Basic realm="Enter your credentials to see this stuff."'
        );
        res.sendStatus(401);
    } else {
        next();
    }
};

app.get("/admin", auth, (req, res) => {
    res.json({
        success: true
    });
    console.log("Authenticated");
});
///////////////////////////////////////////////

app.get("/imageboard", (req, res) => {
    getImages()
        .then(data => {
            var length = data.rows.length;
            if (length == 0) {
                res.json({
                    morePics: false
                });
            }
            res.json({
                data: data.rows,
                lastImgId: data.rows[length - 1].id
            });
        })
        .catch(e => {
            console.log(e);
        });
});

app.get("/polling", (req, res) => {
    polling()
        .then(data => {
            res.json({
                success: true,
                min: data.rows[0].min,
                max: data.rows[0].max
            });
        })
        .catch(e => {
            console.log(e);
        });
});
///////////////////////////////////////
app.get("/deletePic", (req, res) => {
    delPicture(req.query.id)
        .then(response => {
            res.json({
                success: true,
                created_at: response.rows[0]
            });
        })
        .catch(e => {
            console.log(e);
        });
});
//////////////////////////////////////////

app.get("/moreImages", (req, res) => {
    let lastImgId = req.query.id;
    getMoreImages(lastImgId).then(data => {
        let length = data.rows.length;
        if (data.rows[length - 1].id == 1) {
            res.json({
                data: data.rows,
                morePics: false
            });
        } else {
            res.json({
                data: data.rows,
                lastImgId: data.rows[length - 1].id
            });
        }
    });
});

const months = [
    "Jan",
    "Feb",
    "March",
    "April",
    "Mai",
    "June",
    "July",
    "August",
    "Sept",
    "Oct",
    "Nov",
    "Dec"
];

///openModal

app.get("/commentModal", (req, res) => {
    commentModal(req.query.id)
        .then(data => {
            data.rows.forEach(i => {
                let date = new Date(i.commentcreated);
                let imagedate = new Date(i.createdat);
                i.commentcreated = `${date.getDate()} ${
                    months[date.getMonth()]
                } ${date.getFullYear()} at ${date.getHours()}: ${date.getMinutes()}`;
                i.createdat = `${imagedate.getDate()} ${
                    months[imagedate.getMonth()]
                } ${imagedate.getFullYear()} at ${imagedate.getHours()}: ${imagedate.getMinutes()}`;
            });
            res.json({
                success: true,
                imageData: data.rows
            });
        })
        .catch(e => {
            console.log(e);
        });
});

/////inputComment

app.post("/comment", (req, res) => {
    commentInsert(req.body.comment, req.body.username, req.body.imageId)
        .then(response => {
            response.rows.forEach(i => {
                let date = new Date(i.created_at);
                i.commentcreated = `${date.getDate()} ${
                    months[date.getMonth()]
                } ${date.getFullYear()} at ${date.getHours()}: ${date.getMinutes()}`;
            });
            res.json({
                success: true,
                commentData: response.rows
            });
        })
        .catch(e => {
            console.log(e);
        });
});

///single returns middleware functionaltiy
app.post("/upload", uploader.single("file"), s3.upload, (req, res) => {
    if (req.file) {
        let path = `${conf.s3Url}aaron/${req.file.filename}`;
        insertUpload(
            req.body.title,
            req.body.description,
            req.body.username,
            path
        )
            .then(success => {
                console.log("upload insertion complete");
                res.json({
                    success: true,
                    image: success.rows[0]
                });
            })
            .catch(e => {
                console.log(e);
            });
    } else {
        res.json({
            success: false
        });
        console.log(`upload failure`);
    }
});

app.listen(8080, () => {
    console.log("listening on 8080");
});
