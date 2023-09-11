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
require('dotenv').config();

var Validator                          = require('jsonschema').Validator;
const $RefParser                       = require( "@apidevtools/json-schema-ref-parser" );
const FileName                         = process.env.PDA1ACKNOWLEDGEMENTSCHEMA; 
const dataSet                          = process.env.PDA1DATASET; 
var   jsonDocument                     = " ";
var   booleanValues                    = ["true", "false"]; 
var   lastSeqNo                        = 0;

async function getJSONSchema(fileName) 
{   try 
    {   const schema                   = require(fileName);
        return schema;
    }
    catch (ex) 
    {   console.error("Error in getJSONSchema: " + ex.message);
        return null;
    }
}


function getJsonReference(schema, ref)
{   try 
    {   let arrayOfDefs = Object.entries(schema.$defs);
        
        for(let i = 0; i < arrayOfDefs.length; i++)
        {   let definition             =  arrayOfDefs[i][0]            
            let refIS                  = ref[0].slice(2);            
            if (refIS.includes(definition)) 
            {   if( Object.keys(arrayOfDefs[i][1])[0].includes("ref") ) 
                {   let retval         = getJsonReference(schema, Object.values(arrayOfDefs[i][1])); 
                    return retval;
                }
                else
                {   return arrayOfDefs[i][1];
                } 
            } 
        }        
        return null;
    }
    catch (ex)
    {   console.error("Error in getJsonReference: " + ex.message);
        return null;
    }
}


async function insertObject(schema, object, data)
{   try 
    {   let lastStringChar             = jsonDocument[jsonDocument.length - 1 ]; 

        if( lastStringChar === "{" ) 
        {   jsonDocument               = jsonDocument.concat("\"");            
        }    
        else
        {   jsonDocument               = jsonDocument.concat(",\"");            
        }
        jsonDocument                   = jsonDocument.concat(object[0],"\"", ": ");
        jsonDocument                   = jsonDocument.concat("{" );                                                        

        await traverseObject(schema, object[1].properties,data);  
        jsonDocument                   = jsonDocument.concat("}" );                       
    }
    catch(ex)
    {   console.error("Error in insertObject: " + ex.message);
        return null;    
    }   
}



async function generateRandomString(stringDef)
{   let maxStringLength                = 10000;  
    let tempString                     = "";
    if (typeof stringDef.maxLength === 'number')
    {   maxStringLength                = stringDef.maxLength; 
    }   
    for(let i = 0; i < maxStringLength; i++)
    {    tempString                    = tempString.concat(String.fromCharCode(Math.round(Math.random() * (122 - 97) + 97)));
    } 
    return tempString
} 



async function insertString(schema, object, items)
{   try 
    {   let lastStringChar;
        
        if (typeof items !== 'undefined')
        {   for (let i = 0; i < items.length; i++)
            {   if (items[i][0] === object[0])
                {   let arrayObjects   = Object.entries(items[i][1] )[0][1];                    
                    let randomIndex    = Math.floor(Math.random() * (arrayObjects.length));
                    lastStringChar     = jsonDocument[jsonDocument.length - 1 ]; 

                    if( lastStringChar === "{" ) 
                    {   jsonDocument   = jsonDocument.concat("\"");            
                    }    
                    else
                    {   jsonDocument   = jsonDocument.concat(",\"");            
                    }
                    jsonDocument       = jsonDocument.concat(object[0],"\"", ": ");
                    jsonDocument       = jsonDocument.concat("\"",arrayObjects[randomIndex],"\""); 
                    return null; 
                } 
            }
        }

        lastStringChar                 = jsonDocument[jsonDocument.length - 1 ]; 

        if( lastStringChar === "{" ) 
        {   jsonDocument               = jsonDocument.concat("\"");            
        }    
        else
        {   jsonDocument               = jsonDocument.concat(",\"");            
        }
        jsonDocument                   = jsonDocument.concat(object[0],"\"", ": ");                                                          
        
        if (typeof object[1].maxLength === 'number')
        {   jsonDocument = jsonDocument.concat("\"", await generateRandomString(object[1]), "\"");        
        }   
    }
    catch(ex)
    {   console.error("Error in insertObject: " + ex.message);
        return null;
    } 
}


async function insertNumber(schema, object, items)
{   try 
    {   let lastStringChar;
        let seqNo                      = 0; 

        lastStringChar                 = jsonDocument[jsonDocument.length - 1 ]; 

        if( lastStringChar === "{" ) 
        {   jsonDocument               = jsonDocument.concat("\"");            
        }    
        else
        {   jsonDocument               = jsonDocument.concat(",\"");            
        }
        jsonDocument                   = jsonDocument.concat(object[0],"\"", ": "); 
        
        if (object[0] === "seqno")
        {   seqNo                      = lastSeqNo +1 ;
            lastSeqNo                  = seqNo;
        }
        else
        {  seqNo                       = Math.floor(Math.random() * 10);
        }
        jsonDocument                   = jsonDocument.concat( seqNo.toString());                   
    }
    catch(ex)
    {   console.error("Error in insertObject: " + ex.message);
        return null;    
    }   
}


