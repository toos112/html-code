var renderUI = function(ctx) {
	ctx.font = "15px Arial";
	ctx.fillStyle = "#00ffff";
	ctx.fillText("fps:" + fps + " ups:" + ups,20,416);
	ctx.fillStyle = "#FFFF00";
	ctx.fillText("Coins:" + coins,20,448); 
	ctx.fillStyle = "#ff00ff";
	ctx.fillText("Lives:" + lives,20,480);

	ctx.rect(125,394,256,64);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(189,394);
ctx.lineTo(189,458);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(253,394);
ctx.lineTo(253,458);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(317,394);
ctx.lineTo(317,458);
ctx.stroke();
};