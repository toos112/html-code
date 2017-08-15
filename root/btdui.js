var renderUI = function(ctx) {
	ctx.font = "15px Arial";
	ctx.fillStyle = "#00ffff";
	ctx.fillText("fps:" + fps + " ups:" + ups,20,416);
	ctx.fillStyle = "#FFFF00";
	ctx.fillText("Coins:" + coins,20,448); 
	ctx.fillStyle = "#ff00ff";
	ctx.fillText("Lives:" + lives,20,480);
};