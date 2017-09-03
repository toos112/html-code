let life_img = new Image();
life_img.src = "(js: _.img('data/gfx/icons/life.png') :js)";
let coins_img = new Image();
coins_img.src = "(js: _.img('data/gfx/icons/coin.png') :js)";
let enemies_img = new Image();
enemies_img.src = "(js: _.img('data/gfx/icons/enemy.png') :js)";

let nextWaveButton;
let machinegun;
let flamethrower;
let rocketlauncher;

let mapButtons = [];
var initUI = function() {
	for (let i = 0; i < maps.length; i++) {
		mapButtons.push(new CanvasButton(256, 16, 128, 2 + 18 * i, canvas, function() {
			if (!STARTED) {
				loadLevel(maps[i]);
				STARTED = true;
			}
		}, { text : maps[i].name, color : "#ffffff" }, { color : "#7f7f7f", hover : "#bfbfbf" }));
	}
	nextWaveButton = new CanvasButton(16, 16, 325, 400, canvas, function() {
		if (STARTED) {
			spawnWave(currentWave);
			currentWave = currentWave + 1;
			
		}
	}, { text :"next wave", color : "#ffffff" }, { color : "#7f7f7f", hover : "#bfbfbf" });
	machinegun = new CanvasButton(32, 32, 372, 400, canvas, function() {
		if (STARTED) {
			currentTower = "T0.0.0";
		}
	}, { text :"machine gun", color : "#ffffff" }, { color : "#7f7f7f", hover : "#bfbfbf" });
	flamethrower = new CanvasButton(32, 32, 404, 400, canvas, function() {
		if (STARTED) {
			currentTower = "T0.0.1";
		}
	}, { text :"flamethrower", color : "#ffffff" }, { color : "#7f7f7f", hover : "#bfbfbf" });
	rocketlauncher = new CanvasButton(32, 32, 436, 400, canvas, function() {
		if (STARTED) {
			currentTower = "T0.0.2";
		}
	}, { text :"rocketlauncher", color : "#ffffff" }, { color : "#7f7f7f", hover : "#bfbfbf" });
};

var renderUI = function(ctx) {
	
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 384, 512, 128);
	
	nextWaveButton.draw(ctx);
	machinegun.draw(ctx);
	flamethrower.draw(ctx);
	rocketlauncher.draw(ctx);
	
	ctx.font = "12px Arial";
	ctx.fillStyle = "#00ffff";
	ctx.fillText("fps:" + fps + " ups:" + ups,10,399);
	ctx.font = "15px Arial";
	ctx.fillStyle = "#FFFF00";
	ctx.fillText(coins,100,414); 
	ctx.fillStyle = "#ff00ff";
	ctx.fillText(lives,25,414);
	ctx.fillStyle = "#ff0000";
	ctx.fillText(enemies.length,25,435);
	
	ctx.lineWidth = 2;
	context.strokeStyle = "#ff0000";
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
	
	ctx.drawImage(life_img, 5, 402);
	ctx.drawImage(coins_img, 84, 400);
	ctx.drawImage(enemies_img, 7, 425);
	
	let i = 0;
	
	if (mouseIsTile) {
		ctx.fillStyle = "#ffffff";
		ctx.fillText("tilename:" + mouseTile.name,10,450+i++*15);
		
	}
	if (EDITOR) {
		ctx.fillStyle = "#ffffff";
		ctx.fillText("editortile:" + tileMap[current].name,10,450+i++*15);
	}
	
	ctx.fillStyle = "#ff0000";
	for (let ii = 0; ii < mouseEnemies.length; ii++){
		ctx.fillText("enemy:" + mouseEnemies[ii].name, 10, 450+i++*15);
	}
};

var renderStart = function(ctx) {
	for (let i = 0; i < mapButtons.length; i++)
		mapButtons[i].draw(ctx);
};