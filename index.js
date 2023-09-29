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
const fs                               = require( 'fs/promises' );
const cbor                             = require( 'cbor' );

const Logger                           = require( './services/loggerClass' );
const config                           = require( './services/configuration' );
const EC                               = require( './services/errorCatalog' );

const Validator                        = require( 'jsonschema' ).Validator;
const $RefParser                       = require( '@apidevtools/json-schema-ref-parser' );
// eslint-disable-next-line no-undef
const FileName                         = process.env.PDA1ACKNOWLEDGEMENTSCHEMA;
// eslint-disable-next-line no-undef
const dataSet                          = process.env.PDA1DATASET;
const outputJson                       = process.env.OUTPUTJSON;
let   jsonDocument                     = ' ';
let   lastSeqNo                        = 0;
const logFileName                      = config.get( 'application:logFileName' );
const applicationName                  = config.get( 'application:applicationName' );
const logger                           = new Logger( logFileName );


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
        const response                 = EC.noError;
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
        const response                 = EC.noError;
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
    {   let response                   = EC.noError;
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
            result                       = EC.badRequest;
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
            result                       = EC.badRequest;
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
        let response                   = EC.noError;
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



async function generateDataFromSchema ( schema, data )
{   try
    {   let response                   = EC.noError;

        if ( typeof schema === 'undefined' || schema === null || typeof data === 'undefined' || data === null )
        {   logger.error( applicationName + ':index:generateDataFromSchema:incorrect input parameters' );
            response                   = EC.badRequest;
            return response;
        }

        /*   dereferencing also allows any kinda crapm, should be followed by sanity
        */
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

        const validator                  = new Validator();
        let response                   = EC.noError;

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
        const response                   = EC.noError;
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
        console.log( encoded.length );


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
function 01_readJSONSchema()
{   try
    {

    }
    catch ( ex )
    {  

    }

}

async function main ()
{   try
    {   const introductionText = ( '\n\n\n\n\n\n\nHello and welcome to the world of JSON schema and data generation.\n' +
                                'This application will :\n' +
                                ' 1. generate a JSON document from a JSON schema.\n' +
                                ' 2. Schema validate it to make sure all is well\n' +
                                ' 3. written to a file. \n' +
                                ' 4. Transformed to a CBOR document (RFC8949 compliant).\n' +
                                ' 5. A  signing authority will bre created.\n' +
                                ' 6. The CBOR document will be signed with using COSE and assuming an X509 Certificate using RSA as encyption.\n' +
                                ' 7. encoded using base 45.\n' +
                                ' 8. ZLIBded.\n' +
                                ' 9. QRcoded.\n' +
                                ' 10.  The QR code will be written to a file. Enjoy!\n\n\n\n' +
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

        logger.trace( applicationName + ':index:main:Starting' );
        console.log( introductionText );
        logger.trace( applicationName + ':index:main:Ending' );
        return EC.noError;
    }
    catch ( ex )
    {   const response                 = EC.exception;
        response.body                  = ex;
        logger.exception( applicationName + ':index:main:Exception caught: ',ex );
        let result                     = 01_readJSONSchema();
        if ( result.returnCode !== EC.noError.returnCode )
        {   logger.error( applicationName + ':index:main:Error in readJSONSchema',result );
            return result;
        }

        return response;
    }
}

main();
