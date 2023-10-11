/*
   1. read a JSON schema
   2. generate a JSON document from the schema
   3. validate the JSON document against the schema
   4. write the JSON document to a file
   5. transform JSON file to CBOR file
   6. create singing tree with X509 certificates
   7. Sign the CBOR file with a private key as COSE_Sign1
   8. Write the COSE_Sign1 file to a file
   9. base 45 encode the COSE_Sign1 file
   10. zlib compress the base 45 encoded COSE_Sign1 file
   11. Transform the zlib file to a QR code
*/
require( 'dotenv' ).config();
const base45                           = require( 'base45' );
const zlib                             = require( 'zlib' );
const fs                               = require( 'fs/promises' );
const cbor                             = require( 'cbor' );

const Logger                           = require( './services/loggerClass' );
const config                           = require( './services/configuration' );
const EC                               = require( './services/errorCatalog' );

const Validator                        = require( 'jsonschema' ).Validator;
const $RefParser                       = require( '@apidevtools/json-schema-ref-parser' );

const QRCode                           = require( 'qrcode' );
const PNGReader                        = require( 'png.js' );
const genCntrl                         = require( './controllers/generic' );
const express                          = require( 'express' );
const ejs                              = require( 'ejs' );
const bodyParser                       = require( 'body-parser' );
const cors                                = require('cors');



const { start } = require( 'repl' );
// eslint-disable-next-line no-undef
const FileName                         = process.env.PDA1ACKNOWLEDGEMENTSCHEMA;
// eslint-disable-next-line no-undef
const dataSet                          = process.env.PDA1DATASET;
const outputJson                       = process.env.OUTPUTJSON;
const zlibbed                          = process.env.ZLIBBED;
const qrCodeFile                       = process.env.QRCODEFILE;
const ApplicationPort                  = process.env.SERVICEENDPOINTPORT;
let   jsonDocument                     = ' ';
let   lastSeqNo                        = 0;
const logFileName                      = config.get( 'application:logFileName' );
const applicationName                  = config.get( 'application:applicationName' );
const logger                           = new Logger( logFileName );

const app                              = express();
app.set( 'view engine','ejs' );
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use( express.static( 'public' ) );
app.use(cors());





app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });


