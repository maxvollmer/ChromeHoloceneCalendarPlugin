
function makeCaseInsensitive(s)
{
  let returnString = "";
  for (let i = 0, n = s.length; i < n; i++) {
    returnString += "["+s[i].toLowerCase()+s[i].toUpperCase()+"]";
  }
  return returnString;
}

let OR = "|";
let SPACE = "[\\s\\u00A0]";
let DOT = "\\.";
let DOT_OR_DOTSPACE = "(?:"+DOT+OR+SPACE+OR+"(?:"+DOT+SPACE+"))";

let LOOKBEHIND = "(.?)";  // Javascript doesn't support actual lookbehinds, so we capture a "lookbehind" group to test later in the replace method
let LOOKAHEAD = "(?![0-9a-zA-Z])";


let MAX_CENTURY = 39;


let NUMBER_PATTERN_PLAIN = "(?:\\d{1,5})";
let NUMBER_PATTERN_COMMA = "(?:\\d{1,2}[,\\.]\\d{3})";
let NUMBER_PATTERN_RANGE = "(?:"+"(?:"+NUMBER_PATTERN_PLAIN+OR+NUMBER_PATTERN_COMMA+")"+SPACE+"?"+"(?:"+"(?:"+makeCaseInsensitive("and")+")"+OR+"[-–]"+"(?:"+SPACE+"?ca?.?)?"+")"+SPACE+"?"+"(?:"+NUMBER_PATTERN_PLAIN+OR+NUMBER_PATTERN_COMMA+")"+")";
let NUMBER_PATTERN_CENTURY = "(?:" + "(?:"+makeCaseInsensitive("the")+SPACE+")?"+"(?:(?:1st)|(?:2nd)|(?:3rd)|(?:(?:[4-9]|(?:[1-"+(Math.floor(MAX_CENTURY/10)-1)+"][0-9]))th))"+SPACE+"?"+"[-–]?"+SPACE+"?"+makeCaseInsensitive("century")+")";
let THE_NUMBER_PATTERN = "("+NUMBER_PATTERN_PLAIN+OR+NUMBER_PATTERN_COMMA+OR+NUMBER_PATTERN_RANGE+OR+NUMBER_PATTERN_CENTURY+")";

let NUMBER_PATTERN_RANGE_ALONE = "(" + NUMBER_PATTERN_PLAIN+OR+NUMBER_PATTERN_COMMA+")"+"("+SPACE+"?"+"(?:"+"(?:"+makeCaseInsensitive("and")+")"+OR+"[-–]"+"(?:"+SPACE+"?ca?.?)?"+")"+SPACE+"?"+")"+"("+NUMBER_PATTERN_PLAIN+OR+NUMBER_PATTERN_COMMA+")";
let NUMBER_PATTERN_CENTURY_ALONE = "("+makeCaseInsensitive("the")+SPACE+")?"+"((?:1st)|(?:2nd)|(?:3rd)|(?:(?:[4-9]|(?:[1-"+(Math.floor(MAX_CENTURY/10)-1)+"][0-9]))th))"+SPACE+"?"+"[-–]?"+SPACE+"?"+makeCaseInsensitive("century");


let CENTURY_NUMBER_PATTERN = "("+"(?:1st)|(?:2nd)|(?:3rd)|(?:(?:[4-9]|(?:[1-"+(Math.floor(MAX_CENTURY/10)-1)+"][0-9]))th)"+SPACE+"?"+"[-–]?"+SPACE+"?"+")";
let PATTERN_CENTURY_GLOBAL = "(?:"+makeCaseInsensitive("the")+SPACE+")?"+CENTURY_NUMBER_PATTERN+makeCaseInsensitive("century");


let SINGLE_BC_PATTERNS = [
  "BCE?", //BC, BCE
  "v" + DOT_OR_DOTSPACE + "[cC]hr",  //v.chr, v. chr, v chr, v.Chr, v. Chr, v Chr
  "a" + DOT_OR_DOTSPACE + "[cC]hr" + DOT_OR_DOTSPACE + "n",  //a.chr.n, a Chr n...
  "v" + DOT_OR_DOTSPACE + "d" + DOT_OR_DOTSPACE + "[zZ]"  //v.d.z...
];

