let life_img = new Image();
life_img.src = "(js: _.img('data/gfx/icons/life.png') :js)";
let coins_img = new Image();
coins_img.src = "(js: _.img('data/gfx/icons/coin.png') :js)";
let enemies_img = new Image();
enemies_img.src = "(js: _.img('data/gfx/icons/enemy.png') :js)";

let nextWaveButton;
let towerButtons = [];
let sellTowerButton;
let upgradeButtons = [];
let lastSelectedTower = -1;

var refreshUpgrades = function() {
	for (let i = 0; i < upgradeButtons.length; i++)
		upgradeButtons[i].destruct();
	upgradeButtons = [];
	let i = 0 ;
	lastSelectedTower = selectedTowerIndex ;
	if (selectedTowerIndex == -1) return ;
	for (let upgradeIndex in towers[selectedTowerIndex].upgr) {
		let upgrade = towers[selectedTowerIndex].upgr[upgradeIndex];
		upgradeButtons.push(new CanvasButton(32, 32, WIDTH/3*2 + (i % 4) * 32, HEIGHT*0.75 + Math.floor(i / 4) * 32, canvas, function() {
			upgradeTower(selectedTowerIndex, upgrade);	
			refreshUpgrades();
		}, { type : "img", img : upgradeTypes[upgrade].image, hovercol : function() { return coins >= upgradeTypes[upgrade].cost ? "#3f7f3f" : "#7f3f3f" } }));
		i++;
	}
};

let mapButtons = [];
var initUI = function() {
	for (let i = 0; i < maps.length; i++) {
		mapButtons.push(new CanvasButton(256, 16, WIDTH/2-128, 2 + 18 * i, canvas, function() {
			if (!STARTED) {
				loadLevel(maps[i]);
				STARTED = true;
			}
		}, { type : "text", txt : maps[i].name, txtcol : "#ffffff", col : "#7f7f7f", hovercol : "#bfbfbf" }));
	}
	nextWaveButton = new CanvasButton(48, 16, WIDTH/3-24, HEIGHT*0.75, canvas, function() {
		if (STARTED) {
			spawnWave(currentWave);
			currentWave = currentWave + 1;
		}
	}, { type : "text", txt : "next wave", txtcol : "#ffffff", col : "#7f7f7f", hovercol : "#bfbfbf" });
	sellTowerButton = new CanvasButton(48, 16, WIDTH/3-24, HEIGHT*0.75+24, canvas, function() {
		if (selectedTower != undefined) {
			sellTower(selectedTowerIndex);
			selectedTower = undefined;
			selectedTowerIndex = towers.indexOf(selectedTower);
		}
	}, { type : "text", txt : "sell tow", txtcol : "#ffffff", col : "#7f7f7f", hovercol : "#bfbfbf" });
	let i = 0;
	for (let tow in towerTypes) {
		towerButtons.push(new CanvasButton(32, 32, WIDTH/3+24 + (i % 4) * 32, HEIGHT*0.75 + Math.floor(i / 4) * 32, canvas, function() {
			if (STARTED) currentTower = tow;
			selectedTower = undefined;
			selectedTowerIndex = towers.indexOf(selectedTower);
		}, { type : "img", img : towerTypes[tow].baseimage, hovercol : function() { return coins >= towerTypes[tow].cost ? "#3f7f3f" : "#7f3f3f" } }));
		i++;
	}
};

var updateUI = function() {
	for (let i = 0; i < mapButtons.length; i++)
		mapButtons[i].destruct();
	mapButtons = [];
	nextWaveButton.destruct();
	nextWaveButton = undefined;
	sellTowerButton.destruct();
	sellTowerButton = undefined;
	refreshUpgrades() ;
	for (let i = 0; i < towerButtons.length; i++)
		towerButtons[i].destruct();
	towerButtons = [];
	initUI();
}

