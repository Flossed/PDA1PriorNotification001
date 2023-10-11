/* File             : errorCatalog.js
   Author           : Daniel S. A. Khan
   Copywrite        : Daniel S. A. Khan (c) 2022
   Description      :
   Notes            :

*/

/* ------------------     External Application Libraries      ----------------*/
/* ------------------ End External Application Libraries      ----------------*/

/* --------------- External Application Libraries Initialization -------------*/
/* ----------- End External Application Libraries Initialization -------------*/

/* ------------------     Internal Application Libraries      ----------------*/
/* ------------------ End Internal Application Libraries      ----------------*/

/* ---------------------------------  Application constants    ----------------*/
/* --------------------------------- End Application constants ----------------*/

/* --------------- Internal Application Libraries Initialization -------------*/
/* ----------- End Internal Application Libraries Initialization -------------*/

/* ------------------------------------- Controllers -------------------------*/
/* -------------------------------- End Controllers --------------------------*/

/* ------------------------------------- Services ----------------------------*/
/* -------------------------------- End Services -----------------------------*/

/* --------------- Internal Variables Initialization -------------------------*/
const BAD_REQUEST                       = 0xff;
const BAD_RESULT                        = 0xfe;
const BAD_DATA                          = 0xfd;
const EXCEPTION                         = 0x0f;
const NO_ERROR                          = 0x00;
const SCHEMAVALIDATIONERROR             = 0x01;

const badRequest                          = { returnCode: BAD_REQUEST,
                                            returnMsg: 'Bad Request: Can\'t understand request: request contains either contains parameters that cannot be handled',
                                            body : {}
                                          };

const badData                            = { returnCode: BAD_DATA,
                                             returnMsg: 'Bad Data: Data is not correct',
                                             body : {}
                                           };
const badResult                           = { returnCode: BAD_RESULT,
                                            returnMsg: 'Bad Result: API returned an error',
                                            body : {}
                                          };

const exception                           = { returnCode: EXCEPTION,
                                            returnMsg: 'Exception: An Exception Occurred',
                                            body : {}
                                          };

const noError                             = {   returnCode: NO_ERROR,
                                              returnMsg: 'NO_ERROR: No Errors Encountered While processing request',
                                              body : {}
                                          };

const schemaValidationError               = {   returnCode: SCHEMAVALIDATIONERROR,
                                              returnMsg: 'SCHEMAVALIDATIONERROR: Errors Encountered while validating JSON instance against JSON Schema',
                                              body : {}
                                          };

/* ----------- End Internal Variables Initialization -------------------------*/


/* ------------------------------------- Functions   -------------------------*/
/* --------------------------------- End Functions   -------------------------*/
/* ----------------------------------External functions ----------------------*/
module.exports.badRequest                      = badRequest;
module.exports.badResult                       = badResult;
module.exports.badData                         = badData;
module.exports.exception                       = exception;
module.exports.noError                         = noError;
module.exports.schemaValidationError           = schemaValidationError;
module.exports.NO_ERROR                        = NO_ERROR;
module.exports.EXCEPTION                       = EXCEPTION;
module.exports.BAD_RESULT                      = BAD_RESULT;
module.exports.BAD_DATA                        = BAD_DATA;
module.exports.BAD_REQUEST                     = BAD_REQUEST;
module.exports.SCHEMAVALIDATIONERROR           = SCHEMAVALIDATIONERROR;


/* ----------------------------------End External functions ------------------*/


/* LOG:

*/