const introductionTextArt = ( '\n\n\n\n\n\n\nHello and welcome to the world of JSON schema and data generation.\n' +
                                'This application will :\n' +
                                '  1. read a JSON schema\n' +
                                '  2. generate a JSON document from the schema\n' +
                                '  3. validate the JSON document against the schema\n' +
                                '  4. write the JSON document to a file\n' +
                                '  5. transform JSON file to CBOR file\n' +
                                '  6. create singing tree with X509 certificates\n' +
                                '  7. Sign the CBOR file with a private key as COSE_Sign1\n' +
                                '  8. Write the COSE_Sign1 file to a file\n' +
                                '  9. base 45 encode the COSE_Sign1 file\n' +
                                ' 10. zlib compress the base 45 encoded COSE_Sign1 file\n' +
                                ' 11. Transform the zlib file to a QR code\n' +

                                '                                  *+=+: :+%%+..*+:+:.                 .             \n' +
                                '                             .%+-*:+*-=%=: :-+=+.+*--  --..                         \n' +
                                '                          -*@-*#%+::-@@=+..-=%=-.  :=*:   .:...                     \n' +
                                '                       .@#%=*=%+-*=%*- .-+=+:.-+-:..-+:.  :+:  .                    \n' +
                                '                     .@%=*=#%=+:*##%*:  =@%+:  *%=+. . ++: .   .:: :                \n' +
                                '                   @###%++#@%=*::%%=+.  +=*-.  +%=-.   -+.    :-..  :               \n' +
                                '                  #%%#%%*.:=*--..+=+. .:*=*-.  :*+:   .+:     .:  ... .             \n' +
                                '                 ##%==*--:+@@%%======***=@%+  .-::-. ....  . ...     . ::           \n' +
                                '                @#%*:+@##@@@%%=.*===*******+:.:--:::..::-:.           - ..          \n' +
                                '               #%*+*=#####%%%%%%+===*****+++----:::...-.    .        .   .          \n' +
                                '               @#**######@@%%%======*****+++----:::.....          ..  .. ..         \n' +
                                '              #@*-*######@@%%======*****+++----::::......         ...:-. ..         \n' +
                                '              #%*-%#####@@%%=======****++++----::::......         ..:-=*: .         \n' +
                                '             .#=+*@####@@%%%=***===***++++-----::::..   ...       ..:.+-. .         \n' +
                                '              @@==#####@%%*-+%=-+%=***+-*=+:---::::.   ..-:.      ..:    . :        \n' +
                                '              #%*%###@@%=+=%==*++++**%%@%=*-. ..::::.:+-:.:+..    ..:: : . .        \n' +
                                '            :##*+##@%%%====**++--::=#@====+:     ..+*++-::.. .:   ..::   ...        \n' +
                                '            #+*%+##@@@%%%===*++-:  :@*+.*-.   -:  +%%*+--:...     ..:-.  .          \n' +
                                '            #===###@@%%===**++:.  :====*++--::-:..:@%*+--::...      .:-...  .       \n' +
                                '            :@=####@%%==**+-:      -+***++:.      .+=*++---:..       .:...:.:       \n' +
                                '            #@####@@%%=**+-::.::--. :#%*++-:.   *+%%=%%=*+--:.        .: ::         \n' +
                                '            #@###@@%%==***++----+++..:=..::.   -@@***==*+--:..        .:.. :        \n' +
                                '           #@%###@%%%===**+++----+**..-+::+++-=@%++***++--::.          ... :        \n' +
                                '          ##@%##@@%%%==****++++-+*==+ ==*+-::-%*::++++--::...          ...  :       \n' +
                                '         ##@%%@@@@%%===****++++--+===+::*++++*. .:-----:....          .: :   :      \n' +
                                '         ##@%=*%%%%===***++++++--++***++---:.  .::-::::....          .: ::   .      \n' +
                                '         -@%=*+:====**+++++++-----+++++---:.............            .:.++:    :     \n' +
                                '           =*-:. :***+++-----------+++---::........                ..-+--.          \n' +
                                '               -=%@#*++---------------::::..                       -++-:.           \n' +
                                '                @%=#@@@%----:::::::::.....                     .    ..              \n' +
                                '              #@%==@#@%=*:*%%%=====**+++--::::..   ..     .*+:.. . :. .:            \n' +
                                '             #@%%==*#@%%=+:=@%%==**++++---**+++--::::.. .-*+:..   -:. .:.           \n' +
                                '            #@@%=**+*#@%%=+ %@%===***++--++*+++--:::.. .+*-:..   :-:.  .:           \n' +
                                '           @#@%==*+--+#@%%%+.@%%==***++--+++++---:....:+*-...   ---:.. ..:          \n' +
                                '           @%==+++----*#@%%%-.%%%==**++--+*++---:...:-**.     :**+-::. ..:          \n' +
                                '         :#%****+----++-#@%%%*.%%==**+++-++++---::.:*=+.     +%=**+-:.  .::         \n' +
                                '         ##@@@%%==*+-:..:#@@%%=.===*+#@==*-..:::::-=*..  . :**++-::. :....:         \n' +
                                '         ####@@@%===**+++---%%%%::=*##@%*-:  .::+=*...:+=**+-:... ..      .:        \n' +
                                '         #####@@@%%%====****-:...-.+=***.**-:.:.+++*===*:--:.             .:        \n' +
                                '         ######@@@@%%=%%=::**@%==*++-:.  =%++-:::::...:+**-..             .:        \n' +
                                '         #####@@@%@@@%- .:=#@=+.   .-*@* %*..:::.:--:.   .=+-..          ..-        \n' +
                                '        #####@@@@@%*.   :%#@%*-.   -@#%: @=-.: -**==+:     **-. .      ....:        \n' +
                                '       @#%@@@%*-: .   -+=@@%%=**+--*%*-  =%+:. :+*=+:       **+-:  .    ..::        \n' +
                                '      #%=*=========*-:::-*=******++-.    *-*+--:::.          =*+-:.        .-       \n' +
                                '    @+=*%@@@@@%*-:-+++==*++**@***:-. .-==*-+++:      .....*%-..==-:...    .: .      \n' +
                                '   %+-@=****+*==%%%%====**+--*=%+==. *@@%=+-::...--+***+-.:+=%+: --:::.   .. *==+:  \n' +
                                '  ##@=:.+#@###@@@%%%%=****====**@.  :%@%%=+----::--+***+--:.+*:  .::  .    ..*+-*.: \n' +
                                ' %#@@@%+.:@@@%#@%=*:+====%=**=%.   -==**--.--::::::-----::.:=*-:....      .*%+  :.: \n' +
                                ' ##@@%%=*:.*###%%=**+- =**%*     @%==**++-:.  .....:::::-=%=-:.    .     -=%.   ..: \n' +
                                ' ##@%%===+*##@@*@=**++-: :     @%%====+.=-..    +-::--.%%*+-::.  .   . .-%+     ::. \n' +
                                '  @@%=+=%*%##@@-@=*++---:  -.#@%%====*-.=-.      --:*%%=*++-:.   .   .:==.      ..  \n' +
                                '  @@%=-%**=#@@%-@=++--:.:  .#@%%%%===+.-*:.       .=@==**+-:..   .   .: .           \n' +
                                '   =%*+=***@@@%-%=+---..-  .=@%%%===*+ ++:.        +===-*::...        .        ..   \n' +
                                '     *.:+++*%%=+*=++-: +.  .=@%=%==*+- +-..       .+===- +:..       .:        ..    \n' +
                                '             =+*-%+-: .-   .*@%%***+-- *:.        :***+-..:.       ...       ..    \n' );


const introductionText = ( '\n\n\n\n\n\n\nHello and welcome to the world of JSON schema and data generation.\n' +
                                'This application will :\n' +
                                '  1. read a JSON schema\n' +
                                '  2. generate a JSON document from the schema\n' +
                                '  3. validate the JSON document against the schema\n' +
                                '  4. write the JSON document to a file\n' +
                                '  5. transform JSON file to CBOR file\n' +
                                '  6. create singing tree with X509 certificates\n' +
                                '  7. Sign the CBOR file with a private key as COSE_Sign1\n' +
                                '  8. Write the COSE_Sign1 file to a file\n' +
                                '  9. base 45 encode the COSE_Sign1 file\n' +
                                ' 10. zlib compress the base 45 encoded COSE_Sign1 file\n' +
                                ' 11. Transform the zlib file to a QR code\n' );


