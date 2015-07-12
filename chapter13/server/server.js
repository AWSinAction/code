var express = require('express');
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var multiparty = require('multiparty');

var lib = require('./lib.js');

var db = new AWS.DynamoDB({
  "region": "us-east-1"
});
var sqs = new AWS.SQS({
  "region": "us-east-1"
});
var s3 = new AWS.S3({
  "region": "us-east-1"
});

var app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

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

function uploadImage(image, part, response) {
  var rawS3Key = 'upload/' + image.id + '-' + Date.now();
  var params = {
    "Bucket": process.env.ImageBucket,
    "Key": rawS3Key,
    "Body": part,
    "ContentLength": part.byteCount
  };
  s3.putObject(params, function(err, data) {
    if (err) {
      throw err;
    } else {
      sqs.sendMessage({
        "MessageBody": JSON.stringify({"imageId": image.id, "desiredState": "uploaded", "s3Key": rawS3Key}),
        "QueueUrl": process.env.ImageQueue,
      }, function(err) {
        if (err) {
          throw err;
        } else {
          response.redirect('/#view=' + image.id);
          response.end();
        }
      });
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
  db.putItem(params, function(err, data) {
    if (err) {
      throw err;
    } else {
      response.json({"id": id, "state": "created"});
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

app.post('/image/:id/upload', function(request, response) {
  getImage(request.params.id, function(err, image) {
    if (err) {
      throw err;
    } else {
      var form = new multiparty.Form();
      form.on('part', function(part) {
        uploadImage(image, part, response);
      });
      form.parse(request);
    }
  });
});

app.listen(process.env.PORT || 8080, function() {
  console.log("Server started. Open http://localhost:8080 with browser.");
});
