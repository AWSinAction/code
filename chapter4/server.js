// npm install aws-sdk
// node server.js

var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({
	"region": "us-east-1"
});

step1GetAmiId();

function step1GetAmiId() {
	ec2.describeImages({
		"Filters": [{
			"Name": "description",
			"Values": ["Amazon Linux AMI 2014.09.2 x86_64 HVM EBS"]
		}]
	}, function(err, data) {
		if (err) {
			throw err;
		} else {
			step2GetVpcId(data.Images[0].ImageId);
		}
	});
}

function step2GetVpcId(amiId) {
	ec2.describeVpcs({
		"Filters": [{
			"Name": "isDefault",
			"Values": ["true"]
		}]
	}, function(err, data) {
		if (err) {
			throw err;
		} else {
			step3GetSubnetId(amiId, data.Vpcs[0].VpcId);
		}
	});
}

function step3GetSubnetId(amiId, vpcId) {
	ec2.describeSubnets({
		"Filters": [{
			"Name": "vpc-id",
			"Values": [vpcId]
		}]
	}, function(err, data) {
		if (err) {
			throw err;
		} else {
			step4CreateSecurityGroup(amiId, vpcId, data.Subnets[0].SubnetId);
		}
	});
}

function step4CreateSecurityGroup(amiId, vpcId, subnetId) {
	ec2.createSecurityGroup({
		"Description": "My security group",
		"GroupName": "mysecuritygroup",
		"VpcId": vpcId
	}, function(err, data) {
		if (err) {
			throw err;
		} else {
			var groupId = data.GroupId;
			ec2.authorizeSecurityGroupIngress({
				"GroupId": groupId,
				"IpProtocol": "tcp",
				"FromPort": 22,
				"ToPort": 22,
				"CidrIp": "0.0.0.0/0"
			}, function(err, data) {
				if (err) {
					throw err;
				} else {
					step5CreateServer(amiId, vpcId, subnetId, groupId);
				}
			});
		}
	});
}

function step5CreateServer(amiId, vpcId, subnetId, groupId) {
	ec2.runInstances({
		"ImageId": amiId,
		"MinCount": 1,
		"MaxCount": 1,
		"KeyName": "mykey",
		"InstanceType": "t2.micro",
		"SecurityGroupIds": [groupId],
		"SubnetId": subnetId
	}, function(err, data) {
		if (err) {
			throw err;
		} else {
			var instanceId = data.Instances[0].InstanceId;
			console.log('waiting for ' + instanceId + ' ...');
			ec2.waitFor('instanceRunning', {
				"InstanceIds": [instanceId]
			}, function(err) {
				if (err) {
					throw err;
				} else {
					ec2.describeInstances({
						"InstanceIds": [instanceId]
					}, function(err, data) {
						if (err) {
							throw err;
						} else {
							var publicName = data.Reservations[0].Instances[0].PublicDnsName;
							console.log(instanceId + ' is accepting SSH connections under ' + publicName);
							console.log('ssh -i mykey.pem ec2-user@' + publicName);
							step6Wait(groupId, instanceId);
						}
					});
				}
			});
		}
	});
}

function step6Wait(groupId, instanceId) {
	console.log('Press [Enter] key to terminate ' + instanceId + ' ...');
	process.stdin.setEncoding('utf8');
	function listener() {
		var chunk = process.stdin.read();
		if (chunk !== null && chunk.indexOf('\n') !== -1) {
			process.stdin.removeListener('readable', listener);
			step7DestroyServer(groupId, instanceId) ;
		}
	}
	process.stdin.on('readable', listener);
}

function step7DestroyServer(groupId, instanceId) {
	ec2.terminateInstances({
		"InstanceIds": [instanceId]
	}, function(err) {
		if (err) {
			throw err;
		} else {
			console.log('terminating ' + instanceId + ' ...');
			ec2.waitFor('instanceTerminated', {
				"InstanceIds": [instanceId]
			}, function(err) {
				if (err) {
					throw err;
				} else {
					step8DeleteSecurityGroup(groupId);
				}
			});
		}
	});
}

function step8DeleteSecurityGroup(groupId) {
	ec2.deleteSecurityGroup({
		"GroupId": groupId
	}, function(err) {
		if (err) {
			throw err;
		} else {
			console.log("done.");
			process.exit(0);
		}
	});
}
