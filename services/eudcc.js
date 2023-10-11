/* File             : eudcc.js
   Author           : Daniel S. A. Khan
   Copywrite        : Daniel S. A. Khan (c) 2023
   Description      : eudcc.js
   Notes            :
*/

require( 'dotenv' ).config();
const base45                           = require( 'base45' );
const zlib                             = require( 'zlib' );
const fs                               = require( 'fs/promises' );
const cbor                             = require( 'cbor' );
const Validator                        = require( 'jsonschema' ).Validator;
const $RefParser                       = require( '@apidevtools/json-schema-ref-parser' );
const QRCode                           = require( 'qrcode' );
const cose = require( 'cose-js' );

//const PNGReader                        = require( 'png.js' );
//const Jimp                             = require( 'jimp' );
//const qrCodeReader                     = require( 'qrcode-reader' );

const config                           = require( '../services/configuration' );
const EC                               = require( '../services/errorCatalog' );
const Logger                           = require( '../services/loggerClass' );

const applicationName                  = config.get( 'application:applicationName' );
const logFileName                      = config.get( 'application:logFileName' );
const logger                           = new Logger( logFileName );
const zlibbed                          = process.env.ZLIBBED;
const qrCodeFile                       = process.env.QRCODEFILE;

let   jsonDocument                     = ' ';
let   lastSeqNo                        = 0;

function insertArrayObjects ( schema, item, data )
{   try
    {   logger.trace( applicationName + ':eudcc:insertArrayObjects:Starting' );
        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':eudcc:insertArrayObjects:incorrect input parameters' );
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
            {   logger.error( applicationName + ':eudcc:insertArrayObjects:traverseObject returned errors',result );
                return result;
            }
            jsonDocument = jsonDocument.concat( '}' );
        }
        jsonDocument = jsonDocument.concat( ']' );
        logger.trace( applicationName + ':eudcc:insertArrayObjects:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':eudcc:insertArrayObjects:Exception caught: ',ex );
        return response;
   }
}

function insertEmployerSelfEmployedActivityCodes ( schema, item )
{   try
    {   logger.trace( applicationName + ':eudcc:insertEmployerSelfEmployedActivityCodes:Starting' );
        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' )
        {   logger.error( applicationName + ':eudcc:insertEmployerSelfEmployedActivityCodes:incorrect input parameters' );
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
            {   logger.error( applicationName + ':eudcc:insertEmployerSelfEmployedActivityCodes:generateRandomString returned errors',retVal );
                return retVal;
            }
           jsonDocument                = jsonDocument.concat( retVal.body,'"' );
       }
       jsonDocument                    = jsonDocument.concat( ']' );
       logger.trace( applicationName + ':eudcc:insertEmployerSelfEmployedActivityCodes:Ending' );
       return EC.noError;
   }
   catch ( ex )
   {   const response                = EC.exception;
       response.body                 = ex;
       logger.exception( applicationName + ':eudcc:insertEmployerSelfEmployedActivityCodes:Exception caught: ',ex );
       return response;
   }
}

function insertRandomAmountOfNationlities ( schema, item )
{   try
    {   logger.trace( applicationName + ':eudcc:insertRandomAmountOfNationlities:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' )
        {   logger.error( applicationName + ':eudcc:insertRandomAmountOfNationlities:incorrect input parameters' );
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
        logger.trace( applicationName + ':eudcc:insertRandomAmountOfNationlities:Ending' );
        return EC.noError;
     }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':eudcc:insertRandomAmountOfNationlities:Exception caught: ',ex );
        return response;
    }
}

