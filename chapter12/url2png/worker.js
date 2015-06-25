var fs = require('fs');
var AWS = require('aws-sdk');
var webshot = require('webshot');
var config = require('./config.json');
var sqs = new AWS.SQS({
	"region": "us-east-1"
});
var s3 = new AWS.S3({
	"region": "us-east-1"
});

function process(body, cb) {
	var file = body.id + '.png';
	webshot(body.url, file, function(err) {
		if (err) {
			cb(err);
		} else {
			fs.readFile(file, function(err, buf) {
				if (err) {
					cb(err);
				} else {
					s3.putObject({
						"Bucket": config.Bucket,
						"Key": file,
						"ACL": "public-read",
						"ContentType": "image/png",
						"Body": buf
					}, function(err) {
						if (err) {
							cb(err);
						} else {
							fs.unlink(file, cb);
						}
					});
				}
			});
		}
	});
}

function receive(cb) {
	sqs.receiveMessage({
		"QueueUrl": config.QueueUrl,
		"MaxNumberOfMessages": 1
	}, function(err, data) {
		if (err) {
			cb(err);
		} else {
			if (data.Messages === undefined) {
				cb();
			} else {
				var message = data.Messages[0];
				var body = JSON.parse(message.Body);
				process(body, function(err) {
					if (err) {
						cb(err);
					} else {
						// TODO delete message
						cb();
					}
				});
			}
		}
	});
}

receive(function(err) {
	if (err) {
		console.log("error", err);
	} else {
		console.log("done");
	}
});