async function insertRandomAmountOfNationlities(schema, item, data)
{   try
    {   let nationalityArray = item[1].items.enum; 
        let randomIndex                = Math.floor(Math.random() * (nationalityArray.length - 1));
        lastStringChar                 = jsonDocument[jsonDocument.length - 1 ];
        if( lastStringChar === "{" ) 
        {   jsonDocument               = jsonDocument.concat("\"");            
        }    
        else
        {   jsonDocument               = jsonDocument.concat(",\"");            
        }
        jsonDocument                   = jsonDocument.concat(item[0],"\"", ":[");
        for(let i = 0; i < randomIndex; i++) 
        {   lastStringChar             = jsonDocument[jsonDocument.length - 1 ];
            if( lastStringChar === "[" ) 
            {   jsonDocument           = jsonDocument.concat("\"");            
            }    
            else
            {   jsonDocument           = jsonDocument.concat(",\"");            
            } 
            jsonDocument = jsonDocument.concat(nationalityArray[i],"\"");   
        } 
        jsonDocument                   = jsonDocument.concat("]");        
     } 
    catch(ex)
    {   console.error("Error in insertRandomAmountOfNationlities: " + ex.message);
        return null;
    }
}


async function insertEmployerSelfEmployedActivityCodes(schema, item, data)  
{   try
    {   let randomIndex                = Math.floor(Math.random() * (10)) +1;
        lastStringChar                 = jsonDocument[jsonDocument.length - 1 ];
        if( lastStringChar === "{" ) 
        {   jsonDocument               = jsonDocument.concat("\"");            
        }    
        else
        {   jsonDocument               = jsonDocument.concat(",\"");            
        }
        jsonDocument                   = jsonDocument.concat(item[0],"\"", ":[");
        for(let i = 0; i < randomIndex; i++) 
        {   lastStringChar             = jsonDocument[jsonDocument.length - 1 ];
            if( lastStringChar === "[" ) 
            {   jsonDocument           = jsonDocument.concat("\"");            
            }    
            else
            {   jsonDocument           = jsonDocument.concat(",\"");            
            } 
           jsonDocument                = jsonDocument.concat(await generateRandomString( item[1].items),"\"");             
       } 
       jsonDocument                    = jsonDocument.concat("]");   
   }
   catch(ex)
   {   console.error("Error in insertEmployerSelfEmployedActivityCodes: " + ex.message);
       return null;
   } 
}
 

 async function insertArrayObjects(schema, item, data)
{   try
    {   let randomIndex                = Math.floor(Math.random() * (10)) +1;
        lastStringChar                 = jsonDocument[jsonDocument.length - 1 ];
        if( lastStringChar === "{" ) 
        {   jsonDocument               = jsonDocument.concat("\"");            
        }    
        else
        {   jsonDocument               = jsonDocument.concat(",\"");            
        }
        jsonDocument                   = jsonDocument.concat(item[0],"\"", ":[");
        for(let i = 0; i < randomIndex; i++) 
        {   lastStringChar             = jsonDocument[jsonDocument.length - 1 ];
            if( lastStringChar === "[" ) 
            {   jsonDocument           = jsonDocument.concat("{");            
            }    
            else
            {   jsonDocument           = jsonDocument.concat(",{");            
            }
            await traverseObject(schema, item[1].items.properties, data); 
            jsonDocument = jsonDocument.concat("}");              
        } 
        jsonDocument = jsonDocument.concat("]"); 
    }
    catch(ex)
    {   console.error("Error in insertEmployerSelfEmployedActivityCodes: " + ex.message);
        return null;
    } 
 }


 async function insertEmum(schema, item, data)
{   try
    {   let randomIndex                = Math.floor(Math.random() * (item[1].enum.length));
        lastStringChar                 = jsonDocument[jsonDocument.length - 1 ]; 

        if( lastStringChar === "{" ) 
        {   jsonDocument               = jsonDocument.concat("\"");            
        }    
        else
        {   jsonDocument               = jsonDocument.concat(",\"");            
        }
        jsonDocument                   = jsonDocument.concat(item[0],"\"", ": ");
        jsonDocument                   = jsonDocument.concat("\"",item[1].enum[randomIndex],"\"");   
    }
    catch(ex)
    {   console.error("Error in insertEmum: " + ex.message);
        return null;
    } 
 }


