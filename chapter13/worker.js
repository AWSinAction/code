var express = require('express');
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var assert = require('assert-plus');

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
      // TODO
      response.json(request.body);
    }
  });
});

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

function processed(image, request, response) {
  assert.string(request.body.s3Key, "s3Key");
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
        "S": request.body.s3Key
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