/*
function generateRandomString ( stringDef )
{   try
    {   logger.trace( applicationName + ':index:generateRandomString:Starting' );

        if ( typeof stringDef === 'undefined' || stringDef === null )
        {   logger.error( applicationName + ':index:generateRandomString:incorrect input parameters' );
            const response             = EC.badRequest;
            return response;
        }

        let maxStringLength            = 10000;
        let tempString                 = '';

        if ( typeof stringDef.maxLength === 'number' )
        {   maxStringLength            = stringDef.maxLength;
        }
        for ( let i = 0; i < maxStringLength; i++ )
        {    tempString                = tempString.concat( String.fromCharCode( Math.round( Math.random() * ( 122 - 97 ) + 97 ) ) );
        }
        logger.trace( applicationName + ':index:generateRandomString:Ending' );
        const response                 = { ... EC.noError};
        response.body                  = tempString;
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:generateRandomString:Exception caught: ',ex );
        return response;
    }
}

function getJSONSchema ( fileName )
{   try
    {   logger.trace( applicationName + ':index:getJSONSchema:Starting' );

        if ( typeof fileName === 'undefined' || fileName === null )
        {   logger.error( applicationName + ':index:getJSONSchema:incorrect input parameters' );
            const response             = EC.badRequest;
            return response;
        }

        const schema                   = require( fileName );
        const response                 = { ... EC.noError};
        response.body                  = schema;
        logger.trace( applicationName + ':index:getJSONSchema:Ending' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:getJSONSchema:Exception caught : ',ex );
        return response;
    }
}



function insertObject ( schema, object, data )
{   try
    {   logger.trace( applicationName + ':index:insertObject:Starting' );

        if ( schema === null || typeof schema === 'undefined' || object === null || typeof object === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':index:insertObject:incorrect input parameters' );
            return EC.badRequest;
        }

        const lastStringChar             = jsonDocument[jsonDocument.length - 1 ];


        if ( lastStringChar === '{' )
        {   jsonDocument               = jsonDocument.concat( '"' );
        }
        else
        {   jsonDocument               = jsonDocument.concat( ',"' );
        }
        jsonDocument                   = jsonDocument.concat( object[0],'"', ': ' );
        jsonDocument                   = jsonDocument.concat( '{' );

        const retVal                   = traverseObject( schema, object[1].properties,data );
        if ( retVal.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:insertObject:traverseObject returned errors',retVal );
            return retVal;
        }

        jsonDocument                   = jsonDocument.concat( '}' );
        logger.trace( applicationName + ':index:insertObject:Ending' );
        return EC.noError;

    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':index:insertObject:Exception caught: ',ex );
        return response;
    }
}



function insertString ( schema, object, items )
{   try
    {   logger.trace( applicationName + ':index:insertString:Starting' );

        if ( schema === null || typeof schema === 'undefined' || object === null || typeof object === 'undefined' )
        {   logger.error( applicationName + ':index:insertString:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        let lastStringChar;

        for ( let i = 0; i < items.length; i++ )
        {   if ( items[i][0] === object[0] )
            {   const arrayObjects   = Object.entries( items[i][1] )[0][1];
                const randomIndex    = Math.floor( Math.random() * ( arrayObjects.length ) );
                lastStringChar     = jsonDocument[jsonDocument.length - 1 ];
                if ( lastStringChar === '{' )
                {   jsonDocument   = jsonDocument.concat( '"' );
                }
                else
                {   jsonDocument   = jsonDocument.concat( ',"' );
                }
                jsonDocument       = jsonDocument.concat( object[0],'"', ': ' );
                jsonDocument       = jsonDocument.concat( '"',arrayObjects[randomIndex],'"' );
                return EC.noError;
            }
        }


        lastStringChar                 = jsonDocument[jsonDocument.length - 1 ];

        if ( lastStringChar === '{' )
        {   jsonDocument               = jsonDocument.concat( '"' );
        }
        else
        {   jsonDocument               = jsonDocument.concat( ',"' );
        }
        jsonDocument                   = jsonDocument.concat( object[0],'"', ': ' );

        if ( typeof object[1].maxLength === 'number' )
        {   const retVal               =  generateRandomString( object[1] );
            if ( retVal.returnCode !== EC.noError.returnCode )
            {   logger.error( applicationName + ':index:insertString:generateRandomString returned errors',retVal );
                return retVal;
            }
            jsonDocument               = jsonDocument.concat( '"', retVal.body, '"' );

        }
        logger.trace( applicationName + ':index:insertString:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':index:insertString:Exception caught: ',ex );
        return response;
    }
}


function insertNumber ( schema, object )
{   try
    {   logger.trace( applicationName + ':index:insertNumber:Starting' );

        if ( schema === null || typeof schema === 'undefined' || object === null || typeof object === 'undefined' )
        {   logger.error( applicationName + ':index:insertNumber:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        let seqNo                      = 0;
        const lastStringChar           = jsonDocument[jsonDocument.length - 1 ];

        if ( lastStringChar === '{' )
        {   jsonDocument               = jsonDocument.concat( '"' );
        }
        else
        {   jsonDocument               = jsonDocument.concat( ',"' );
        }
        jsonDocument                   = jsonDocument.concat( object[0],'"', ': ' );

        if ( object[0] === 'seqno' )
        {   seqNo                      = lastSeqNo + 1 ;
            lastSeqNo                  = seqNo;
        }
        else
        {  seqNo                       = Math.floor( Math.random() * 10 );
        }
        jsonDocument                   = jsonDocument.concat( seqNo.toString() );

        logger.trace( applicationName + ':index:insertNumber:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':index:insertNumber:Exception caught: ',ex );
        return response;
    }
}


function insertRandomAmountOfNationlities ( schema, item )
{   try
    {   logger.trace( applicationName + ':index:insertRandomAmountOfNationlities:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' )
        {   logger.error( applicationName + ':index:insertRandomAmountOfNationlities:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const nationalityArray         = item[1].items.enum;
        const randomIndex              = Math.floor( Math.random() * ( nationalityArray.length - 1 ) );
        let lastStringChar             = jsonDocument[jsonDocument.length - 1 ];
        if ( lastStringChar === '{' )
        {   jsonDocument               = jsonDocument.concat( '"' );
        }
        else
        {   jsonDocument               = jsonDocument.concat( ',"' );
        }
        jsonDocument                   = jsonDocument.concat( item[0],'"', ':[' );
        for ( let i = 0; i < randomIndex; i++ )
        {   lastStringChar             = jsonDocument[jsonDocument.length - 1 ];
            if ( lastStringChar === '[' )
            {   jsonDocument           = jsonDocument.concat( '"' );
            }
            else
            {   jsonDocument           = jsonDocument.concat( ',"' );
            }
            jsonDocument = jsonDocument.concat( nationalityArray[i],'"' );
        }
        jsonDocument                   = jsonDocument.concat( ']' );
        logger.trace( applicationName + ':index:insertRandomAmountOfNationlities:Ending' );
        return EC.noError;
     }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':index:insertRandomAmountOfNationlities:Exception caught: ',ex );
        return response;
    }
}


function insertEmployerSelfEmployedActivityCodes ( schema, item )
{   try
    {   logger.trace( applicationName + ':index:insertEmployerSelfEmployedActivityCodes:Starting' );
        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' )
        {   logger.error( applicationName + ':index:insertEmployerSelfEmployedActivityCodes:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const randomIndex                = Math.floor( Math.random() * ( 10 ) ) + 1;
        let lastStringChar               = jsonDocument[jsonDocument.length - 1 ];

        if ( lastStringChar === '{' )
        {   jsonDocument               = jsonDocument.concat( '"' );
        }
        else
        {   jsonDocument               = jsonDocument.concat( ',"' );
        }
        jsonDocument                   = jsonDocument.concat( item[0],'"', ':[' );
        for ( let i = 0; i < randomIndex; i++ )
        {   lastStringChar             = jsonDocument[jsonDocument.length - 1 ];
            if ( lastStringChar === '[' )
            {   jsonDocument           = jsonDocument.concat( '"' );
            }
            else
            {   jsonDocument           = jsonDocument.concat( ',"' );
            }
            const retVal               =  generateRandomString( item[1].items );
            if ( retVal.returnCode !== EC.noError.returnCode )
            {   logger.error( applicationName + ':index:insertEmployerSelfEmployedActivityCodes:generateRandomString returned errors',retVal );
                return retVal;
            }
           jsonDocument                = jsonDocument.concat( retVal.body,'"' );
       }
       jsonDocument                    = jsonDocument.concat( ']' );
       logger.trace( applicationName + ':index:insertEmployerSelfEmployedActivityCodes:Ending' );
       return EC.noError;
   }
   catch ( ex )
   {   const response                = EC.exception;
       response.body                 = ex;
       logger.exception( applicationName + ':index:insertEmployerSelfEmployedActivityCodes:Exception caught: ',ex );
       return response;
   }
}


function insertArrayObjects ( schema, item, data )
{   try
    {   logger.trace( applicationName + ':index:insertArrayObjects:Starting' );
        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':index:insertArrayObjects:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const randomIndex                = Math.floor( Math.random() * ( 10 ) ) + 1;
        let lastStringChar               = jsonDocument[jsonDocument.length - 1 ];

        if ( lastStringChar === '{' )
        {   jsonDocument               = jsonDocument.concat( '"' );
        }
        else
        {   jsonDocument               = jsonDocument.concat( ',"' );
        }
        jsonDocument                   = jsonDocument.concat( item[0],'"', ':[' );
        for ( let i = 0; i < randomIndex; i++ )
        {   lastStringChar             = jsonDocument[jsonDocument.length - 1 ];
            if ( lastStringChar === '[' )
            {   jsonDocument           = jsonDocument.concat( '{' );
            }
            else
            {   jsonDocument           = jsonDocument.concat( ',{' );
            }
            const result                 = traverseObject( schema, item[1].items.properties, data );
            if ( result.returnCode !== EC.noError.returnCode )
            {   logger.error( applicationName + ':index:insertArrayObjects:traverseObject returned errors',result );
                return result;
            }
            jsonDocument = jsonDocument.concat( '}' );
        }
        jsonDocument = jsonDocument.concat( ']' );
        logger.trace( applicationName + ':index:insertArrayObjects:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':index:insertArrayObjects:Exception caught: ',ex );
        return response;
   }
 }


 function insertEmum ( schema, item )
{   try
    {   logger.trace( applicationName + ':index:insertEmum:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || Array.isArray( item ) === false )
        {   logger.error( applicationName + ':index:insertEmum:incorrect input parameters' );
            const response              = EC.badRequest;
            return response;
        }

        const randomIndex              = Math.floor( Math.random() * ( item[1].enum.length ) );
        const lastStringChar           = jsonDocument[jsonDocument.length - 1 ];

        if ( lastStringChar === '{' )
        {   jsonDocument               = jsonDocument.concat( '"' );
        }
        else
        {   jsonDocument               = jsonDocument.concat( ',"' );
        }
        jsonDocument                   = jsonDocument.concat( item[0],'"', ': ' );
        jsonDocument                   = jsonDocument.concat( '"',item[1].enum[randomIndex],'"' );

        logger.trace( applicationName + ':index:insertEmum:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':index:insertEmum:Exception caught: ',ex );
        return response;
   }
 }


function insertBoolean ( schema, item )
{   try
    {   logger.trace( applicationName + ':index:insertBoolean:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' )
        {   logger.error( applicationName + ':index:insertBoolean:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const last1StringChar            = jsonDocument[jsonDocument.length - 1 ];

        if ( last1StringChar === '{' )
        {   jsonDocument               = jsonDocument.concat( '"' );
        }
        else
        {   jsonDocument               = jsonDocument.concat( ',"' );
        }
        jsonDocument                   = jsonDocument.concat( item[0],'"', ': ' );
        jsonDocument                   = jsonDocument.concat( 'true' );

        logger.trace( applicationName + ':index:insertBoolean:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':index:insertBoolean:Exception caught: ',ex );
        return response;
   }
 }


function insertArray ( schema, item, data )
{   try
    {   let result;
        logger.trace( applicationName + ':index:insertArray:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':index:insertArray:incorrect input parameters' );
            result                       = EC.badRequest;
            return result;
        }

        switch ( item[0] )
        {   case 'nationalities'                      : result       =  insertRandomAmountOfNationlities( schema, item );
                                                        if ( result.returnCode !== EC.noError.returnCode )
                                                        {   logger.error( applicationName + ':index:insertArray:insertRandomAmountOfNationlities returned errors',result );
                                                            return result;
                                                        }
                                                        break;
            case 'employerSelfEmployedActivityCodes'  : result       = insertEmployerSelfEmployedActivityCodes( schema, item );
                                                        if ( result.returnCode !== EC.noError.returnCode )
                                                        {   logger.error( applicationName + ':index:insertArray:insertEmployerSelfEmployedActivityCodes returned errors',result );1;
                                                            return result;
                                                        }
                                                        break;
            case 'workPlaceNames'                     : result       = insertArrayObjects( schema, item, data );
                                                        if ( result.returnCode !== EC.noError.returnCode )
                                                        {   logger.error( applicationName + ':index:insertArray:insertArrayObjects returned errors',result );
                                                            return result;
                                                        }
                                                        break;
            case 'workPlaceAddresses'                 : lastSeqNo = 0;
                                                        result       = insertArrayObjects( schema, item, data );
                                                        if ( result.returnCode !== EC.noError.returnCode )
                                                        {   logger.error( applicationName + ':index:insertArray:insertArrayObjects returned errors',result );
                                                            return result;
                                                        }
                                                        break;
            default                                   : logger.error( applicationName + ':index:insertArray:unknown type', item );
                                                        result = EC.badResult;
                                                        return result;
        }
        logger.trace( applicationName + ':index:insertArray:Ending' );
        return result;
     }
     catch ( ex )
     {   const response                = EC.exception;
         response.body                 = ex;
         logger.exception( applicationName + ':index:insertArray:Exception caught: ',ex );
         return response;
    }
}


function  getOtherTypeOfItem ( schema, item )
{   try
    {   let response                   = { ...EC.noError };
        let getOtherTypeOfItem         = 'unknown type';

        logger.trace( applicationName + ':index:getOtherTypeOfItem:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' )
        {   logger.error( applicationName + ':index:getOtherTypeOfItem:incorrect input parameters' );
            response                   = EC.badRequest;
            return response;
        }

        if ( typeof item[1].enum !== 'undefined' )
        {   getOtherTypeOfItem         = 'enum';
        }
        else
        {   if ( item[1].type == 'boolean' )
            {   getOtherTypeOfItem     = 'boolean';
            }
            else
            if ( item[1].type === 'array' )
            {    getOtherTypeOfItem    = 'array';
            }
        }
        if ( getOtherTypeOfItem === 'unknown type' )
        {   response                   = EC.badRequest;
            response.body              = item[1].type;
            return response;

        }
        response.body                  = getOtherTypeOfItem;
        logger.trace( applicationName + ':index:getOtherTypeOfItem:Ending' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:getOtherTypeOfItem:Exception caught: ',ex );
        return response;
    }
}


function insertOthers ( schema, item, data )
{   try
    {   let result;

        logger.trace( applicationName + ':index:insertOthers:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':index:insertOthers:incorrect input parameters' );
            result                       = { ...EC.badRequest };
            return result;
        }

        const retVal                   =  getOtherTypeOfItem( schema, item );
        if ( retVal.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:insertOthers:returned errors', retVal );
            return retVal;
        }

        const typeOfItem               = retVal.body;

        switch ( typeOfItem )
        {   case 'boolean'  :   result =  insertBoolean( schema, item );
                                if ( result.returnCode !== EC.noError.returnCode )
                                {   logger.error( applicationName + ':index:insertOthers:insertBoolean returned errors',result );
                                    return result;
                                }
                                break;
            case 'enum'     :   result =  insertEmum( schema, item );
                                if ( result.returnCode !== EC.noError.returnCode )
                                {   logger.error( applicationName + ':index:insertOthers:insertEmum returned errors',result );
                                    return result;
                                }
                                break;
            case 'array'    :   result = insertArray( schema, item, data );
                                if ( result.returnCode !== EC.noError.returnCode )
                                {   logger.error( applicationName + ':index:insertOthers:insertArray returned errors',result );
                                    return result;
                                }
                                break;
            default         :   logger.error(   applicationName + ':index:insertOthers:unknown type', item );
                                result = EC.badResult;
                                return result;
        }
        logger.trace( applicationName + ':index:insertOthers:Ending' );
        return result;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:insertOthers:Exception caught: ',ex );
        return response;
    }
}



function manageItem ( schema,item, data )
{   try
    {   logger.trace( applicationName + ':index:manageItem:Starting' );
        //
        let result;

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':index:manageItem:incorrect input parameters' );
            result                       = { ...EC.badRequest };
            return result;
        }

        switch ( item[1].type )
        {   case 'object' :   result   = insertObject( schema, item, data );
                              if ( result.returnCode !== EC.noError.returnCode )
                              {   logger.error( applicationName + ':index:manageItem:insertObject returned errors',result );
                                  return result;
                              }
                              break;
            case 'string' :   result   = insertString( schema, item, data );
                              if ( result.returnCode !== EC.noError.returnCode )
                              {   logger.error( applicationName + ':index:manageItem:insertString returned errors',result );
                                  return result;
                              }
                              break;
            case 'number' :   result   = insertNumber( schema, item );
                              if ( result.returnCode !== EC.noError.returnCode )
                              {   logger.error( applicationName + ':index:manageItem:insertNumber returned errors',result );
                                  return result;
                              }
                              break;
            default       :   result   = insertOthers( schema, item, data );
                              if ( result.returnCode !== EC.noError.returnCode )
                              {   logger.error( applicationName + ':index:manageItem:insertOthers returned errors',result );
                                  return result;
                              }
                              break;
        }
        logger.trace( applicationName + ':index:manageItem:Ending' );
        return result;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:manageItem:Exception caught: ',ex );
        return response;
    }
}



function traverseObject ( schema, jsonObject, data )
{   try
    {   logger.trace( applicationName + ':index:traverseObject:Starting' );
        let response                   = { ...EC.noError };
        if ( ( typeof jsonObject === 'undefined' || jsonObject === null ) || ( typeof data === 'undefined' || data === null ) )
        {   logger.error( applicationName + ':index:traverseObject:incorrect input parameters' );
            response                   = EC.badRequest;
            return response;
        }

        const arrayOfProperties          = Object.entries( jsonObject );

        arrayOfProperties.forEach( function ( item )
        {   const result                  =  manageItem ( schema, item, data );
            if ( result.returnCode !== EC.noError.returnCode )
            {   logger.error( applicationName + ':index:traverseObject:manageItem returned errors',result );
                return result;
            }
        } );
        logger.trace( applicationName + ':index:traverseObject:Ending' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:traverseObject:Exception caught: ',ex );
        return response;
    }
}


*/
/*
async function generateDataFromSchema ( schema, data )
{   try
    {   let response                   = { ...EC.noError };

        if ( typeof schema === 'undefined' || schema === null || typeof data === 'undefined' || data === null )
        {   logger.error( applicationName + ':index:generateDataFromSchema:incorrect input parameters' );
            response                   = EC.badRequest;
            return response;
        }

        const schemaObject             = await $RefParser.dereference( schema, {allowUnknownAttributes: false} );

        jsonDocument                   = jsonDocument.concat( '{' );

        const traverseObjectResp         = traverseObject( schemaObject, schemaObject.properties,data );
        if ( traverseObjectResp.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:generateDataFromSchema:traverseObjectResp returned errors' );
            return traverseObjectResp;
        }

        jsonDocument                   = jsonDocument.concat( '}' );
        response.body                  = jsonDocument;
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:generateDataFromSchema:Exception caught: ',ex );
        return response;
    }
}



async function validateSchema ( schema, jsonInput )
{   try
    {   logger.trace( applicationName + ':index:validateSchema:Starting' );
        if ( schema === null || typeof schema === 'undefined' || jsonInput === null || typeof jsonInput === 'undefined' )
        {   logger.error( applicationName + ':index:validateSchema:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const validator                = new Validator();
        let response                   = { ... EC.noError};

        validator.debug                = true;
        const schemaObject             = await $RefParser.dereference( schema, {allowUnknownAttributes: false} );
        const JSONdata                 = JSON.parse( jsonInput );
        const valResult                = validator.validate( JSONdata, schemaObject );

        logger.debug( applicationName + ':index:validateSchema:valResult',valResult.errors );
        if ( valResult.errors.length > 0 )
        {   logger.error( applicationName + ':index:validateSchema:Validation returned errors',valResult.errors );
            response                   = EC.schemaValidationError;
            response.body              = valResult.errors;
            return response;
        }

        logger.trace( applicationName + ':index:validateSchema:Ending' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:validateSchema:Exception caught in validateSchema: ',ex );
        return response;
    }
}

async function mainO ()
{   try
    {   logger.trace( applicationName + ':index:main:Starting' );
        const response                   = { ... EC.noError } ;
        const schemaFile               =  getJSONSchema( FileName );

        if ( schemaFile.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:main:Error in getJSONSchema',schemaFile );
            return schemaFile;
        }
        const schema                   = schemaFile.body;

        const dataFile                 =  getJSONSchema( dataSet );

        if ( dataFile.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:main:Error in getJSONSchema',dataFile );
            return dataFile;
        }

        const data                     = Object.entries( dataFile.body );

        await generateDataFromSchema( schema,data );


        const result                   = await validateSchema( schema, jsonDocument );
        if ( result.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:main:Validation returned errors',result );
            return result;
        }

        await  fs.writeFile( outputJson, jsonDocument );
        const encoded = cbor.encode( jsonDocument ); // Returns <Buffer f5>
        //console.log( encoded.length );


        logger.debug( applicationName + ':index:main:jsonDocument',JSON.parse( jsonDocument ) );
        logger.trace( applicationName + ':index:main:Ending' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:main:Exception caught: ',ex );
        return response;
    }
}


function _01_readJSONSchema ()
{   try
    {   logger.trace( applicationName + ':index:main:Starting' );

        const schemaFile               =  getJSONSchema( FileName );

        if ( schemaFile.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:main:Error in getJSONSchema',schemaFile );
            return schemaFile;
        }

        logger.trace( applicationName + ':index:main:Ending' );
        return schemaFile;
    }
    catch ( ex )
    {  const response                 = EC.exception;
       response.body                  = ex;
       logger.exception( applicationName + ':index:_01_readJSONSchema:Exception caught: ',ex );
       return response;
    }
}

async function _02_generateJSONDocument ( schema )
{   try
    {   logger.trace( applicationName + ':index:_02_generateJSONDocument:Starting' );

        const dataFile                 =  getJSONSchema( dataSet );

        if ( dataFile.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:_02_generateJSONDocument:Error in getJSONSchema',dataFile );
            return dataFile;
        }

        const data                     = Object.entries( dataFile.body );

        const jsonResponse             = await generateDataFromSchema( schema,data );

        if ( jsonResponse.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:_02_generateJSONDocument:Error in generateDataFromSchema',jsonResponse );
            return jsonResponse;
        }

        logger.trace( applicationName + ':index:_02_generateJSONDocument:Ending' );

        return jsonResponse;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:_02_generateJSONDocument:Exception caught: ',ex );
        return response;
    }
}

async function _03_validateJSONDocument ( schema, jsonDocument )
{   try
    {   logger.trace( applicationName + ':index:_03_validateJSONDocument:Starting' );

        const result                   = await validateSchema( schema, jsonDocument );
        if ( result.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:_03_validateJSONDocument:Error in validateSchema',result );
            return result;
        }

        logger.trace( applicationName + ':index:_03_validateJSONDocument:Ending' );
        return result;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:_03_validateJSONDocument:Exception caught: ',ex );
        return response;
    }
}



async function _04_writeJSONDocument ( jsonDocument )
{   try
    {   logger.trace( applicationName + ':index:_04_writeJSONDocument:Starting' );

        if ( jsonDocument === null || typeof jsonDocument === 'undefined' || outputJson === null || typeof outputJson === 'undefined' )
        {   logger.error( applicationName + ':index:_04_writeJSONDocument:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        await fs.writeFile( outputJson, jsonDocument );
        const response                 = { ...EC.noError } ;
        response.body                  = jsonDocument;
        logger.trace( applicationName + ':index:_04_writeJSONDocument:Ending' );
        return response;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:_04_writeJSONDocument:Exception caught: ',ex );
        return response;
    }
}

function _05_transformJSONToCBOR ( jsonDocument )
{   try
    {   logger.trace( applicationName + ':index:_05_transformJSONToCBOR:Starting' );

        if ( jsonDocument === null || typeof jsonDocument === 'undefined' )
        {   logger.error( applicationName + ':index:_05_transformJSONToCBOR:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const encoded                 = cbor.encode( jsonDocument ); // Returns <Buffer f5>

        const sizeDifference          = Math.trunc( ( ( encoded.length - jsonDocument.length ) / jsonDocument.length ) * 10000 ) / 100;

        logger.debug( applicationName + ':index:_05_transformJSONToCBOR:sizes json: [' + jsonDocument.length + '] cbor: [' + encoded.length  + '];Size difference: [' + sizeDifference   + '%]' );



        const response                = { ...EC.noError } ;
        response.body                 = encoded;
        logger.trace( applicationName + ':index:_05_transformJSONToCBOR:Ending' );
        return response;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:_05_transformJSONToCBOR:Exception caught: ',ex );
        return response;
    }
}

function _09_base45Encode ( encoded )
{   try
    {   logger.trace( applicationName + ':index:_09_base45Encode:Starting' );

        if ( encoded === null || typeof encoded === 'undefined' )
        {   logger.error( applicationName + ':index:_09_base45Encode:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const base45Encoded           = base45.encode( encoded );

        const sizeDifference          = Math.trunc( ( ( base45Encoded.length - encoded.length ) / encoded.length ) * 10000 ) / 100;

        logger.debug( applicationName + ':index:_09_base45Encode:sizes cbor: [' + encoded.length + '] base45: [' + base45Encoded.length  + '];Size difference: [' + sizeDifference   + '%]' );

        const response                = { ...EC.noError } ;
        response.body                 = base45Encoded;
        logger.trace( applicationName + ':index:_09_base45Encode:Ending' );
        return response;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:_09_base45Encode:Exception caught: ',ex );
        return response;
    }
}

async function _10_zlibCompress ( base45Encoded )
{   try
    {   logger.trace( applicationName + ':index:_10_zlibCompress:Starting' );

        if ( base45Encoded === null || typeof base45Encoded === 'undefined' )
        {   logger.error( applicationName + ':index:_10_zlibCompress:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const zlibCompressed          = zlib.deflateSync( base45Encoded );


        const sizeDifference          = Math.trunc( ( ( zlibCompressed.length - base45Encoded.length ) / base45Encoded.length ) * 10000 ) / 100;

        await fs.writeFile( zlibbed, zlibCompressed );

        logger.debug( applicationName + ':index:_10_zlibCompress:sizes base45: [' + base45Encoded.length + '] zlib: [' + zlibCompressed.length  + '];Size difference: [' + sizeDifference   + '%]' );

        const response                = { ...EC.noError } ;
        response.body                 = zlibCompressed;
        logger.trace( applicationName + ':index:_10_zlibCompress:Ending' );
        return response;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:_10_zlibCompress:Exception caught: ',ex );
        return response;
    }
}

async function _11_transformZlibToQR ( zlibCompressed )
{   try
    {   logger.trace( applicationName + ':index:_11_transformZlibToQR:Starting' );

        if ( zlibCompressed === null || typeof zlibCompressed === 'undefined' )
        {   logger.error( applicationName + ':index:_11_transformZlibToQR:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        QRCode.toFile( qrCodeFile, [{ data: zlibCompressed, mode: 'byte' }] );

        const response                = { ...EC.noError } ;
        response.body                 = zlibCompressed;
        logger.trace( applicationName + ':index:_11_transformZlibToQR:Ending' );
        return response;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:_11_transformZlibToQR:Exception caught: ',ex );
        return response;
    }
}
*/

