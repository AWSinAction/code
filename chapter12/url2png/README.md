# url2png

Install the dependencies ...

	$ npm install

... and create a S3 bucket

	$ aws s3 mb s3://url2png
  $ aws s3 website s3://url2png --index-document index.html --error-document error.html

... and create a SQS message queue with the help of the AWS CLI

	$ aws sqs create-queue --queue-name url2png
	{
		"QueueUrl": "https://queue.amazonaws.com/878533158213/url2png"
	}

... and run the url2png worker

	$ node worker.js

... open another terminal and start a URL 2 PNG process

	$ node index.js "http://aws.amazon.com/"
	TODO
