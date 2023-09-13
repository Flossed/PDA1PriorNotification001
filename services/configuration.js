/* File             : configuration.js
   Author           : Daniel S. A. Khan
   Copywrite        : Daniel S. A. Khan (c) 2021   
   Notes            : 
   Description      : 
*/

/* ------------------     External Application Libraries      ----------------*/

const nconf                             = require('nconf');

/* ------------------ End External Application Libraries      ----------------*/

/* --------------- External Application Libraries Initialization -------------*/
/* ----------- End External Application Libraries Initialization -------------*/

/* ------------------     Internal Application Libraries      ----------------*/
/* ------------------ End Internal Application Libraries      ----------------*/

/* ------------------------------------- Controllers -------------------------*/
/* -------------------------------- End Controllers --------------------------*/

/* ------------------------------------- Services ----------------------------*/
/* -------------------------------- End Services -----------------------------*/

/* ------------------------------------- Models ------------------------------*/
/* -------------------------------- End Models -------------------------------*/

/* ---------------------------------  Application constants    ---------------*/
/* --------------------------------- End Application constants ---------------*/

/* --------------- Internal Application Libraries Initialization -------------*/
/* ----------- End Internal Application Libraries Initialization -------------*/

/* ------------------------------------- Functions   -------------------------*/
function Config()
{   try
    {   var environment
    
        console.log("configuration:Config:Starting")        
        
        nconf.file("default", "./config/default.json");
    } 
    catch(ex)
    {   console.log("configuration:Config:An Exception occurred:["+ex+"]")
    }
}

Config.prototype.get = function(key) 
{    return nconf.get(key);
};
/* --------------------------------- End Functions   -------------------------*/

/* ----------------------------------Module Initialization -------------------*/
module.exports = new Config();
/* ----------------------------------End Module Initialization ---------------*/

/* ----------------------------------External functions ----------------------*/
/* ----------------------------------End External functions ------------------*/

/* LOG:

*/










