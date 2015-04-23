#!/bin/bash -ex

vpc=$(aws ec2 describe-vpcs --query Vpcs[0].VpcId --output text)
aws cloudformation create-stack --stack-name irc --template-url https://s3.amazonaws.com/awsinaction/chapter5/irc-cloudformation.json ParameterKey=VPC,ParameterValue=$vpc
