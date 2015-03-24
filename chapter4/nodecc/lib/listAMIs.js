var jmespath = require('jmespath');
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
			var amiIds = jmespath.search(data, 'Images[*].ImageId');
			var descriptions = jmespath.search(data, 'Images[*].Description');
			cb(null, {"amiIds": amiIds, "descriptions": descriptions});
		}
	});
};
