const bodyParser = require('body-parser');
const express = require('express');
const {existsSync, writeFileSync} = require('fs');
const {forEach} = require('lodash');

const cmd = require('./router/cmd');

// check if files exist, if not, create
forEach(['who.tmp', 'when.tmp'], (file) => {
    if (!existsSync(file)) {
        writeFileSync(file, '');
    }
});

// define app
const app = express();
app.use(bodyParser.json());
app.use('/cmd', cmd);


// start listen
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`server on http://localhost:${port}`);
});