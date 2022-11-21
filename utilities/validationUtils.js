
/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
let isStringProvided = (param) => 
    param !== undefined && param.length > 0


// Feel free to add your own validations functions!
// for example: isNumericProvided, isValidPassword, isValidEmail, etc
// don't forget to export any 

/**
 * Checks the parameter to see if it is a String with a length greater than 5 ('@', '.', 'com'). com/net/org are all 3 letters
 * Also checks if String includes '@' and '.', and contains no white spaces
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a String with a length greater than 5, includes '@' and '.', and exclude spaces, false otherwise
 */
let isValidEmail = (param) =>
    param.includes('@') && 
    param.includes('.') && 
    !param.includes(' ') && 
    param.length > 5


/**
 * Checks the parameter to see if it is a String with a length greater than 4 (special character, digit, uppercase, lowercase).
 * Also checks if String does not include ' '  
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a String with a length greater than 4, includes special character, digit, uppercase, lowercase, and exclude spaces, false otherwise
 */
let isValidPassword = (param) =>
  /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])((?=.*\W)|(?=.*_))^[^ ]+$/.test(param) &&
  param.length > 4


function randomResetCode() {
  let result = "";
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let charactersLength = characters.length;
  for(let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


  
module.exports = { 
  isStringProvided, isValidEmail, isValidPassword, randomResetCode
}