import bodyParser from 'body-parser';
import express from 'express';
import * as logger from 'winston';

import expressValidator from 'express-validator';
import route from './routes';
import morgan from 'morgan';

const http = require('http');

import session from 'express-session';
import Keycloak from 'keycloak-connect';
import * as axios from "axios";
import moment from 'moment';
import helmet from 'helmet';

let kcConfig = {
    clientId: process.env.AUTH_CLIENT_ID,
    bearerOnly: true,
    serverUrl: process.env.AUTH_URL,
    realm: process.env.AUTH_REALM
};

axios.interceptors.request.use(
    (config) => {
        logger.info('Request: [%s] "%s %s"', moment().utc().format('D/MMM/YYYY:HH:mm:ss ZZ'), config.method.toUpperCase(), config.url);
        return config
    },
    (error) => {
        return Promise.reject(error);
    });

axios.interceptors.response.use((response) => {
    logger.info('Response: [%s] "%s %s" %s', moment().utc().format('D/MMM/YYYY:HH:mm:ss ZZ'), response.config.method.toUpperCase(), response.config.url, response.status);
    return response
}, (error) => {
    logger.error('Error: [%s] "%s %s" %s %s',
        moment().utc().format('D/MMM/YYYY:HH:mm:ss ZZ'),
        error.response.config.method.toUpperCase(),
        error.response.config.url,
        error.response.status,
        JSON.stringify(error.response.data)
    );
    return Promise.reject(error);
});


const app = express();

const port = process.env.PORT || 8080;

app.set('port', port);

const memoryStore = new session.MemoryStore();
const keycloak = new Keycloak({store: memoryStore}, kcConfig);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
    name: process.env.SESSION_NAME
}));

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());
app.use(helmet())
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
