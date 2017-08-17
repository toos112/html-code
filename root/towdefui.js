let img = new Image();
img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAIAAADZr\
BkAAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAC\
SSURBVDhP1ZDBDYAgEAQpgRIogRLo/0MplIAbFvE4LkqMH+dhVtiBU1df8akWY3TO4VlKGbnvNb\
TGnvceme2cM3Pb70wvFNgDyKONLC+8tJSSOhLIFWlOvVULIfR0zsI89dQkEumAu6kkan1Lw++VV\
4EtDROO30t0yfy89SzjbJoAbaImBIYG0FurElt75AdarQcegkNyqeBZYAAAAABJRU5ErkJggg==";

var renderUI = function(ctx) {
	ctx.font = "12px Arial";
	ctx.fillStyle = "#00ffff";
	ctx.fillText("fps:" + fps + " ups:" + ups,10,399);
	ctx.font = "15px Arial";
	ctx.fillStyle = "#FFFF00";
	ctx.fillText(coins,35,414); 
	ctx.fillStyle = "#ff00ff";
	ctx.fillText(lives,70,414);

	ctx.beginPath();
	ctx.rect(372,400,128,96);
	ctx.moveTo(404,400);
	ctx.lineTo(404,496);
	ctx.moveTo(436,400);
	ctx.lineTo(436,496);
	ctx.moveTo(468,400);
	ctx.lineTo(468,496);
	ctx.moveTo(372,432);
	ctx.lineTo(500,432);
	ctx.moveTo(372,464);
	ctx.lineTo(500,464);
	ctx.stroke();
	
	if (mouseIsTile) {
		ctx.fillStyle = "#ffffff";
		ctx.fillText("tilename:" + mouseTile.name,30,30);
	}
	
	ctx.drawImage(img, 50, 50);
};