let BC_PATTERN = "(?:"+"(?:"+SINGLE_BC_PATTERNS.join(")|(?:")+")"+")";

let BC_PATTERN_BEFORE = "(?:"+THE_NUMBER_PATTERN+SPACE+"?"+BC_PATTERN+")";
let BC_PATTERN_AFTER = "(?:"+BC_PATTERN+SPACE+"?"+THE_NUMBER_PATTERN+")";


let SINGLE_AD_PATTERNS = [
  "AD",
  "CE",
  "n"+DOT_OR_DOTSPACE+"[cC]hr",  //n.chr, n. chr, n chr, n.Chr, n. Chr, n Chr
  "n"+DOT_OR_DOTSPACE+"(?:u|d)"+DOT_OR_DOTSPACE+"[zZ]", //n.d.z, n.u.z...
  makeCaseInsensitive("anno")+"(?:"+SPACE+makeCaseInsensitive("domini")+")?" //anno or anno domini (not case-sensitive)
];

let AD_PATTERN = "(?:"+"(?:"+SINGLE_AD_PATTERNS.join(")|(?:")+")"+")";

let AD_PATTERN_BEFORE = "(?:"+THE_NUMBER_PATTERN+SPACE+"?"+AD_PATTERN+")";
let AD_PATTERN_AFTER = "(?:"+AD_PATTERN+SPACE+"?"+THE_NUMBER_PATTERN+")";


let REGEX = new RegExp(LOOKBEHIND+"(?:"+BC_PATTERN_BEFORE+OR+BC_PATTERN_AFTER+OR+AD_PATTERN_BEFORE+OR+AD_PATTERN_AFTER+")"+LOOKAHEAD, "gm");

let REGEX_CENTURY_GLOBAL = new RegExp(PATTERN_CENTURY_GLOBAL, "gm");


let NUMBER_PLAIN_REGEX = new RegExp("^"+NUMBER_PATTERN_PLAIN+"$", "m");
let NUMBER_COMMA_REGEX = new RegExp("^"+NUMBER_PATTERN_COMMA+"$", "m");
let NUMBER_RANGE_REGEX = new RegExp("^"+NUMBER_PATTERN_RANGE_ALONE+"$", "m");
let NUMBER_CENTURY_REGEX = new RegExp("^"+NUMBER_PATTERN_CENTURY_ALONE+"$", "m");

let NUMBER_REGEX = /^\d$/;
let ALPHANUM_REGEX = /^[0-9a-zA-Z]$/;

let NONUM_REGEX = /[^\d]+/gim;

let INVALID_YEAR = "INVALID_YEAR";

function convertYear(year, isBC, isBefore, lookBehind) {

  if (!parseInt(year)) {
    return INVALID_YEAR;
  }

  if (isBefore && lookBehind) {
    if (NUMBER_REGEX.test(lookBehind) && year.length < 5) {
      year = lookBehind + "" + year;
      lookBehind = "";
    }
    else if (ALPHANUM_REGEX.test(lookBehind)) {
      return INVALID_YEAR;
    }
  }
  
  let yearAsInt = parseInt(year);
  if (!yearAsInt) {
    return INVALID_YEAR;
  }
  
  let heYear;
  if (isBC) {
    heYear = 10001 - yearAsInt;
  }
  else {
    heYear = yearAsInt + 10000;
  }
  
  if (heYear % 50 == 1) {
    //assume years like 8051 or 6101 are approximate values (originally 1950 BC or 3900 BC)
    heYear = heYear - 1;
  }
  
  let returnValue;
  if (heYear < 0) {
    returnValue = ((!!lookBehind)?lookBehind:"") + "" + (-heYear) + " BHE";
  }
  else {
    returnValue = ((!!lookBehind)?lookBehind:"") + "" + heYear + " HE";
  }
  
  return returnValue;
}


