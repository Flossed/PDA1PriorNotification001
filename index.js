/* File             : index.js
   Author           : Daniel S. A. Khan
   Copywrite        : Daniel S. A. Khan (c) 2023
   Description      : Main file for PDA1PriorNotification001
   Notes            :
*/

const DOTENV                           = require( 'dotenv' ).config();
const express                          = require( 'express' );
const app                              = express();
const bodyParser                       = require( 'body-parser' );
const cors                             = require('cors');

const genCntrl                         = require( './controllers/generic' );
const Logger                           = require( './services/loggerClass' );
const config                           = require( './services/configuration' );
const EC                               = require( './services/errorCatalog' );
const html5QRcode                      = require( 'html5-qrcode' );

const logFileName                      = config.get( 'application:logFileName' );
const applicationName                  = config.get( 'application:applicationName' );
const logger                           = new Logger( logFileName );

const ApplicationPort                  = process.env.SERVICEENDPOINTPORT;

app.set( 'view engine','ejs' );
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use( express.static( 'public' ) );
app.use(cors());

app.use(function(req, res, next) 
{   res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

function setRouting ()
{   try
   {   const response                 = { ...EC.noError };
        response.body                  = '';
        logger.trace( applicationName + ':index:setRouting:Starting' );
        app.get( '/',genCntrl.main );
        app.get( '/create',genCntrl.main );
        app.post( '/manageActions',genCntrl.main );
        app.get( '/scanQRCode',genCntrl.main );
        app.post( '/manageQRCodeScan',genCntrl.main );
        app.use( '*', genCntrl.main );
        logger.trace( applicationName + ':index:setRouting:Done' );
        return response;
   }
   catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:setRouting:Exception caught: ',ex );
        return response;
    }
}

function initializeServices ()
{   try
   {   logger.trace( applicationName + ':index:initializeServices: Starting' );
       const timeStamp                = new Date();
       const response                 = { ...EC.noError };

       logger.info( '********************************************************************************' );
       logger.info( '*                    Starting ' + applicationName + '                                        *' );
       logger.info( '*                    Time: ' + timeStamp.toLocaleTimeString( 'de-DE' ) + '                                            *' );
       logger.info( '*                    Date: ' + timeStamp.toLocaleDateString( 'de-DE' ) + '                                           *' );
       logger.info( '*                    App listening on port [' + ApplicationPort + ']                              *' );
       logger.info( '********************************************************************************' );

       logger.trace( applicationName + ':index:initializeServices: Done' );
       return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:initializeServices:Exception caught: ',ex );
        return response;
    }
}

function main ()
{   try
   {   logger.trace( applicationName + ':index:main:Starting' );

        const result                   = setRouting();
        if ( result.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:main:setRouting returned errors',result );
            return result;
        }

        logger.debug( applicationName + ':index:main:setRouting is done succesfully' );

        const retVal                  = initializeServices();
        if ( retVal.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:main:initializeServices returned errors',retVal );
            return retVal;
        }

        logger.debug( applicationName + ':index:main:initializeServices is done succesfully' );

        logger.trace( applicationName + ':index:main:Done' );
    }
   catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:main:Exception caught: ',ex );
        return response;
    }
}

module.exports = app.listen( ApplicationPort );
main();

/* LOG:
*/