var renderUI = function(ctx) {
	
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, HEIGHT*0.75, WIDTH, HEIGHT*0.25);
	
	nextWaveButton.draw(ctx);
	if (selectedTower != undefined)
		sellTowerButton.draw(ctx);
	for (let i = 0; i < towerButtons.length; i++)
		towerButtons[i].draw(ctx);
	
	ctx.font = "12px Arial";
	
	ctx.fillStyle = "#ffbf00";
	let ti = 0;
	for (let tow in towerTypes) {
		ctx.fillText(towerTypes[tow].cost, WIDTH/3+24 + (ti % 4) * 32, HEIGHT*0.75+42 + Math.floor(ti / 4) * 42);
		ti++;
	}
	
	ctx.fillStyle = "#00ffff";
	ctx.fillText("fps:" + fps + " ups:" + ups,10,HEIGHT*0.75-10);
	ctx.font = "15px Arial";
	ctx.fillStyle = "#FFFF00";
	ctx.fillText(coins,100,HEIGHT*0.75+15); 
	ctx.fillStyle = "#ff00ff";
	ctx.fillText(lives,25,HEIGHT*0.75+15);
	ctx.fillStyle = "#ff0000";
	ctx.fillText(enemies.length,25,HEIGHT*0.75+47);
	
	ctx.lineWidth = 2;
	context.strokeStyle = "#ff0000";
	ctx.beginPath();
	ctx.rect(WIDTH/3+24,HEIGHT*0.75,32,32);
	ctx.rect(WIDTH/3+56,HEIGHT*0.75,32,32);
	ctx.rect(WIDTH/3+88,HEIGHT*0.75,32,32);
	ctx.rect(WIDTH/3+120,HEIGHT*0.75,32,32);
	               
	ctx.rect(WIDTH/3+24,HEIGHT*0.75+42,32,32);
	ctx.rect(WIDTH/3+56,HEIGHT*0.75+42,32,32);
	ctx.rect(WIDTH/3+88,HEIGHT*0.75+42,32,32);
	ctx.rect(WIDTH/3+120,HEIGHT*0.75+42,32,32);
	               
	ctx.rect(WIDTH/3+24,HEIGHT*0.75+84,32,32);
	ctx.rect(WIDTH/3+56,HEIGHT*0.75+84,32,32);
	ctx.rect(WIDTH/3+88,HEIGHT*0.75+84,32,32);
	ctx.rect(WIDTH/3+120,HEIGHT*0.75+84,32,32);
	
	ctx.stroke();
	
	ctx.drawImage(life_img, 5, HEIGHT*0.75);
	ctx.drawImage(coins_img, 84, HEIGHT*0.75);
	ctx.drawImage(enemies_img, 7, HEIGHT*0.75+32);
	let i = 0;
	if (mouseIsTile) {
		ctx.fillStyle = "#ffffff";
		ctx.fillText("tilename:" + mouseTile.name,10,25+i++*15);
		
	}
	if (EDITOR) {
		ctx.fillStyle = "#ffffff";
		ctx.fillText("editortile:" + tileMap[current].name,10,25+i++*15);
	}
	
	ctx.fillStyle = "#ff0000";
	for (let ii = 0; ii < mouseEnemies.length; ii++){
		ctx.fillText("enemy:" + mouseEnemies[ii].name, 10,25+i++*15);
	}
	
	ctx.beginPath();
	ctx.rect(WIDTH/3*2,HEIGHT*0.75,128,96);
	ctx.stroke();
	
	if (lastSelectedTower != selectedTowerIndex) {
		refreshUpgrades() ;
	}
	for (let i = 0; i < upgradeButtons.length; i++)
		upgradeButtons[i].draw(ctx);
	
	for (let i = 0; i < upgradeButtons.length; i++) {
		if (upgradeButtons[i].isHovered()) {
			ctx.fillText("Upgrade : " + upgradeTypes[towers[selectedTowerIndex].upgr[i]].name,mx,my - 20);
			ctx.fillText("Description : " + upgradeTypes[towers[selectedTowerIndex].upgr[i]].description,mx,my - 5)
		}
	}
	let j = 0;
	ctx.fillStyle = "#00FF00";
	for (let id in towerTypes) {
		if (towerButtons[j].isHovered()) {
			ctx.fillText("Tower : " + towerTypes[id].name,mx,my - 20);
			ctx.fillText("Description : " + towerTypes[id].description,mx,my - 5)
		}
	j++;
	}
};

var renderStart = function(ctx) {
	for (let i = 0; i < mapButtons.length; i++)
		mapButtons[i].draw(ctx);
};