var express = require('express');
var router = express.Router();
var app = express();

var static_directory =  __dirname + '/public'

console.log(static_directory)

app.use(express.static(static_directory));

app.use("/", router);
app.use(express.urlencoded({
    extended: true
}))

app.listen(8082);
console.log("Listening ... on 8082")
