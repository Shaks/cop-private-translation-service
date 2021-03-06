import {createLogger, format, transports} from 'winston';
import Tracing from '../utilities/tracing.js';

const { combine, timestamp, json, splat, printf} = format;

const addCorrelationId = format((info) => {
    info.correlationId = Tracing.correlationId();
    return info;
});

const logger = createLogger({
    format: combine(
        timestamp(),
        splat(),
        addCorrelationId(),
        json()
    ),
    transports: [
        new transports.Console(),
    ],
    exitOnError: false,
});


export default logger;
