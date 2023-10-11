function formulierActie(action) 
{   
    document.getElementById("actie").innerHTML  = action;
    console.log(document.getElementById("formulier")); 
    document.getElementById("formulier").submit();
 }


var _img = document.getElementById('QRCode');
var newImg = new Image;
newImg.onload = function() {
    _img.src = this.src;
}
newImg.src = '/img/QRCode.png';