var express = require('express');
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var assert = require('assert-plus');
var Caman = require('caman').Caman;
var fs = require('fs');

var lib = require('./lib.js');

var db = new AWS.DynamoDB({
  "region": "us-east-1"
});
var s3 = new AWS.S3({
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

function wrapUpdateItemCallback(response) {
  return function(err, data) {
    if (err) {
       throw err;
    } else {
      response.json(lib.mapImage(data.Attributes));
     }
  };
}

app.get('/', function(request, response) {
  response.json({});
});


app.post('/sqs', function(request, response) {
  assert.string(request.body.imageId, "imageId");
  assert.string(request.body.desiredState, "desiredState");
  getImage(request.body.imageId, function(err, image) {
    if (err) {
      throw err;
    } else {
      if (typeof states[request.body.desiredState] === 'function') {
        states[request.body.desiredState](image, request, response);
      } else {
        throw new Error("unsupported desiredState");
      }
    }
  });
});

var states = {
  "uploaded": uploaded,
  "processed": processed,
  "shared": shared,
  "done": done,
  "failed": failed
};

function uploaded(image, request, response) {
  assert.string(request.body.s3Key, "s3Key");
  var params = {
    "Key": {
      "id": {
        "S": image.id
      }
    },
    "UpdateExpression": "SET #s=:newState, version=:newVersion, rawS3Key=:rawS3Key",
    "ConditionExpression": "attribute_exists(id) AND version=:oldVersion AND #s IN (:stateCreated, :stateUploaded)",
    "ExpressionAttributeNames": {
      "#s": "state"
    },
    "ExpressionAttributeValues": {
      ":newState": {
        "S": "uploaded"
      },
      ":oldVersion": {
        "N": image.version.toString()
      },
      ":newVersion": {
        "N": (image.version + 1).toString()
      },
      ":rawS3Key": {
        "S": request.body.s3Key
      },
      ":stateCreated": {
        "S": "created"
      },
      ":stateUploaded": {
        "S": "uploaded"
      }
    },
    "ReturnValues": "ALL_NEW",
    "TableName": "image"
  };
  db.updateItem(params, wrapUpdateItemCallback(response));
}

function processImage(image, cb) {
  var processedS3Key = 'processed/' + image.id + '-' + Date.now() + '.png';
  var rawFile = './tmp_raw_' + image.id;
  var processedFile = './tmp_processed_' + image.id;
  s3.getObject({
    "Bucket": process.env.ImageBucket,
    "Key": image.rawS3Key
  }, function(err, data) {
    if (err) {
      cb(err);
    } else {
      fs.writeFile(rawFile, data.Body, {"encoding": null}, function(err) {
        if (err) {
          cb(err);
        } else {
          Caman(rawFile, function () {
            this.brightness(10);
            this.contrast(30);
            this.sepia(60);
            this.saturation(-30);
            this.render(function() {
              this.save(processedFile);
              fs.unlink(rawFile, function() {
                fs.readFile(processedFile, {"encoding": null}, function(err, buf) {
                  if (err) {
                    cb(err);
                  } else {
                    s3.putObject({
                      "Bucket": process.env.ImageBucket,
                      "Key": processedS3Key,
                      "ACL": "public-read",
                      "Body": buf,
                      "ContentType": "image/png"
                    }, function(err) {
                      if (err) {
                        cb(err);
                      } else {
                        fs.unlink(processedFile, function() {
                          cb(null, processedS3Key);
                        });
                      }
                    });
                  }
                });
              });
            });
          });
        }
      });
    }
  });
}

function processed(image, request, response) {
  processImage(image, function(err, processedS3Key) {
    if (err) {
      throw err;
    } else {
      var params = {
        "Key": {
          "id": {
            "S": image.id
          }
        },
        "UpdateExpression": "SET #s=:newState, version=:newVersion, processedS3Key=:processedS3Key",
        "ConditionExpression": "attribute_exists(id) AND version=:oldVersion AND #s IN (:stateUploaded, :stateProcessed)",
        "ExpressionAttributeNames": {
          "#s": "state"
        },
        "ExpressionAttributeValues": {
          ":newState": {
            "S": "processed"
          },
          ":oldVersion": {
            "N": image.version.toString()
          },
          ":newVersion": {
            "N": (image.version + 1).toString()
          },
          ":processedS3Key": {
            "S": processedS3Key
          },
          ":stateUploaded": {
            "S": "uploaded"
          },
          ":stateProcessed": {
            "S": "processed"
          }
        },
        "ReturnValues": "ALL_NEW",
        "TableName": "image"
      };
      db.updateItem(params, wrapUpdateItemCallback(response));
    }
  });
}

function shared(image, request, response) {
  var params = {
    "Key": {
      "id": {
        "S": image.id
      }
    },
    "UpdateExpression": "SET #s=:newState, version=:newVersion",
    "ConditionExpression": "attribute_exists(id) AND version=:oldVersion AND #s IN (:stateProcessed, :stateShared)",
    "ExpressionAttributeNames": {
      "#s": "state"
    },
    "ExpressionAttributeValues": {
      ":newState": {
        "S": "shared"
      },
      ":oldVersion": {
        "N": image.version.toString()
      },
      ":newVersion": {
        "N": (image.version + 1).toString()
      },
      ":stateProcessed": {
        "S": "processed"
      },
      ":stateShared": {
        "S": "shared"
      }
    },
    "ReturnValues": "ALL_NEW",
    "TableName": "image"
  };
  db.updateItem(params, wrapUpdateItemCallback(response));
}

function done(image, request, response) {
  var params = {
    "Key": {
      "id": {
        "S": image.id
      }
    },
    "UpdateExpression": "SET #s=:newState, version=:newVersion",
    "ConditionExpression": "attribute_exists(id) AND version=:oldVersion AND #s IN (:stateShared, :stateDone)",
    "ExpressionAttributeNames": {
      "#s": "state"
    },
    "ExpressionAttributeValues": {
      ":newState": {
        "S": "done"
      },
      ":oldVersion": {
        "N": image.version.toString()
      },
      ":newVersion": {
        "N": (image.version + 1).toString()
      },
      ":stateShared": {
        "S": "shared"
      },
      ":stateDone": {
        "S": "done"
      }
    },
    "ReturnValues": "ALL_NEW",
    "TableName": "image"
  };
  db.updateItem(params, wrapUpdateItemCallback(response));
}

function failed(image, request, response) {
  assert.string(request.body.failure, "failure");
  var params = {
    "Key": {
      "id": {
        "S": image.id
      }
    },
    "UpdateExpression": "SET #s=:newState, version=:newVersion, failure=:failure",
    "ConditionExpression": "attribute_exists(id) AND version=:oldVersion AND #s IN (:stateCreated, :stateUploaded, :stateProcessed, :stateShared, :stateFailed)",
    "ExpressionAttributeNames": {
      "#s": "state"
    },
    "ExpressionAttributeValues": {
      ":newState": {
        "S": "failed"
      },
      ":oldVersion": {
        "N": image.version.toString()
      },
      ":newVersion": {
        "N": (image.version + 1).toString()
      },
      ":failure": {
        "S": request.body.failure
      },
      ":stateCreated": {
        "S": "created"
      },
      ":stateUploaded": {
        "S": "uploaded"
      },
      ":stateProcessed": {
        "S": "processed"
      },
      ":stateShared": {
        "S": "shared"
      },
      ":stateFailed": {
        "S": "failed"
      }
    },
    "ReturnValues": "ALL_NEW",
    "TableName": "image"
  };
  db.updateItem(params, wrapUpdateItemCallback(response));
}

app.listen(process.env.PORT || 8080, function() {
  console.log("Worker started. Open http://localhost:8080 with browser.");
});
