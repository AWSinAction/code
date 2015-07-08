var express = require('express');
var AWS = require('aws-sdk');
var fsm = require('./fsm.js');

var db = new AWS.DynamoDB({
  "region": "us-east-1"
});
var app = express();

function mapImage(item) {
  return {
    "id": item.id.S,
    "version": parseInt(item.version.N, 10),
    "state": item.state.S
  };
}

function getImage(id, cb) {
  var params = {
    "Key": {
      "id": {
        "S": id
      }
    },
    "TableName": "image" // TODO table name?
  };
  db.getItem(params, function(err, data) {
    if (err) {
      cb(err);
    } else {
      if (data.Item) {
        cb(null, mapImage(data.Item));
      } else {
        cb(new Error("image not found"));
      }
    }
  });
}

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

app.put('/image/:id/uploaded', function(request, response) {

});

app.put('/image/:id/processed', function(request, response) {

});

app.put('/image/:id/shared', function(request, response) {

});

app.put('/image/:id/done', function(request, response) {

});

app.put('/image/:id/failed', function(request, response) {

});

app.get('/image/:id', function(request, response) {
  getImage(request.params.id, function(err, image) {
    if (err) {
      throw err;
    } else {
      response.end(image);
    }
  });
});