function convertYearString(match, lookBehind, yearString, isBC, isBefore) {

  let convertedYearString = INVALID_YEAR;

  if (NUMBER_CENTURY_REGEX.test(yearString)) {
    let match = NUMBER_CENTURY_REGEX.exec(yearString);
    if (match) {
      let century = parseInt(match[2].replace(NONUM_REGEX, ""));
      if (century > 0 && century <= MAX_CENTURY) {
        let centuryYear = (century - 1) * 100;
        if (isBC) {
          centuryYear = centuryYear+1;
        }
        let year = convertYear(""+centuryYear, isBC, (!match[1]) && isBefore, lookBehind);
        if (year !== INVALID_YEAR) {
          convertedYearString = year;
        }
      }
    }
  }
  else if (NUMBER_RANGE_REGEX.test(yearString)) {
    let match = NUMBER_RANGE_REGEX.exec(yearString);
    if (match) {
      let year1 = convertYear(match[1], isBC, isBefore, lookBehind);
      let inbetween = match[2];
      let year2 = convertYear(match[3], isBC, false);
      if (year1 !== INVALID_YEAR && year2 !== INVALID_YEAR) {
        convertedYearString = year1 + inbetween + year2;
      }
    }
  }
  else if (NUMBER_COMMA_REGEX.test(yearString) || NUMBER_PLAIN_REGEX.test(yearString)) {
    let year = convertYear(yearString.replace(NONUM_REGEX, ""), isBC, isBefore, lookBehind);
    if (year !== INVALID_YEAR) {
      convertedYearString = year;
    }
  }
  
  return convertedYearString;
}


function replaceYear(match, lookBehind, yearBCBefore, yearBCAfter, yearADBefore, yearADAfter, offset, string) {
  let convertedYearString = INVALID_YEAR;
  if (yearBCBefore) {
    convertedYearString = convertYearString(match, lookBehind, yearBCBefore, true, true);
  }
  else if (yearBCAfter) {
    convertedYearString = convertYearString(match, lookBehind, yearBCAfter, true, false);
  }
  else if (yearADBefore) {
    convertedYearString = convertYearString(match, lookBehind, yearADBefore, false, true);
  }
  else if (yearADAfter) {
    convertedYearString = convertYearString(match, lookBehind, yearADAfter, false, false);
  }
  console.log("match: " + match + "\n" + "convertedYearString: " + convertedYearString);
  if (convertedYearString !== INVALID_YEAR) {
    return convertedYearString;
  }
  else {
    return match;
  }
}


function replaceCentury(match, centuryValue) {
  let century = parseInt(centuryValue.replace(NONUM_REGEX, ""));
  if (century > 0 && century <= MAX_CENTURY) {
    let centuryYear = (century - 1) * 100;
    let year = convertYear(""+centuryYear, false, false);
    if (year !== INVALID_YEAR) {
      return year;
    }
  }
  return match;
}



function test() {
  let myString = "2345 BC 2345 BC BC 2345";

  // reset regex
  REGEX.lastIndex = 0;
  
  console.log(REGEX.source);

  var newString = myString.replace(REGEX, replaceYear);
  console.log("myString: " + myString + "\n" + "newString: " + newString);
}
test();


function replaceYearInTextNode(textNode) {
  // reset regex
  REGEX.lastIndex = 0;
  // replace years
  textNode.textContent = textNode.textContent.replace(REGEX, replaceYear).replace(REGEX_CENTURY_GLOBAL, replaceCentury);
}

function replaceYearInAllTexts(textNode) {
  let allElements = document.getElementsByTagName("*");
  for (let i = 0, n = allElements.length; i < n; i++) {
    let element = allElements[i];
    // check that element is visible
    if (!!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)) {
      let children = element.childNodes;
      for (let j = 0, m = children.length; j < m; j++) {
        let child = children[j];
        if (child.nodeType === Node.TEXT_NODE) {
          replaceYearInTextNode(child);
        }
      }
    }
  }
}

replaceYearInAllTexts();
