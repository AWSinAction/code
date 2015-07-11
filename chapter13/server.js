var express = require('express');
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var uuid = require('node-uuid');

var lib = require('./lib.js');

var db = new AWS.DynamoDB({
  "region": "us-east-1"
});
var app = express();
app.use(bodyParser.json());

function getImage(id, cb) {
  var params = {
    "Key": {
      "id": {
        "S": id
      }
    },
    "TableName": "image"
  };
  db.getItem(params, function(err, data) {
    if (err) {
      cb(err);
    } else {
      if (data.Item) {
        cb(null, lib.mapImage(data.Item));
      } else {
        cb(new Error("image not found"));
      }
    }
  });
}

app.get('/', function(request, response) {
  response.json({});
});

app.post('/image', function(request, response) {
  var id = uuid.v4();
  var params = {
    "Item": {
      "id": {
        "S": id
      },
      "version": {
        "N": "0"
      },
      "created": {
        "N": Date.now().toString()
      },
      "state": {
        "S": "created"
      }
    },
    "TableName": "image",
    "ConditionExpression": "attribute_not_exists(id)"
  };
  db.putItem(params, function(err) {
    if (err) {
      throw err;
    } else {
      response.redirect('/image/' + id);
      response.end();
    }
  });
});

app.get('/image/:id', function(request, response) {
  getImage(request.params.id, function(err, image) {
    if (err) {
      throw err;
    } else {
      response.json(image);
    }
  });
});

app.listen(process.env.PORT || 8080, function() {
  console.log("Server started. Open http://localhost:8080 with browser.");
});
