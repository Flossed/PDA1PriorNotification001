/* File             : zndLoggerClass.js
   Author           : Daniel S. A. Khan
   Copywrite        : Daniel S. A. Khan (c) 2021
   Notes            :
   Description      :
*/

/* ------------------     External Application Libraries      ----------------*/
const winston                           = require('winston')
/* ------------------ End External Application Libraries      ----------------*/

/* --------------- External Application Libraries Initialization -------------*/
/* ----------- End External Application Libraries Initialization -------------*/

/* ------------------     Internal Application Libraries      ----------------*/
/* ------------------ End Internal Application Libraries      ----------------*/

/* --------------- Internal Application Libraries Initialization -------------*/
/* ----------- End Internal Application Libraries Initialization -------------*/

/* ------------------------------------- Controllers -------------------------*/
/* -------------------------------- End Controllers --------------------------*/

/* ------------------------------------- Services ----------------------------*/
const config                            = require('../services/configuration')
/* -------------------------------- End Services -----------------------------*/

/* ------------------------------------- Models ------------------------------*/
/* -------------------------------- End Models -------------------------------*/

/* ---------------------------------  Application constants    ----------------*/
const logTracelevel                     = config.get('application:logTracelevel')


var options = {};

dateFormat = () => {
                       return new Date(Date.now()).toLocaleString("de-DE", options);
                   }
                   
var loggingLevels                       = {   levels: {   exception   : 0,
                                                          error       : 1, 
                                                          warn        : 2, 
                                                          info        : 3, 
                                                          http        : 4, 
                                                          debug       : 5, 
                                                          trace       : 6                                                           
                                                       }
                                           };

                   
/* --------------------------------- End Application constants ----------------*/


/* ------------------------------------- Functions   -------------------------*/
class LoggerService
{    constructor(route)               
     {   var temp                       = dateFormat()
         var temp1                      = temp.split(',')
         var datestruct                 = {}
         
         datestruct                     = temp1[0].split('/')
         
         this.log_data                  = null
         this.route                     = route+"-"+datestruct[2]+datestruct[0] +datestruct[1]
         if ( config.get('application:consoleOutput').includes('on'))             
                                                                               { }
         const logger                   =  config.get('application:consoleOutput').includes('on') ? winston.createLogger({   levels: loggingLevels.levels ,
                                                                   level: logTracelevel,
                                                                   transports: [
                                                                      new winston.transports.Console(),
                                                                      new winston.transports.File({
                                                                        filename: `./logs/${this.route}.log`
                                                                      })
                                                                   ],
                                                                   format: winston.format.printf((info) => {   let LogString                  = `${info.level.toUpperCase()}`
                                                                                                               let paddedLogString            = LogString.padStart(9)
                                                                                                               let message = `${dateFormat()} | ${paddedLogString} | ${info.message} | `
                                                                                                               message = info.obj ? message + `data:${JSON.stringify(info.obj)} | ` : message
                                                                                                               message = this.log_data ? message + `log_data:${JSON.stringify(this.log_data)} | ` : message
                                                                                                               return message
                                                                                                            })
                                             }) : winston.createLogger({   levels: loggingLevels.levels ,
                                                                   level: logTracelevel,
                                                                   transports: [                                               
                                                                      new winston.transports.File({
                                                                        filename: `./logs/${this.route}.log`
                                                                      })
                                                                   ],
                                                                   format: winston.format.printf((info) => {   let LogString                  = `${info.level.toUpperCase()}`
                                                                                                               let paddedLogString            = LogString.padStart(9)
                                                                                                               let message = `${dateFormat()} | ${paddedLogString} | ${info.message} | `
                                                                                                               message = info.obj ? message + `data:${JSON.stringify(info.obj)} | ` : message
                                                                                                               message = this.log_data ? message + `log_data:${JSON.stringify(this.log_data)} | ` : message
                                                                                                               return message
                                                                                                            })
                                             })
                                             ;
         this.logger                    = logger
     }

     async info(message)
     {   if ( typeof message !== 'undefined' )  
         { this.logger.log('info', message)
         }
         else
          console.log("ERROR :! message passed!!!")
     }


     async info(message, obj)
     {   
         if ( typeof message !== 'undefined' ) 
         {   
             if ( typeof obj !== 'undefined' )  
             { this.logger.log('info', JSON.stringify(obj))              
             }
             else 
              this.logger.log('info', message);
         } 
         else
          console.log("ERROR :! message passed!!!")
         
     }
     
     async trace(message)
     {   this.logger.log('trace', message)         
     }


     async trace(message, obj)
     {   if ( typeof obj !== 'undefined' )  
         { this.logger.log('trace', JSON.stringify(obj))              
         }
         else 
         {   this.logger.log('trace', message);
         } 
     }
     
     
     async debug(message)
     {   this.logger.log('debug', message);
     }



     async debug(message, obj)
     {   this.logger.log('debug', message,{obj})
     }



     async error(message)
     {   this.logger.log('error', message);
     }



     async error(message, obj)
     {   this.logger.log('error', message, {
                                             obj
                                           })
     }

     async exception(message)
     {   this.logger.log('exception', message)
     }

     async exception(message, obj)
     {   this.logger.log('exception', message, {
                                             obj
                                           })
     }

}
/* --------------------------------- End Functions   -------------------------*/


/* ----------------------------------Module Initialization ------------------*/
/* ----------------------------------End Module Initialization ---------------*/

/* ----------------------------------External functions ----------------------*/
module.exports = LoggerService
/* ----------------------------------End External functions ------------------*/


/* LOG:

*/