var underscore = require('underscore');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
	"region": "us-east-1"
});

module.exports = function(cb) {
	ec2.describeImages({
		"Filters": [{
			"Name": "description",
			"Values": ["Amazon Linux AMI 2014.09.? x86_64 HVM EBS"]
		}]
	}, function(err, data) {
		if (err) {
			cb(err);
		} else {
			cb(null, underscore.map(data.Images, function(image) {
				return image.ImageId + ": " + image.Description;
			}));
		}
	});
};