function insertArray ( schema, item, data )
{   try
    {   let result;
        logger.trace( applicationName + ':eudcc:insertArray:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':eudcc:insertArray:incorrect input parameters' );
            result                       = EC.badRequest;
            return result;
        }

        switch ( item[0] )
        {   case 'nationalities'                      : result       =  insertRandomAmountOfNationlities( schema, item );
                                                        if ( result.returnCode !== EC.noError.returnCode )
                                                        {   logger.error( applicationName + ':eudcc:insertArray:insertRandomAmountOfNationlities returned errors',result );
                                                            return result;
                                                        }
                                                        break;
            case 'employerSelfEmployedActivityCodes'  : result       = insertEmployerSelfEmployedActivityCodes( schema, item );
                                                        if ( result.returnCode !== EC.noError.returnCode )
                                                        {   logger.error( applicationName + ':eudcc:insertArray:insertEmployerSelfEmployedActivityCodes returned errors',result );1;
                                                            return result;
                                                        }
                                                        break;
            case 'workPlaceNames'                     : result       = insertArrayObjects( schema, item, data );
                                                        if ( result.returnCode !== EC.noError.returnCode )
                                                        {   logger.error( applicationName + ':eudcc:insertArray:insertArrayObjects returned errors',result );
                                                            return result;
                                                        }
                                                        break;
            case 'workPlaceAddresses'                 : lastSeqNo = 0;
                                                        result       = insertArrayObjects( schema, item, data );
                                                        if ( result.returnCode !== EC.noError.returnCode )
                                                        {   logger.error( applicationName + ':eudcc:insertArray:insertArrayObjects returned errors',result );
                                                            return result;
                                                        }
                                                        break;
            default                                   : logger.error( applicationName + ':eudcc:insertArray:unknown type', item );
                                                        result = EC.badResult;
                                                        return result;
        }
        logger.trace( applicationName + ':eudcc:insertArray:Ending' );
        return result;
     }
     catch ( ex )
     {   const response                = EC.exception;
         response.body                 = ex;
         logger.exception( applicationName + ':eudcc:insertArray:Exception caught: ',ex );
         return response;
    }
}

