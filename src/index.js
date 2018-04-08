import bodyParser from 'body-parser';
import express from 'express';
import * as logger from 'winston';

import expressValidator from './utilities/validators';
import route from './routes';
import morgan from 'morgan';

const http = require('http');

import session from 'express-session';
import Keycloak from 'keycloak-connect';

let kcConfig = {
    clientId: process.env.AUTH_CLIENT_ID,
    bearerOnly: true,
    serverUrl: process.env.AUTH_URL,
    realm: process.env.AUTH_REALM
};


const app = express();

const port = process.env.PORT || 3001;

app.set('port', port);

const memoryStore = new session.MemoryStore();
const keycloak = new Keycloak({ store: memoryStore }, kcConfig);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator);
app.use(route.allowCrossDomain);
app.use(keycloak.middleware());

app.use('/api/translation', route.allApiRouter(keycloak));


const server = http.createServer(app).listen(app.get('port'), function () {
    logger.info('Listening on port %d', port);
});


process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
process.on('SIGQUIT', shutDown);

let connections = [];

server.on('connection', connection => {
    connections.push(connection);
    connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

function shutDown() {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);

    connections.forEach(curr => curr.end());
    setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
}


module.exports = app;