var http = require("http");
var AWS = require("aws-sdk");
var mu = require("mu2");
var uuid = require("uuid");
var multiparty = require("multiparty");

var s3 = new AWS.S3({
	"region": "us-east-1"
});

var bucket = process.argv[2];
if (!bucket || bucket.length < 1) {
	console.error("Missing S3 bucket. Start with node server.js BUCKETNAME instead.");
	process.exit(1);
}

function listImages(response) {
	var params = {
		Bucket: bucket
	};
	s3.listObjects(params, function(err, data) {
		if (err) {
			console.error(err);
			response.writeHead(500);
			response.end("Internal server error.");
		} else {
			var stream = mu.compileAndRender(
				"index.html", 
				{
					Objects: data.Contents, 
					Bucket: bucket
				}
			);
			stream.pipe(response);
		}
	});
}

function uploadImage(part, response) {
	var params = {
		Body: part,
		Bucket: bucket,
		Key: uuid.v4(),
		ACL: "public-read",
		ContentLength: part.byteCount
	};
	s3.putObject(params, function(err, data) {
		if (err) {
			console.error(err);
			response.writeHead(500);
			response.end("Internal server error.");
		} else {
			response.writeHead(302, {"Location": "/"});
			response.end();
		}
	});
}

function onRequest(request, response) {
	if (request.method === "GET") {			
		listImages(response);
	} else if (request.method === "POST") {
		var form = new multiparty.Form();
		form.on("part", function(part) {
			uploadImage(part, response);
		});
		form.parse(request);
	} else {
		response.writeHead(405);
		response.end("Method not allowed.");
	}
}

http.createServer(onRequest).listen(8080);
console.log("Server started. " +
	"Open http://localhost:8080 with browser.")
