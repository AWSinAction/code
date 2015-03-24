var underscore = require('underscore');
var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
	"region": "us-east-1"
});

module.exports = function(cb) {
	ec2.describeVpcs({
		"Filters": [{
			"Name": "isDefault",
			"Values": ["true"]
		}]
	}, function(err, data) {
		if (err) {
			cb(err);
		} else {
			var vpcId = data.Vpcs[0].VpcId;
			ec2.describeSubnets({
				"Filters": [{
					"Name": "vpc-id",
					"Values": [vpcId]
				}]
			}, function(err, data) {
				if (err) {
					cb(err);
				} else {
					cb(null, underscore.map(data.Subnets, function(subnet) {
						return subnet.SubnetId;
					}));
				}
			});
		}
	});
};
