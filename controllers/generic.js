/* File             : generic.js
   Author           : Daniel S. A. Khan
   Copywrite        : Daniel S. A. Khan (c) 2023
   Description      :
   Notes            :

*/
/* ------------------     External Application Libraries      -----------------*/
/* ------------------ End External Application Libraries      -----------------*/

/* --------------- External Application Libraries Initialization --------------*/
/* ----------- End External Application Libraries Initialization --------------*/

/* ------------------------------------- Controllers --------------------------*/
/* -------------------------------- End Controllers ---------------------------*/

/* ------------------------------------- Services -----------------------------*/
const Logger                            = require( '../services/loggerClass' );
const config                            = require( '../services/configuration' );
const EC                                = require( '../services/errorCatalog' );
const eudcc                             = require( '../services/eudcc' );
const { Console } = require('winston/lib/winston/transports');
/* -------------------------------- End Services ------------------------------*/

/* ------------------------------------- Models -------------------------------*/
/* -------------------------------- End Models --------------------------------*/

/* ---------------------------------  Application constants    ----------------*/
const logFileName                       = config.get( 'application:logFileName' );
const applicationName                   = config.get( 'application:applicationName' );
/* --------------------------------- End Application constants ----------------*/

/* --------------- Internal Application Libraries Initialization --------------*/
const logger                            = new Logger( logFileName );
/* ----------- End Internal Application Libraries Initialization --------------*/

/* ----------------------------- Private Functions   --------------------------*/


async function unknownHandler ( req,res )
{   try
    {   logger.trace( applicationName + ':generic:unknownHandler():Started' );
        res.render( 'unknown' );
        logger.error( applicationName + ':generic:unknownHandler():Unknown Path:[' + req.originalUrl + '].' ); 
        logger.trace( applicationName + ':generic:unknownHandler():Done' );
    }
    catch ( ex )
    {   logger.exception( applicationName + ':generic:unknownHandler():An exception occurred :[' + ex + '].' );
    }
}

async function aboutHandler ( req,res )
{   try
    {   logger.trace( applicationName + ':generic:aboutHandler():Started' );
        
        res.render( 'about' );
        logger.trace( applicationName + ':generic:aboutHandler():Done' );
    }
    catch ( ex )
    {   logger.exception( applicationName + ':generic:aboutHandler():An exception occurred :[' + ex + '].' );
    }
}
 

async function homeHandler ( req,res )
{   try
    {   logger.trace( applicationName + ':generic:homeHandler():Started' );
        res.render( 'main' );
        logger.trace( applicationName + ':generic:homeHandler():Done' );
    }
    catch ( ex )
    {   logger.exception( applicationName + ':generic:homeHandler():An exception occurred :[' + ex + '].' );
    }
}

async function actionsHandler ( req,res )
{   try
    {   logger.trace( applicationName + ':generic:actionsHandler():Started' );

        if ( typeof req.route.methods.post !== 'undefined' )
        {   console.log( 'POST action:[' + req.body.actie + '].' );
            switch(req.body.actie)
            {   case 'createData'   :   console.log( 'Create action' );
                                        eudcc.JSON2QR();
                                        break; 	
                case 'verifyData'   :   console.log( 'Create action' );
                                        break;
                default             : console.log( 'Unknown action' );
                                        break;
            }
        }
        res.render( 'actions' );
        logger.trace( applicationName + ':generic:actionsHandler():Done' );
    }
    catch ( ex )
    {   logger.exception( applicationName + ':generic:actionsHandler():An exception occurred :[' + ex + '].' );
    }
}

async function QRCodeScannner ( req,res )
{   try
    {   logger.trace( applicationName + ':generic:QRCodeScannner():Started' );
        let PDA1PN = null;
        if( req.route.methods.post  !== 'undefined' )
        {   const retval = await eudcc.QR2JSON(req.body.decodedQRCode);
            PDA1PN         = retval.body;
            res.render( 'scanQRCode', {  PDA1PN : PDA1PN  } );
        }
        else
        {    res.render( 'scanQRCode')  ;
        } 
        logger.trace( applicationName + ':generic:QRCodeScannner():Done' );
    }
    catch ( ex )
    {   logger.exception( applicationName + ':generic:QRCodeScannner():An exception occurred :[' + ex + '].' );
    }
}

/* -------------------------- End Private Functions   ------------------------*/

 
/* --------------------------- Public Functions   ----------------------------*/
async function main ( req, res )
{   try
    {   logger.trace( applicationName + ':generic:main():Started' ); 
        switch ( req.originalUrl )
        {  case '/'                    : homeHandler( req,res );
                                         break;
           case '/create'              : actionsHandler( req,res );
                                         break;
           case '/about'               : aboutHandler( req,res );
                                         break;
           case '/manageActions'       : actionsHandler( req,res );
                                         break; 
           case '/scanQRCode'          : QRCodeScannner( req,res );
                                         break;
           case '/manageQRCodeScan'    : QRCodeScannner( req,res );
                                         break;
           default            :          unknownHandler( req,res );
                                         break;
        }
        logger.trace( applicationName + ':generic:main():Done' );
    }
    catch ( ex )
    {   logger.exception( applicationName + ':generic:main():An exception occurred: [' + ex + '].' );
    }
}
/* ----------------------------- End Public Functions   ------------------------*/

/* ----------------------------------External functions ------------------------*/
module.exports.main                     = main;
/* ----------------------------------End External functions --------------------*/
/* LOG:
*/
