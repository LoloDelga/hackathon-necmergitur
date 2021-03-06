/**
 * Fork from https://github.com/jdesboeufs/necmergitur-erp
 */

module.exports = function(){
const load = require('./import');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const morgan = require('morgan');
const cors = require('cors');
const bboxPolygon = require('turf-bbox-polygon');

const mongoConnection = MongoClient.connect(process.env.MONGODB_URL || 'mongodb://mongo/necmergitur-erp');
const app = express();

if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy');
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

app.use(cors());

// Inject MongoDB db instance
app.use(function injectMongoDBDatabaseInstance(req, res, next) {
    mongoConnection.then(db => {
        req.db = db;
        next();
    }).catch(next);
});

//app.get('/erp', function (req, res, next) {
app.get('/', function (req, res, next) {
    if (!req.query.bbox) return res.status(400).send({ code: 400, message: 'No bbox provided' });
    req.db.collection('erp').find({
        position: {
            $geoWithin: {
                $geometry: bboxPolygon(req.query.bbox.split(',').map(coord => parseFloat(coord))).geometry
            }
        }
    }).toArray().then(function (results) {
        res.send(results);
    }).catch(next);
});
app.get('/import',function(req,res){
    load(function(err){
        if (err){
            res.status(500).json(err);
        } else {
            res.end("ok");
        }
    })
})
// app.get('/evacmaps', require('./controllers/evacmaps').geo);

//app.listen(process.env.PORT || 5000);
return app

};