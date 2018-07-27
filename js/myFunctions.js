
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRGBa(numOfSteps, step, alpha) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch(i % 6){
        case 0: r = 1; g = f; b = 0; break;
        case 1: r = q; g = 1; b = 0; break;
        case 2: r = 0; g = 1; b = f; break;
        case 3: r = 0; g = q; b = 1; break;
        case 4: r = f; g = 0; b = 1; break;
        case 5: r = 1; g = 0; b = q; break;
    }

    //hex is hex value
    var hex = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
 return hex;
   /* r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }    */
}

/*function hexToRGB(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }
}

hexToRGB('#FF0000', 0.5);*/

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
    , seconds        = parseInt((duration/1000)%60)
    , minutes        = parseInt((duration/(1000*60))%60)
    , hours          = parseInt((duration/(1000*60*60))%24);

    hours   = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    //return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    return hours + ":" + minutes + ":" + seconds
}

function msToTime1(s) {
  var ms   = s % 1000;
  s        = (s - ms) / 1000;
  var secs = s % 60;
  s        = (s - secs) / 60;
  var mins = s % 60;
  var hrs  = (s - mins) / 60;

  return hrs + ':' + mins + ':' + secs + '.' + ms;
}

function getDateTime(){
    var d = new Date();
    return d;
    //return d.toLocaleString();
}
// console.log(event.toLocaleString('en-GB', { timeZone: 'UTC' }));
function getDateTimeStr(){
    var d = new Date();
    return d.toLocaleString('en-GB',{});
}

function add(a, b) {
    return a + b;
}

function toTimestamp(year,month,day,hour,minute,second){
 var datum          = new Date(Date.UTC(year,month-1,day,hour,minute,second));
 var timezoneOffset = datum.getTimezoneOffset() * 60;

 return (datum.getTime()/1000 + timezoneOffset);
}

function setDateTimeNow(str){
    if (str==""){
        var full = getDateTimeStr()
        $("#myDate").val(full);    
    }else{
        $("#myDate").val(str); 
    }

}
function setRxLimit(){
    RX_LIMIT=$("#myRxLimit").val();
    if (RX_LIMIT <=0)
        console.log("Receive Limit : Unlimited");
    else
        console.log("Receive Limit : "+RX_LIMIT);
}


function setInitTimeStamp(){
    var full = $("#myDate").val();
    var temp = full.split(',')
    var date = temp[0].split('/')
    var time = temp[1].split(':');

    TIMESTAMP_INIT = toTimestamp(date[2],date[1],date[0],time[0],time[1],time[2]);
    console.log("Init Date: " + full + " [Timestamp: " + TIMESTAMP_INIT + "]")
}


function getDbmFromLvl(power_level){

    if (TEST_HW){
        return (MIN_TX_POWER_DB + power_level);
    }
    else{
        switch (power_level){
            case 0:
                return (-25);
                break;
            case 1:
                return (-15);
                break;
            case 2:
                return (-10);
                break;
            case 3:
                return (-7);
                break;
            case 4:
                return (-5);
                break;
            case 5:
                return (-3);
                break;
            case 6:
                return (-1);
                break;
            case 7:
                return (0);
                break;
            default:
                return "N/A";
        }
    }
}
