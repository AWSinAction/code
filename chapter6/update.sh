#!/bin/bash -ex

INSTANCEIDS=$(aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" --query "Reservations[].Instances[].PublicDnsName" --output text)

for INSTANCEID in $INSTANCEIDS; do
	ssh -t -o StrictHostKeyChecking=no ec2-user@$INSTANCEID "sudo yum -y --security update"
done