/*
   1. read a JSON schema
   2. generate a JSON document from the schema
   3. validate the JSON document against the schema
   4. write the JSON document to a file
   5. transform JSON file to CBOR file
   6. create singing tree with X509 certificates
   7. Sign the CBOR file with a private key as COSE_Sign1
   8. Write the COSE_Sign1 file to a file
   9. base 45 encode the COSE_Sign1 file
   10. zlib compress the base 45 encoded COSE_Sign1 file
   11. Transform the zlib file to a QR code
*/
/*
async function JSON2QR ()
{   try
    {   logger.trace( applicationName + ':indexJSON2QRStarting' );


        const schema                     = _01_readJSONSchema();
        if ( schema.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':indexJSON2QRError in _01_readJSONSchema',schema );
            return schema;

        }
        logger.debug( applicationName + ':indexJSON2QR_01_readJSONSchema is done succesfully' );
        //console.log( schema.body );
        const tempSchema                  = schema.body;
        const jsonDoc                    = await _02_generateJSONDocument( tempSchema );
        if ( jsonDoc.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':indexJSON2QRError in _02_generateJSONDocument',jsonDoc );
            return jsonDoc;
        }

        logger.debug( applicationName + ':indexJSON2QR_02_generateJSONDocument is done succesfully' );



        const validation                = await _03_validateJSONDocument( schema.body, jsonDoc.body );

        if ( validation.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':indexJSON2QRError in _03_validateJSONDocument',validation );
            return validation;
        }

        logger.debug( applicationName + ':indexJSON2QR_03_validateJSONDocument is done succesfully' );

        const result                   = await _04_writeJSONDocument( jsonDoc.body );

        if ( result.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':indexJSON2QRError in _04_writeJSONDocument',result );
            return result;
        }
/
        logger.debug( applicationName + ':indexJSON2QR_04_writeJSONDocument is done succesfully' );

        const encoded                 = await _05_transformJSONToCBOR( result.body );

        if ( encoded.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':indexJSON2QRError in _05_transformJSONToCBOR',encoded );
            return encoded;
        }

        logger.debug( applicationName + ':indexJSON2QR_05_transformJSONToCBOR is done succesfully' );

        const base45Encoded           = _09_base45Encode( encoded.body );

        if ( base45Encoded.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':indexJSON2QRError in _09_base45Encode',base45Encoded );
            return base45Encoded;
        }

        logger.debug( applicationName + ':indexJSON2QR_09_base45Encode is done succesfully' );

        const zlibCompressed          = await _10_zlibCompress( base45Encoded.body );

        if ( zlibCompressed.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':indexJSON2QRError in _10_zlibCompress',zlibCompressed );
            return zlibCompressed;
        }

        logger.debug( applicationName + ':indexJSON2QR_10_zlibCompress is done succesfully' );

        const resultQR                = await _11_transformZlibToQR( zlibCompressed.body );

        if ( resultQR.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':indexJSON2QRError in _11_transformZlibToQR',resultQR );
            return resultQR;
        }

        logger.debug( applicationName + ':indexJSON2QR_11_transformZlibToQR is done succesfully' );

        logger.trace( applicationName + ':indexJSON2QREnding' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':indexJSON2QRException caught: ',ex );
        return response;
    }
}



async function  _21_scanQRCode ()
{   try
    {   logger.trace( applicationName + ':index:_21_scanQRCode:Starting' );
        const data                     = await fs.readFile( './output/QRCode.png', { encoding: 'binary' } );

        const buffer = await fs.readFile( './output/QRCode.png' );
        const reader = new PNGReader( buffer );
        console.log( Object.keys( reader ) );
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:_21_scanQRCode:Exception caught: ',ex );
        return response;
    }

}*/
/*
   21. scan QR code
   22. get zipped bytecode from QR scan
   23. unzip bytecode to base45 string
   24. decode base 45 code to cose signed string
   25. verify cose signed string with public key
   26. decode cose signed string to cbor
   27. decode cbor to json
   28. validate json against schema
   29. write json to file
*/
/*
async function QR2JSON ()
{   try
    {   logger.trace( applicationName + ':index:QR2JSON:Starting' );

        const result                   = await  _21_scanQRCode();
        if ( result.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:QR2JSON:_21_scanQRCode returned errors',result );
            return result;
        }

        logger.debug( applicationName + ':index:QR2JSON:_21_scanQRCode is done succesfully' );

        return EC.noError;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:QR2JSON:Exception caught: ',ex );
        return response;
    }
}

async function mainCode ()
{   try
    {   logger.trace( applicationName + ':index:mainCode:Starting' );

        console.log( introductionText );

        const retVal                   = await JSON2QR();
        if ( retVal.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:mainCode:JSON2QR returned errors',retVal );
            return retVal;
        }

        logger.debug( applicationName + ':index:mainCode:JSON2QR is done succesfully' );

        const result                   = await QR2JSON();
        if ( result.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:mainCode:QR2JSON returned errors',result );
            return result;
        }

        logger.debug( applicationName + ':index:mainCode:QR2JSON is done succesfully' );


        logger.trace( applicationName + ':index:mainCode:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:mainCode:Exception caught: ',ex );
        return response;
    }

}
*/
function setRouting ()
{   try
   {   const response                 = { ...EC.noError };
        response.body                  = '';
        logger.trace( applicationName + ':index:setRouting:Starting' );
        app.get( '/',genCntrl.main );
        app.get( '/create',genCntrl.main );
        app.post( '/manageActions',genCntrl.main );
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