function insertEmum ( schema, item )
{   try
    {   logger.trace( applicationName + ':eudcc:insertEmum:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || Array.isArray( item ) === false )
        {   logger.error( applicationName + ':eudcc:insertEmum:incorrect input parameters' );
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

        logger.trace( applicationName + ':eudcc:insertEmum:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':eudcc:insertEmum:Exception caught: ',ex );
        return response;
   }
}

function insertBoolean ( schema, item )
{   try
    {   logger.trace( applicationName + ':eudcc:insertBoolean:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' )
        {   logger.error( applicationName + ':eudcc:insertBoolean:incorrect input parameters' );
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

        logger.trace( applicationName + ':eudcc:insertBoolean:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':eudcc:insertBoolean:Exception caught: ',ex );
        return response;
   }
}

function  getOtherTypeOfItem ( schema, item )
{   try
    {   let response                   = { ...EC.noError };
        let getOtherTypeOfItem         = 'unknown type';

        logger.trace( applicationName + ':eudcc:getOtherTypeOfItem:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' )
        {   logger.error( applicationName + ':eudcc:getOtherTypeOfItem:incorrect input parameters' );
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
        logger.trace( applicationName + ':eudcc:getOtherTypeOfItem:Ending' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:getOtherTypeOfItem:Exception caught: ',ex );
        return response;
    }
}

function generateRandomString ( stringDef )
{   try
    {   logger.trace( applicationName + ':eudcc:generateRandomString:Starting' );

        if ( typeof stringDef === 'undefined' || stringDef === null )
        {   logger.error( applicationName + ':eudcc:generateRandomString:incorrect input parameters' );
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
        logger.trace( applicationName + ':eudcc:generateRandomString:Ending' );
        const response                 = { ... EC.noError};
        response.body                  = tempString;
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:generateRandomString:Exception caught: ',ex );
        return response;
    }
}

function insertOthers ( schema, item, data )
{   try
    {   let result;

        logger.trace( applicationName + ':eudcc:insertOthers:Starting' );

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':eudcc:insertOthers:incorrect input parameters' );
            result                       = { ...EC.badRequest };
            return result;
        }

        const retVal                   =  getOtherTypeOfItem( schema, item );
        if ( retVal.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':eudcc:insertOthers:returned errors', retVal );
            return retVal;
        }

        const typeOfItem               = retVal.body;

        switch ( typeOfItem )
        {   case 'boolean'  :   result =  insertBoolean( schema, item );
                                if ( result.returnCode !== EC.noError.returnCode )
                                {   logger.error( applicationName + ':eudcc:insertOthers:insertBoolean returned errors',result );
                                    return result;
                                }
                                break;
            case 'enum'     :   result =  insertEmum( schema, item );
                                if ( result.returnCode !== EC.noError.returnCode )
                                {   logger.error( applicationName + ':eudcc:insertOthers:insertEmum returned errors',result );
                                    return result;
                                }
                                break;
            case 'array'    :   result = insertArray( schema, item, data );
                                if ( result.returnCode !== EC.noError.returnCode )
                                {   logger.error( applicationName + ':eudcc:insertOthers:insertArray returned errors',result );
                                    return result;
                                }
                                break;
            default         :   logger.error(   applicationName + ':eudcc:insertOthers:unknown type', item );
                                result = EC.badResult;
                                return result;
        }
        logger.trace( applicationName + ':eudcc:insertOthers:Ending' );
        return result;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:insertOthers:Exception caught: ',ex );
        return response;
    }
}

function insertNumber ( schema, object )
{   try
    {   logger.trace( applicationName + ':eudcc:insertNumber:Starting' );

        if ( schema === null || typeof schema === 'undefined' || object === null || typeof object === 'undefined' )
        {   logger.error( applicationName + ':eudcc:insertNumber:incorrect input parameters' );
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

        logger.trace( applicationName + ':eudcc:insertNumber:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':eudcc:insertNumber:Exception caught: ',ex );
        return response;
    }
}

function insertObject ( schema, object, data )
{   try
    {   logger.trace( applicationName + ':eudcc:insertObject:Starting' );

        if ( schema === null || typeof schema === 'undefined' || object === null || typeof object === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':eudcc:insertObject:incorrect input parameters' );
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
        {   logger.error( applicationName + ':eudcc:insertObject:traverseObject returned errors',retVal );
            return retVal;
        }

        jsonDocument                   = jsonDocument.concat( '}' );
        logger.trace( applicationName + ':eudcc:insertObject:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':eudcc:insertObject:Exception caught: ',ex );
        return response;
    }
}

function insertString ( schema, object, items )
{   try
    {   logger.trace( applicationName + ':eudcc:insertString:Starting' );

        if ( schema === null || typeof schema === 'undefined' || object === null || typeof object === 'undefined' )
        {   logger.error( applicationName + ':eudcc:insertString:incorrect input parameters' );
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
            {   logger.error( applicationName + ':eudcc:insertString:generateRandomString returned errors',retVal );
                return retVal;
            }
            jsonDocument               = jsonDocument.concat( '"', retVal.body, '"' );
        }
        logger.trace( applicationName + ':eudcc:insertString:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                = EC.exception;
        response.body                 = ex;
        logger.exception( applicationName + ':eudcc:insertString:Exception caught: ',ex );
        return response;
    }
}

function manageItem ( schema,item, data )
{   try
    {   logger.trace( applicationName + ':eudcc:manageItem:Starting' );

        let result;

        if ( schema === null || typeof schema === 'undefined' || item === null || typeof item === 'undefined' || data === null || typeof data === 'undefined' )
        {   logger.error( applicationName + ':eudcc:manageItem:incorrect input parameters' );
            result                       = { ...EC.badRequest };
            return result;
        }

        switch ( item[1].type )
        {   case 'object' :   result   = insertObject( schema, item, data );
                              if ( result.returnCode !== EC.noError.returnCode )
                              {   logger.error( applicationName + ':eudcc:manageItem:insertObject returned errors',result );
                                  return result;
                              }
                              break;
            case 'string' :   result   = insertString( schema, item, data );
                              if ( result.returnCode !== EC.noError.returnCode )
                              {   logger.error( applicationName + ':eudcc:manageItem:insertString returned errors',result );
                                  return result;
                              }
                              break;
            case 'number' :   result   = insertNumber( schema, item );
                              if ( result.returnCode !== EC.noError.returnCode )
                              {   logger.error( applicationName + ':eudcc:manageItem:insertNumber returned errors',result );
                                  return result;
                              }
                              break;
            default       :   result   = insertOthers( schema, item, data );
                              if ( result.returnCode !== EC.noError.returnCode )
                              {   logger.error( applicationName + ':eudcc:manageItem:insertOthers returned errors',result );
                                  return result;
                              }
                              break;
        }
        logger.trace( applicationName + ':eudcc:manageItem:Ending' );
        return result;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:manageItem:Exception caught: ',ex );
        return response;
    }
}

function traverseObject ( schema, jsonObject, data )
{   try
    {   logger.trace( applicationName + ':eudcc:traverseObject:Starting' );
        let response                   = { ...EC.noError };
        if ( ( typeof jsonObject === 'undefined' || jsonObject === null ) || ( typeof data === 'undefined' || data === null ) )
        {   logger.error( applicationName + ':eudcc:traverseObject:incorrect input parameters' );
            response                   = EC.badRequest;
            return response;
        }

        const arrayOfProperties          = Object.entries( jsonObject );

        arrayOfProperties.forEach( function ( item )
        {   const result                  =  manageItem ( schema, item, data );
            if ( result.returnCode !== EC.noError.returnCode )
            {   logger.error( applicationName + ':eudcc:traverseObject:manageItem returned errors',result );
                return result;
            }
        } );
        logger.trace( applicationName + ':eudcc:traverseObject:Ending' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:traverseObject:Exception caught: ',ex );
        return response;
    }
}

async function generateDataFromSchema ( schema, data )
{   try
    {   let response                   = { ...EC.noError };

        if ( typeof schema === 'undefined' || schema === null || typeof data === 'undefined' || data === null )
        {   logger.error( applicationName + ':eudcc:generateDataFromSchema:incorrect input parameters' );
            response                   = EC.badRequest;
            return response;
        }

        const schemaObject             = await $RefParser.dereference( schema, {allowUnknownAttributes: false} );

        jsonDocument                   = jsonDocument.concat( '{' );

        const traverseObjectResp         = traverseObject( schemaObject, schemaObject.properties,data );
        if ( traverseObjectResp.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':eudcc:generateDataFromSchema:traverseObjectResp returned errors' );
            return traverseObjectResp;
        }

        jsonDocument                   = jsonDocument.concat( '}' );
        response.body                  = jsonDocument;
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:generateDataFromSchema:Exception caught: ',ex );
        return response;
    }
}

async function validateSchema ( schema, jsonInput )
{   try
    {   logger.trace( applicationName + ':eudcc:validateSchema:Stasdasdasdarting' );
        const response                 = { ... EC.noError};

        if ( schema === null || typeof schema === 'undefined' || jsonInput === null || typeof jsonInput === 'undefined' )
        {   logger.error( applicationName + ':eudcc:validateSchema:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;        
        }

        const validator                = new Validator();

        validator.debug                = true;
        const schemaObject             = await $RefParser.dereference( schema, {allowUnknownAttributes: false} );
        const JSONdata                 = JSON.parse( jsonInput );
        
        const valResult                = validator.validate( JSONdata, schemaObject );

        logger.debug( applicationName + ':eudcc:validateSchema:valResult',valResult.errors );
        if ( valResult.errors.length > 0 )
        {   logger.error( applicationName + ':eudcc:validateSchema:Validation returned errors',valResult.errors );
            const response             = EC.schemaValidationError;
            response.body              = valResult.errors;
            return response;
        }

        logger.trace( applicationName + ':eudcc:validateSchema:Ending' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:validateSchema:Exception caught in validateSchema: ',ex );
        return response;
    }
}

function _01_readJSONSchema ()
{   try
    {   logger.trace( applicationName + ':eudcc:main:Starting' );

        const JSONSchema               = process.env.PDA1ACKNOWLEDGEMENTSCHEMA;

        if ( typeof JSONSchema === 'undefined' || JSONSchema === null )
        {   logger.error( applicationName + ':eudcc:_01_readJSONSchema:incorrect data' );
            const response             = EC.badData;
            return response;
        }

        const schemaFile               =   require( JSONSchema ); //getJSONSchema( JSONSchema );

        if ( typeof schemaFile === 'undefined' || schemaFile === null )
        {   logger.error( applicationName + ':eudcc:_01_readJSONSchema:incorrect Data' );
            const response             = EC.badData;
            return response;
        }

        logger.trace( applicationName + ':eudcc:main:Ending' );
        const response             = { ...EC.noError };
        response.body              = schemaFile;

        return response;
    }
    catch ( ex )
    {  const response                 = EC.exception;
       response.body                  = ex;
       logger.exception( applicationName + ':eudcc:_01_readJSONSchema:Exception caught: ',ex );
       return response;
    }
}

async function _02_generateJSONDocument ( schema )
{   try
    {   logger.trace( applicationName + ':eudcc:_02_generateJSONDocument:Starting' );

        const dataSet                  = process.env.PDA1DATASET;

        if ( typeof dataSet === 'undefined' || dataSet === null )
        {   const response             = EC.badData;
            logger.error( applicationName + ':eudcc:_02_generateJSONDocument:' + response.message );
            return response;
        }

        const dataFile                 =  require( dataSet );

        if ( typeof dataFile === 'undefined' || dataFile === null )
        {   const response             = EC.badData;
            logger.error( applicationName + ':eudcc:_02_generateJSONDocument:' + response.message );
            return response;
        }

        const data                     = Object.entries( dataFile  );

        const jsonResponse             = await generateDataFromSchema( schema,data );

        if ( jsonResponse.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':eudcc:_02_generateJSONDocument:Error in generateDataFromSchema',jsonResponse );
            return jsonResponse;
        }
        

        logger.trace( applicationName + ':eudcc:_02_generateJSONDocument:Ending' );

        return jsonResponse;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_02_generateJSONDocument:Exception caught: ',ex );
        return response;
    }
}

async function _03_validateJSONDocument ( schema, jsonDocument )
{   try
    {   logger.trace( applicationName + ':eudcc:_03_validateJSONDocument:Starting' );

        const result                   = await validateSchema( schema, jsonDocument );
        if ( result.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':eudcc:_03_validateJSONDocument:Error in validateSchema',result );
            return result;
        }

        logger.trace( applicationName + ':eudcc:_03_validateJSONDocument:Ending' );
        return result;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_03_validateJSONDocument:Exception caught: ',ex );
        return response;
    }
}

async function _04_writeJSONDocument ( jsonDocument )
{   try
    {   logger.trace( applicationName + ':eudcc:_04_writeJSONDocument:Starting' );

        const outputJson               = process.env.OUTPUTJSON;

        if ( jsonDocument === null || typeof jsonDocument === 'undefined' || outputJson === null || typeof outputJson === 'undefined' )
        {   logger.error( applicationName + ':eudcc:_04_writeJSONDocument:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        await fs.writeFile( outputJson, jsonDocument );
        const response                 = { ...EC.noError } ;
        response.body                  = jsonDocument;
        logger.trace( applicationName + ':eudcc:_04_writeJSONDocument:Ending' );
        return response;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_04_writeJSONDocument:Exception caught: ',ex );
        return response;
    }
}

async function _05_transformJSONToCBOR ( jsonDocument )
{   try
    {   logger.trace( applicationName + ':eudcc:_05_transformJSONToCBOR:Starting' );

        const outputCBOR               = process.env.OUTPUTCBOR;

        if ( jsonDocument === null || typeof jsonDocument === 'undefined' )
        {   logger.error( applicationName + ':eudcc:_05_transformJSONToCBOR:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }
        let temp = JSON.parse(jsonDocument);        

        const encoded                 = cbor.encode( temp ); // Returns <Buffer f5>        

        await fs.writeFile( outputCBOR, encoded.toString('hex') );


        const sizeDifference          = Math.trunc( ( ( encoded.length - jsonDocument.length ) / jsonDocument.length ) * 10000 ) / 100;

        logger.debug( applicationName + ':eudcc:_05_transformJSONToCBOR:sizes json: [' + jsonDocument.length + '] cbor: [' + encoded.length  + '];Size difference: [' + sizeDifference   + '%]' );

        const response                = { ...EC.noError } ;
        response.body                 = encoded;
        logger.trace( applicationName + ':eudcc:_05_transformJSONToCBOR:Ending' );
        return response;
    }
    catch   ( ex )
    {
        logger.exception( applicationName + ':eudcc:_05_transformJSONToCBOR:Exception caught: ',ex );
        return response;
    }
}
/*
const cose = require('cose-js');
try {
  const verifier = {
    key: {
      x: Buffer.from('143329cce7868e416927599cf65a34f3ce2ffda55a7eca69ed8919a394d42f0f', 'hex'),
      y: Buffer.from('60f7f1a780d8a783bfb7a2dd6b2796e8128dbbcef9d3d168db9529971a36e7b9', 'hex')
    }
  };
  const COSEMessage = Buffer.from('d28443a10126a10442313172496d706f7274616e74206d6573736167652158404c2b6b66dfedc4cfef0f221cf7ac7f95087a4c4245fef0063a0fd4014b670f642d31e26d38345bb4efcdc7ded3083ab4fe71b62a23f766d83785f044b20534f9', 'hex');
  const buf = await cose.sign.verify(COSEMessage, verifier);
  console.log('Verified message: ' + buf.toString('utf8'));
} catch (error) {
  console.log(error);
}
   */
async function _07_signCBOROPbject ( cborObject, keyInformation )
{   try
    {   logger.trace( applicationName + ':eudcc:_07_signCBOROPbject:Starting' );

        if ( cborObject === null || typeof cborObject === 'undefined' || keyInformation === null || typeof keyInformation === 'undefined' )
        {   logger.error( applicationName + ':eudcc:_07_signCBOROPbject:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const outputCOSE               = process.env.OUTPUTCOSE;

        const headers = {
            p: { alg: 'ES256' },
            u: { kid: '11' }
          };

        const signer = {
            key: {
              d: Buffer.from( '6c1382765aec5358f117733d281c1c7bdc39884d04a45a1e6c67c858bc206c19', 'hex' )
            }
          };

        const verifier = {
            key: {
              x: Buffer.from('143329cce7868e416927599cf65a34f3ce2ffda55a7eca69ed8919a394d42f0f', 'hex'),
              y: Buffer.from('60f7f1a780d8a783bfb7a2dd6b2796e8128dbbcef9d3d168db9529971a36e7b9', 'hex')
            }
          };  

        const buf = await cose.sign.create( headers, cborObject, signer );

        const bufVerify = await cose.sign.verify(buf, verifier);
        //console.log('Verified message: ' + bufVerify.toString('utf8'));
        await fs.writeFile( outputCOSE, buf.toString('hex') );

        const response                 = { ...EC.noError } ;
        response.body                  = cborObject;

        logger.trace( applicationName + ':eudcc:_07_signCBOROPbject:Ending' );
        return response;

    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_07_signCBOROPbject:Exception caught: ',ex );
        return response;
    }


}


function _09_base45Encode ( encoded )
{   try
    {   logger.trace( applicationName + ':eudcc:_09_base45Encode:Starting' );

        if ( encoded === null || typeof encoded === 'undefined' )
        {   logger.error( applicationName + ':eudcc:_09_base45Encode:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const base45Encoded           = base45.encode( encoded );

        const sizeDifference          = Math.trunc( ( ( base45Encoded.length - encoded.length ) / encoded.length ) * 10000 ) / 100;

        logger.debug( applicationName + ':eudcc:_09_base45Encode:sizes cbor: [' + encoded.length + '] base45: [' + base45Encoded.length  + '];Size difference: [' + sizeDifference   + '%]' );

        const response                = { ...EC.noError } ;
        response.body                 = base45Encoded;
        logger.trace( applicationName + ':eudcc:_09_base45Encode:Ending' );
        return response;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_09_base45Encode:Exception caught: ',ex );
        return response;
    }
}

async function _10_zlibCompress ( base45Encoded )
{   try
    {   logger.trace( applicationName + ':eudcc:_10_zlibCompress:Starting' );

        if ( base45Encoded === null || typeof base45Encoded === 'undefined' )
        {   logger.error( applicationName + ':eudcc:_10_zlibCompress:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        const zlibCompressed          = zlib.deflateSync( base45Encoded );

        const sizeDifference          = Math.trunc( ( ( zlibCompressed.length - base45Encoded.length ) / base45Encoded.length ) * 10000 ) / 100;

        await fs.writeFile( zlibbed, zlibCompressed );

        logger.debug( applicationName + ':eudcc:_10_zlibCompress:sizes base45: [' + base45Encoded.length + '] zlib: [' + zlibCompressed.length  + '];Size difference: [' + sizeDifference   + '%]' );

        const response                = { ...EC.noError } ;
        response.body                 = zlibCompressed;
        logger.trace( applicationName + ':eudcc:_10_zlibCompress:Ending' );
        return response;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_10_zlibCompress:Exception caught: ',ex );
        return response;
    }
}

async function _11_transformZlibToQR ( inputData )
{   try
    {   logger.trace( applicationName + ':eudcc:_11_transformZlibToQR:Starting' );

        if ( inputData === null || typeof inputData === 'undefined' )
        {   logger.error( applicationName + ':eudcc:_11_transformZlibToQR:incorrect input parameters' );
            const response               = EC.badRequest;
            return response;
        }

        if ( inputData.length < 2953 )
        {   try
            {  await fs.unlink( qrCodeFile );
            }
            catch ( err )
            {  console.log( 'Nothing to delete' );
            }
            QRCode.toFile( qrCodeFile, [{ data: inputData }], {version :40, errorCorrectionLevel: 'L' }, function ( error )
                                 {  if ( error )
                                     {   logger.error( applicationName + ':eudcc:_11_transformZlibToQR:Error whilst generating QR code' );
                                     }
                                 } );
        }
        else
        {   const response                = { ...EC.badResult } ;
            response.body                 = 'Data exceeded 2953 bytes';
            logger.error( applicationName + ':eudcc:_11_transformZlibToQR:Data exceeded 2331 bytes' );
            return response;
        }

        const response                = { ...EC.noError } ;
        response.body                 = inputData;
        logger.trace( applicationName + ':eudcc:_11_transformZlibToQR:Ending' );
        return response;
    }
    catch   ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_11_transformZlibToQR:Exception caught: ',ex );
        return response;
    }
}


/*
   1. read a JSON schema
   2. generate a JSON document from the schema
   3. validate the JSON document against the schema
   4. write the JSON document to a file
   5. transform JSON file to CBOR file
   6. create singing tree with X509 certificates
   7. Sign the CBOR file with a private key as COSE_Sign1
   8. Write the COSE_Sign1 file to a file
   9. zlib compress the signed cbor file
   10.base 45 encode the zlibbed file   10.
   11. Transform the zlib file to a QR code
*/

async function JSON2QR ()
{   try
    {   logger.trace( applicationName + ':JSON2QR:Starting' );

        jsonDocument                     = ' ';
        const schema                     = _01_readJSONSchema();
        if ( schema.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'JSON2QR:Error in _01_readJSONSchema',schema );
            return schema;

        }
        logger.debug( applicationName + ':JSON2QR:_01_readJSONSchema is done succesfully' );

        const tempSchema                  = schema.body;
        const jsonDoc                    = await _02_generateJSONDocument( tempSchema );
        if ( jsonDoc.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'JSON2QR:Error in _02_generateJSONDocument',jsonDoc );
            return jsonDoc;
        }

        logger.debug( applicationName + ':JSON2QR:_02_generateJSONDocument is done succesfully' );

        const validation                = await _03_validateJSONDocument( schema.body, jsonDoc.body );

        if ( validation.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'JSON2QR:Error in _03_validateJSONDocument',validation );
            return validation;
        }

        logger.debug( applicationName + ':JSON2QR:_03_validateJSONDocument is done succesfully' );

        const result                   = await _04_writeJSONDocument( jsonDoc.body );

        if ( result.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'JSON2QR:Error in _04_writeJSONDocument',result );
            return result;
        }

        logger.debug( applicationName + ':JSON2QR:_04_writeJSONDocument is done succesfully' );

        const encoded                 = await _05_transformJSONToCBOR( result.body );

        if ( encoded.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'JSON2QR:Error in _05_transformJSONToCBOR',encoded );
            return encoded;
        }

        logger.debug( applicationName + ':JSON2QR:_05_transformJSONToCBOR is done succesfully' );

        const keyInformation        = {};

        const resultCose            = await _07_signCBOROPbject( encoded.body, keyInformation );

        if ( resultCose.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'JSON2QR:Error in _07_signCBOROPbject',resultCose );
            return resultCose;
        }

        logger.debug( applicationName + ':JSON2QR:_07_signCBOROPbject is done succesfully' );

        const zlibCompressed          = await _10_zlibCompress( resultCose.body );


        if ( zlibCompressed.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'JSON2QR:Error in _10_zlibCompress',zlibCompressed );
            return zlibCompressed;
        }

        logger.debug( applicationName + ':JSON2QR:_10_zlibCompress is done succesfully' );



        const base45Encoded           = await _09_base45Encode( zlibCompressed.body );

        if ( base45Encoded.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'JSON2QR:Error in _09_base45Encode',base45Encoded );
            return base45Encoded;
        }

        logger.debug( applicationName + ':JSON2QR:_09_base45Encode is done succesfully' );



        const resultQR                = await _11_transformZlibToQR( base45Encoded.body );

        if ( resultQR.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'JSON2QR:Error in _11_transformZlibToQR',resultQR );
            return resultQR;
        }

        logger.debug( applicationName + ':JSON2QR:_11_transformZlibToQR is done succesfully' );

        logger.trace( applicationName + ':JSON2QR:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':JSON2QR:Exception caught: ',ex );
        return response;
    }
}


async function  _21_decodeBase45Buffer ( inputData )
{   try
    {   logger.trace( applicationName + ':eudcc:_21_decodeBase45Buffer:Starting' );

        const ZlibData                 = base45.decode( inputData );

        const response                 = { ... EC.noError } ;
        response.body                  = ZlibData;
        logger.trace( applicationName + ':eudcc:_21_decodeBase45Buffer:Succesfully read file' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_21_decodeBase45Buffer:Exception caught: ',ex );
        return response;
    }
}

async function _22_decodeZlibBuffer ( inputData )
{   try
    {   logger.trace( applicationName + ':eudcc:_22_decodeZlibBuffer:Starting' );

        const decodedData              = zlib.inflateSync( inputData );

        const response                 = { ... EC.noError } ;
        response.body                  = decodedData;
        logger.trace( applicationName + ':eudcc:_22_decodeZlibBuffer:Succesfully read file' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_22_decodeZlibBuffer:Exception caught: ',ex );
        return response;
    }
}

async function _25_decodeCBORBuffer ( inputData )
{   try
    {   logger.trace( applicationName + ':eudcc:_25_decodeCBORBuffer:Starting' );

        const decodedData              = cbor.decode( inputData );

        const response                 = { ... EC.noError } ;
        response.body                  = decodedData;
        logger.trace( applicationName + ':eudcc:_25_decodeCBORBuffer:Succesfully read file' );
        return response;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:_25_decodeCBORBuffer:Exception caught: ',ex );
        return response;
    }
}


/* 21. decode base 45 code to zipped format
   22. unzip CBOR format
   23. extract Cose signature from CBOR
   24  validate cose signature
   25. decode cbor to json
   26. validate json against schema
   27. write json to file
*/
async function QR2JSON ( QRCodeBuffer )
{   try
    {   logger.trace( applicationName + ':eudcc:QR2JSON:Starting' );

        const resultBase45                   = await  _21_decodeBase45Buffer( QRCodeBuffer );
        if ( resultBase45.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':eudcc:QR2JSON:_21_scanQRCode returned errors',resultBase45 );
            return resultBase45;
        }

        logger.debug( applicationName + ':eudcc:QR2JSON:_21_scanQRCode is done succesfully' );

        const resultCBOR               = await _22_decodeZlibBuffer( resultBase45.body );

        if ( resultCBOR.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':eudcc:QR2JSON:_22_decodeZlibBuffer returned errors',resultCBOR );
            return resultCBOR;
        }

        logger.debug( applicationName + ':eudcc:QR2JSON:_22_decodeZlibBuffer is done succesfully' );

        const resultJSON              = await _25_decodeCBORBuffer( resultCBOR.body );

        if ( resultJSON.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':eudcc:QR2JSON:_25_decodeCBORBuffer returned errors',resultJSON );
            return resultJSON;
        }

        logger.debug( applicationName + ':eudcc:QR2JSON:_25_decodeCBORBuffer is done succesfully' );

        const schema                     = _01_readJSONSchema();

        if ( schema.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'QR2JSON:Error in _01_readJSONSchema',schema );
            return schema;

        }

        logger.debug( applicationName + ':QR2JSON:_01_readJSONSchema is done succesfully' );

        const validation                = await _03_validateJSONDocument( schema.body, JSON.stringify(resultJSON.body ));

        if ( validation.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + 'QR2JSON:Error in _03_validateJSONDocument',validation );
            return validation;
        }

        logger.debug( applicationName + ':QR2JSON:_03_validateJSONDocument is done succesfully' );
        const retVAl                 = { ... EC.noError } ;
        retVAl.body                  = JSON.stringify(resultJSON.body);

        return retVAl;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':eudcc:QR2JSON:Exception caught: ',ex );
        return response;
    }
}

module.exports.QR2JSON                     = QR2JSON;
module.exports.JSON2QR                     = JSON2QR;
