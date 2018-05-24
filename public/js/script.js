(function () {
    Vue.component("comment-modal", {
        template: "#comment-modal",
        props: ["imageid", "nextimgid", "previmgid"],
        data: function () {
            return {
                url: "",
                title: "",
                description: "",
                uploadedAt: "",
                username: "",
                comment: {},
                comments: []
            };
        },
        watch: {
            imageid: function () {
                this.mounter();
            }
        },
        methods: {
            mounter: function () {
                var app = this;
                var queryId = this.imageid;
                axios
                    .get("/commentModal", {
                        params: {
                            id: queryId
                        }
                    })
                    .then(function (response) {
                        console.log("COMMENTMODAL", response);
                        if (response.data.success) {
                            var clone = [...response.data.imageData];
                            app.comments = clone;
                            app.url = response.data.imageData[0].url;
                            app.title = response.data.imageData[0].title;

                            app.description =
                                response.data.imageData[0].description;

                            app.uploadedAt =
                                response.data.imageData[0].createdat;
                            app.username = response.data.imageData[0].username;
                        }
                    })
                    .catch(function (e) {
                        console.log(e);
                    });
            },
            close: function () {
                this.$emit("closemodal");
            },
            commentUpload: function (e) {
                var app = this;
                var comment = {
                    comment: this.comment.comment,
                    username: this.comment.commentusername,
                    imageId: this.imageid
                };
                axios
                    .post("/comment", comment)
                    .then(function (comment) {
                        if (comment.data.success) {
                            var commentclone = comment.data.commentData[0];

                            commentclone.commentusername =
                                commentclone.username;

                            app.comments.unshift(commentclone);
                        }
                    })
                    .catch(function (e) {
                        console.log(e);
                    });
            }
        },
        mounted: function () {
            var app = this;
            window.addEventListener("keyup", function (e) {
                if (e.keyCode === 27) {
                    app.close();
                }
            });

            this.mounter();
        }
    });

    new Vue({
        el: "#main",
        mounted: function () {
            var app = this;
            // axios.get("/polling").then(function (data) {
            //     if (data.data.success) {
            //         app.maxInDb = data.data.max;
            //     }
            // });
            // this.polling();
            addEventListener("hashchange", function () {
                app.detectId();
            });
            ////////KEYLEFTRIGHT///////////////////
            window.addEventListener("keyup", function (e) {
                if (e.keyCode === 39) {
                    location.href = `#${app.nextImageId}`;
                } else if (e.keyCode === 37) {
                    location.href = `#${app.prevImageId}`;
                }
            });
            ///////////////////////////////////
            axios
                .get("/imageboard")
                .then(function (response) {
                    app.lastImgId = response.data.lastImgId;
                    app.picInfo = response.data.data;
                    location.hash && app.detectId();
                })
                .catch(e => {
                    console.log(e);
                });
        },
        methods: {
            ////////////BASIC AUTHEN/////////////////////
            adminAcc: function () {
                var app = this;
                axios
                    .get("/admin")
                    .then(function (data) {
                        if (data.data.success) {
                            app.admin = true;
                            console.log("hes an admin, let him through!");
                        }
                    })
                    .catch(function (e) {
                        console.log(e);
                    });
            },
            adminlogout: function () {
                location.reload();
            },
            //////////////////////////////////////////////////
            polling: function () {
                var app = this;
                setTimeout(function () {
                    axios.get("/polling").then(function (data) {
                        if (data.data.success) {
                            console.log("polling");
                            if (app.maxInDb != data.data.max) {
                                app.maxInDb = data.data.max;
                                app.uploadHappened = true;
                            }
                        }
                    });
                    app.polling();
                }, 5000);
            },
            reloadPage: function () {
                var app = this;
                axios
                    .get("/imageboard")
                    .then(function (response) {
                        app.lastImgId = response.data.lastImgId;
                        app.picInfo = response.data.data;
                        location.hash && app.detectId();
                    })
                    .catch(e => {
                        console.log(e);
                    });
                app.uploadHappened = false;
            },
            detectId: function () {
                let app = this;
                this.currentImageId = location.hash.slice(1);
                console.log(this.currentImageId);
                this.prevImageId = this.picInfo.filter(function (e, i, a) {
                    return a[i + 1] ?
                        a[i + 1].id === Number(app.currentImageId) :
                        e;
                })[0].id;

                this.nextImageId = this.picInfo
                    .filter(function (e, i, a) {
                        return a[i - 1] ?
                            a[i - 1].id === Number(app.currentImageId) :
                            e;
                    })
                    .reverse()[0].id;
            },
            delPic: function (e) {
                var picture = e.target.id;
                var app = this;
                console.log(picture);
                axios
                    .get("/deletePic", {
                        params: {
                            id: picture
                        }
                    })
                    .then(function (response) {
                        if (response.data.success) {
                            location.reload();
                        }
                    })
                    .catch(function (e) {
                        console.log(e);
                    });
            },
            getMore: function () {
                var app = this;
                axios
                    .get("/moreImages", {
                        params: {
                            id: app.lastImgId
                        }
                    })
                    .then(function (response) {
                        if (
                            response.data.morePics ||
                            response.data.morePics != undefined
                        ) {
                            app.morePics = false;
                        }
                        app.lastImgId = response.data.lastImgId;
                        app.picInfo = app.picInfo.concat(response.data.data);
                    })
                    .catch(e => {
                        console.log(e);
                    });
            },
            closeModalMain: function () {
                this.currentImageId = null;
                window.location.hash = "";
            },
            setFile: function (e) {
                this.tooLarge = null;
                this.uploadFile.file = e.target.files[0];
            },
            upload: function () {
                var formData = new FormData();
                var app = this;
                formData.append("file", this.uploadFile.file);
                formData.append("title", this.uploadFile.title);
                formData.append("description", this.uploadFile.description);
                formData.append("username", this.uploadFile.username);
                axios
                    .post("/upload", formData)
                    .then(function (response) {
                        if (response.data.success) {
                            app.maxInDb = response.data.max;
                            app.picInfo.unshift(response.data.image);
                        }
                    })
                    .catch(function (e) {
                        app.tooLarge = true;
                        console.log(e);
                    });
            }
        },
        data: {
            admin: false,
            uploadHappened: false,
            maxInDb: null,
            prevImageId: location.hash.slice(1) - 1,
            nextImageId: null,
            tooLarge: null,
            lastImgId: null,
            morePics: true,
            currentImageId: location.hash.slice(1),
            picInfo: [],
            uploadFile: {}
        }
    });
})();