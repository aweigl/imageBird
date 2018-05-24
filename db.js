var spicedPg = require("spiced-pg");
var db;

if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    db = spicedPg("postgres:postgres:postgres@localhost:5432/imageboard");
}

exports.getImages = () => {
    return db.query("SELECT * FROM images ORDER BY id DESC LIMIT 8");
};

exports.getMoreImages = lastImgId => {
    return db.query(
        "SELECT * FROM images WHERE id<$1 ORDER BY id DESC LIMIT 8",
        [lastImgId]
    );
};

exports.insertUpload = (title, desc, username, filename) => {
    return db.query(
        "INSERT INTO images (title, description, username, url) VALUES ($1,$2,$3,$4) RETURNING *",
        [title, desc, username, filename]
    );
};

exports.commentModal = id => {
    return db.query(
        "SELECT images.id AS id, images.url AS url, images.username AS username, images.title AS title, images.description AS description, images.created_at AS createdat, comments.comment AS comment, comments.created_at AS commentcreated, comments.username AS commentusername, comments.image_id AS commentimageid FROM images LEFT OUTER JOIN comments ON images.id = comments.image_id WHERE images.id=$1 ORDER BY comments.created_at DESC",
        [id]
    );
};

exports.commentInsert = (comment, username, image_id) => {
    return db.query(
        "INSERT INTO comments (comment, username, image_id) VALUES ($1,$2,$3) RETURNING *",
        [comment, username, image_id]
    );
};

exports.delPicture = imageid => {
    return db.query("DELETE FROM images WHERE id=$1 RETURNING created_at", [
        imageid
    ]);
};

exports.polling = () => {
    return db.query("SELECT MIN(id) as min, MAX(id) AS max FROM images");
};