async function insertBoolean(schema, item, data)
{   try
    {   let last1StringChar            = jsonDocument[jsonDocument.length - 1 ]; 
        
        if( last1StringChar === "{" ) 
        {   jsonDocument               = jsonDocument.concat("\"");            
        }    
        else
        {   jsonDocument               = jsonDocument.concat(",\"");            
        }
        jsonDocument                   = jsonDocument.concat(item[0],"\"", ": ");
        jsonDocument                   = jsonDocument.concat("true");
    }
    catch(ex)
    {   console.error("Error in insertBoolean: " + ex.message);
        return null;
    } 
 }


async function insertArray(schema, item, data)
{   try
    {  switch(item[0])
       {   case "nationalities"                      : await insertRandomAmountOfNationlities(schema, item, data);                                                                                     
                                                       break;
           case "employerSelfEmployedActivityCodes"  : await insertEmployerSelfEmployedActivityCodes(schema, item, data);                        
                                                       break;
           case "workPlaceNames"                     : await insertArrayObjects(schema, item, data);                                           
                                                       break;
           case "workPlaceAddresses"                 : lastSeqNo = 0;
                                                       await insertArrayObjects(schema, item, data);    
                                                       break;                         
           default                                   : console.log('Found Array',item[0]);                  
        } 
     }
     catch(ex)
     {   console.error("Error in insertArray: " + ex.message);
         return null;
     }
}


async function  getOtherTypeOfItem(schema, item, data)
{   try
    {   let getOtherTypeOfItem         = 'unknown type'; 

        if ( typeof item[1].enum !== 'undefined')
        {   getOtherTypeOfItem         = 'enum';
        }
        else 
        {   if (item[1].type =='boolean')
            {   getOtherTypeOfItem     = 'boolean';
            }
            else 
            if( item[1].type === 'array')
            {    getOtherTypeOfItem    = 'array';
            }
        }     
        return getOtherTypeOfItem;     
    }
    catch(ex)
    {   console.error("Error in getOtherTypeOfItem: " + ex.message);
        return null;
    } 
}


async function insertOthers(schema, item, data)
{   try
    {   typeOfItem = await getOtherTypeOfItem(schema, item, data);
        switch(typeOfItem)
        {   case 'boolean' : await insertBoolean(schema, item, data);
                             break;
            case 'enum'    : await insertEmum(schema, item, data);
                             break;  
            case 'array'   : await insertArray(schema, item, data);
                             break;  
            default        : console.log('unknown type', item);
                             break;    
        }  
    }  
    catch(ex)
    {   console.error("Error in manageItem: " + ex.message);    
        return null;
    }
}



async function manageItem2(schema,item, data) 
{   try
    {   let enumObject                 = typeof item[1].enum !== 'undefined' ? item[1].enum : null; 
        switch(item[1].type )
        {   case 'object' :   await insertObject(schema, item, data);  
                              break;
            case 'string' :   await insertString(schema, item, data);
                              break;
            case 'number' :   await insertNumber(schema, item, data);
                              break;
            default       :   await insertOthers(schema, item, data);                               
                              break;         
        }
    }
    catch(ex)
    {   console.error("Error in manageItem: " + ex.message);
        return null;
    }
}



async function traverseObject(schema, jsonObject, data)
{   try
    {   let arrayOfProperties          = Object.entries(jsonObject);          
        
        for (let i = 0; i < arrayOfProperties.length; i++)
        {   await manageItem2 (schema, arrayOfProperties[i], data);
        }
    }
    catch(ex)
    {   console.error("Error in traverseProperties: " + ex.message);  
        return null;
    }
}



async function generateDataFromSchema(schema, data) 
{   try
    {   if (!schema) 
        {   console.log("No schema found"); 
             return null
        }

        const schemaObject             = await $RefParser.dereference( schema, {allowUnknownAttributes: false} );               
        
        jsonDocument                   = jsonDocument.concat("{" );
        await traverseObject(schemaObject, schemaObject.properties,data);
        jsonDocument                   = jsonDocument.concat("}" );
        return null;
    } 
    catch(ex)
    {   console.error("Error in generateDataFromSchema: " + ex.message);
        return null;
    }
}

async function validateSchema(schema, jsonInput)
{   try
    {   console.log("Starting validateSchema");
        var validator                  = new Validator();
        validator.debug                = true;
        const schemaObject             = await $RefParser.dereference( schema, {allowUnknownAttributes: false} );
        const valResult                = validator.validate(JSON.parse(jsonInput), schemaObject);
        console.log(valResult.errors);           
    } 
    catch(ex)
    {   console.error("Exception caught in validateSchema: " + ex.message);        
        return null;      
    }    
}   

async function main()
{   try
    {   console.log("Starting main");
        const jsonInput                = {}; 
        const schema                   = await getJSONSchema(FileName);        
        const data                     = Object.entries(await getJSONSchema(dataSet)); 
           
        await generateDataFromSchema(schema,data);                 
        await validateSchema(schema, jsonDocument);   
        console.log(jsonDocument);
    } 
    catch(ex)
    {   console.error("Error in main: " + ex.message);
        return null;      
    }
}


main();
