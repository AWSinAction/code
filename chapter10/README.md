# nodetodo

## schema

### user

	aws dynamodb create-table --table-name todo-user --attribute-definitions AttributeName=uid,AttributeType=S --key-schema AttributeName=uid,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

#### key

* HASH: uid

#### values

* uid: string
* email: string
* phone: string

### todo

	aws dynamodb create-table --table-name todo-task --attribute-definitions AttributeName=uid,AttributeType=S AttributeName=tid,AttributeType=N --key-schema AttributeName=uid,KeyType=HASH AttributeName=tid,KeyType=RANGE --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

#### key: 

* HASH: uid
* RANGE: tid

#### values

* uid: string
* tid: number (time stamp)
* category: string (optional)
* description: string
* due: number (yyyymmdd)
* created: number (yyyymmdd)
* completed: number (yyyymmdd)
