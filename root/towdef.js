"use strict";

let canvas, context;
let grid, gridChars, towMap;
let mapCanvas, mapContext, gridRenderCache, updateMap;

let toHex = function(i) {
	let str = i.toString(16);
	return str.length == 1 ? ("0" + str) : str;
};

let imgcanvas = document.createElement("canvas");
imgcanvas.width = 8, imgcanvas.height = 8;
let imgcontext = imgcanvas.getContext("2d");

let gridOverlayCanvas = document.createElement("canvas");
let gridOverlayContext = gridOverlayCanvas.getContext("2d");

let tileMap = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	var result = $json.parse($file.read("data/towdef/tilemap.txt").join(""));
	for (var i in result) {
		result[i].imgdatas = [];
		for (var ii = 0; ii < result[i].textures.length; ii++)
			result[i].imgdatas[ii] = "" + _.img(result[i].textures[ii]);
	}
	$.replaceAll($json.stringify(result), "\"", "\\\"");
:js)");
for (let i in tileMap) {
	tileMap[i].images = [];
	tileMap[i].loaded = false;
	for (let imgi = 0; imgi < tileMap[i].imgdatas.length; imgi++) {
		tileMap[i].images[imgi] = new Image();
		tileMap[i].images[imgi].onload = function() {
			imgcontext.drawImage(tileMap[i].images[imgi], 0, 0);
			let data = imgcontext.getImageData(0, 0, 8, 8).data;
			tileMap[i].interdat = new Array(8);
			for (let ii = 0; ii < tileMap[i].interdat.length; ii++)
				tileMap[i].interdat[ii] = new Array(8);
			for (let x = 0; x < 8; x++)
				for (let y = 0; y < 8; y++)
					tileMap[i].interdat[y][x] = "#" + toHex(data[(x * 8 + y) * 4 + 0])
						+ toHex(data[(x * 8 + y) * 4 + 1]) + toHex(data[(x * 8 + y) * 4 + 2]);
			
			if (tileMap[i].rotatable) {
				tileMap[i].images[imgi].imgcache = [];
				tileMap[i].images[imgi].intercache = [];
				for (let ii = 0; ii < 4; ii++) {
					tileMap[i].images[imgi].intercache[ii] = rotArray(tileMap[i].interdat, ii);
					imgcontext.save();
					imgcontext.translate(4, 4);
					imgcontext.rotate(ii * Math.PI / 2);
					imgcontext.drawImage(tileMap[i].images[imgi], -4, -4);
					imgcontext.restore();
					tileMap[i].images[imgi].imgcache[ii] = new Image();
					tileMap[i].images[imgi].imgcache[ii].onload = function() {
						tileMap[i].images[imgi].imgcache[ii].loaded = true;
						for (let iii = 0; iii < 4; iii++)
							if (tileMap[i].images[imgi].imgcache[ii] === undefined || !tileMap[i].images[imgi].imgcache[ii].loaded) return;
			
							tileMap[i].images[imgi].loaded = true;
							for (let iii = 0; iii < tileMap[i].imgdatas.length; iii++)
								if (tileMap[i].images[iii] === undefined || !tileMap[i].images[iii].loaded) return;
							tileMap[i].loaded = true;
					};
					tileMap[i].images[imgi].imgcache[ii].loaded = false
					tileMap[i].images[imgi].imgcache[ii].src = imgcanvas.toDataURL();
				}
			} else {
				tileMap[i].images[imgi].loaded = true;
				for (let ii = 0; ii < tileMap[i].imgdatas.length; ii++)
					if (tileMap[i].images[ii] === undefined || !tileMap[i].images[ii].loaded) return;
				tileMap[i].loaded = true;
			}
		};
		tileMap[i].images[imgi].src = tileMap[i].imgdatas[imgi];
	}
}

let start, end;
let cups = 0, cfps = 0;
let ups = 0, fps = 0;
let coins = 25, lives = 200;
let ldata, waves;
let tilecount = { water : 0, land : 0, flight : 0, total : 0 };
let currentTower = "";

let UPS = 30;
let EDITOR = false;
let STARTED = false;
let ZOOM = 1, ZOOMPOW = 1;
let OX = 0, OY = 0;
let A = false, S = false, D = false, W = false;
let INTERPOLATE = true;
let SHOWALLPATHS = false;
let RENDERGRID = true;

let mx, my, mtx, mty, omx, omy;
let mouseTile, mouseIsTile;
let mouseEnemies = [];
let spawnDelay = 0;
let alt = 0;
let shift = false;
let currentWave = 0;

let rotArray = function(arr, count) {
	let newArr = new Array(arr.length);
	for (let i = 0; i < newArr.length; i++)
		newArr[i] = new Array(arr[i].length);

	for (let x = 0; x < arr.length; x++) {
		for (let y = 0; y < arr[x].length; y++) {
			let nx = arr.length - y - 1;
			let ny = x;
			newArr[nx][ny] = arr[x][y];
		}
	}
	
	if (count == 0) return newArr;
	else return rotArray(newArr, count - 1);
};

let clone = function(obj) {
	if (Array.isArray(obj)) {
		let result = [];
		for (let i = 0; i < obj.length; i++)
			result.push(clone(obj[i]));
		return result;
	} else if (typeof obj === "object") {
		let result = {};
		for (let key in obj)
			result[key] = clone(obj[key]);
		return result;
	} else return obj;
};

let calculateExits = function() {
	for (let x = 0; x < grid.length; x++) {
		for (let y = 0; y < grid[x].length; y++) {
			if (grid[x][y].name == "start") start = { x : x, y : y };
			if (grid[x][y].name == "end") end = { x : x, y : y };
		}
	}
};

let getMapString = function() {
	let result = "";
	for (let y = 0; y < grid[0].length; y++) {
		for (let x = 0; x < grid.length; x++)
			result += gridChars[x][y];
		result += "\n";
	}
	return result;
};

let setGridTile = function(pos, tile) {
	let tt = tileMap[tile]
	let variant = Math.floor(Math.random() * tt.images.length);
	let image = tt.images[variant], interdat = tt.interdat, rotation = "";
	if (tt.rotatable) {
		rotation = Math.floor(Math.random() * 4);
		interdat = image.intercache[rotation];
		image = image.imgcache[rotation];
	}
	let obj = { name : tt.name, water : tt.water, land : tt.land, flight : tt.flight, canBuildTower : tt.canBuildTower, id : tt.name + "," + rotation + "," + variant, image : image, interdat : interdat };
	
	if (grid[pos.x][pos.y] != null) {
		if (grid[pos.x][pos.y].water) tilecount.water--;
		if (grid[pos.x][pos.y].land) tilecount.land--;
		if (grid[pos.x][pos.y].flight) tilecount.flight--;
	}
	if (obj.water) tilecount.water++;
	if (obj.land) tilecount.land++;
	if (obj.flight) tilecount.flight++;
	tilecount.total = tilecount.water + tilecount.land + tilecount.flight;
	
	grid[pos.x][pos.y] = obj;
	gridChars[pos.x][pos.y] = tile;
};

let loadLevel = function(level) {
	ldata = level.data;
	waves = level.waves;
	
	grid = new Array(ldata.width), gridChars = new Array(ldata.width), towMap = new Array(ldata.width);
	for (let i = 0; i < grid.length; i++) {
		grid[i] = new Array(ldata.height);
		gridChars[i] = new Array(ldata.height);
		towMap[i] = new Array(ldata.height);
		for (let ii = 0; ii < grid[i].length; ii++) {
			grid[i][ii] = null;
			gridChars[i][ii] = ".";
			towMap[i][ii] = "n";
		}
	}

	mapCanvas = document.createElement("canvas");
	mapCanvas.width = ldata.width * 8;
	mapCanvas.height = ldata.height * 8;
	mapContext = mapCanvas.getContext("2d");
	gridRenderCache = new Array(ldata.width), updateMap = new Array(ldata.width);
	for (let i = 0; i < gridRenderCache.length; i++) {
		gridRenderCache[i] = new Array(ldata.height);
		updateMap[i] = new Array(ldata.height);
		for (let ii = 0; ii < gridRenderCache[i].length; ii++) {
			gridRenderCache[i][ii] = "#373737";
			updateMap[i][ii] = false;
		}
	}
	
	for (let y = 0; y < level.level.length; y++) {
		let row = level.level[y].split("");
		for (let x = 0; x < row.length; x++)
			setGridTile({ x : x, y : y }, row[x]);
	}
	calculateExits();
	
	gridOverlayCanvas.width = ldata.width, gridOverlayCanvas.height = ldata.height;
	gridOverlayContext.fillStyle = "#000000"
	gridOverlayContext.fillRect(0, 0, ldata.width, ldata.height);
	gridOverlayContext.fillStyle = "#5f5f5f"
	for (let x = 0; x < ldata.width; x++)
		for (let y = 0; y < ldata.height; y++)
			if (x % 2 == y % 2) gridOverlayContext.fillRect(x, y, 1, 1);
};

let inter = "(js:
	_.I("_scripts/file.js");
	$file.read("data/towdef/inter.txt").join("|");
:js)".split("|");

for (let i = 0; i < inter.length; i++)
	inter[i] = inter[i].split("");

let towerTypes = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	var result = $json.parse($file.read("data/towdef/towers.txt").join(""));
	for (var i in result) {
		result[i].baseimgdata = "" + _.img(result[i].texture.base);
		result[i].gunimgdata = "" + _.img(result[i].texture.gun);
	}
	$.replaceAll($json.stringify(result), "\"", "\\\"");
:js)");
for (let i in towerTypes) {
	towerTypes[i].baseimage = new Image();
	towerTypes[i].baseimage.src = towerTypes[i].baseimgdata;
	towerTypes[i].gunimage = new Image();
	towerTypes[i].gunimage.src = towerTypes[i].gunimgdata;
}

let bulletTypes = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	var result = $json.parse($file.read("data/towdef/bullets.txt").join(""));
	for (var i in result)
		result[i].imgdata = "" + _.img(result[i].texture);
	$.replaceAll($json.stringify(result), "\"", "\\\"");
:js)");
for (let i in bulletTypes) {
	bulletTypes[i].image = new Image();
	bulletTypes[i].image.src = bulletTypes[i].imgdata;
}

let enemyTypes = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	_.I("_scripts/json.js");
	var result = $json.parse($file.read("data/towdef/enemies.txt").join(""));
	for (var i in result)
		result[i].imgdata = "" + _.img(result[i].texture);
	$.replaceAll($json.stringify(result), "\"", "\\\"");
:js)");
for (let i in enemyTypes) {
	enemyTypes[i].image = new Image();
	enemyTypes[i].image.src = enemyTypes[i].imgdata;
}

let effectTypes = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	$.replaceAll($file.read("data/towdef/effects.txt").join(""), "\"", "\\\"");
:js)");

let enemies = [];
let pendingSpawns = [];
let waveQueue = [];
let towers = [];
let bullets = [];

let maps = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	_.I("_scripts/json.js");
	var result = [];
	var mapdata = $json.parse($file.read("data/towdef/maps/mapdata.txt").join(""));
	for (var i = 0; i < mapdata.length; i++) {
		var name = mapdata[i];
		var data = $json.parse($file.read("data/towdef/maps/" + name + "/data.txt").join(""));
		var waves = $json.parse($file.read("data/towdef/maps/" + name + "/waves.txt").join(""));
		var level = $file.read("data/towdef/maps/" + name + "/level.txt").join("|");
		result.push({ data : data, waves : waves, level : level, name : name });
	}
	$.replaceAll($json.stringify(result), "\"", "\\\"");
:js)");
for (let i = 0; i < maps.length; i++)
	maps[i].level = maps[i].level.split("|");

let spawnEnemy = function(e, start, sloc) {
	if (sloc == "LB") {
		e.x = start.x;
		e.y = start.y - e.r + 1;
	} else if (sloc == "RB") {
		e.x = start.x - e.r + 1;
		e.y = start.y - e.r + 1;
	} else if (sloc == "LT") {
		e.x = start.x;
		e.y = start.y;
	} else if (sloc == "RT") {
		e.x = start.x - e.r + 1;
		e.y = start.y;
	}
	return e;
};

let getBestSpeed = function(p, o, grid) {
	let t = grid[p.x][p.y];
	let result = 0;
	if (o.ls > result && t.land) result = o.ls;
	if (o.ss > result && t.water) result = o.ss;
	if (o.fs > result && t.flight) result = o.fs;
	return result;
};

let getTowerCollisions = function(pos, obj, tows) {
	let result = [];
	for (let i = 0; i < tows.length; i++)
		for (let x = 0; x < obj.r; x++)
			for (let y = 0; y < obj.r; y++)
				for (let xx = 0; xx < tows[i].w; xx++)
					for (let yy = 0; yy < tows[i].h; yy++)
						if (pos.x + x == tows[i].x + xx && pos.y + y == tows[i].y + yy)
							if (result.indexOf(tows[i]) == -1) result.push(tows[i]);
	return result;
};

let isColliding = function(p, o, grid, checkTowers) {
	if (checkTowers === undefined) checkTowers = true;
	for (let x = 0; x < o.r; x++) {
		for (let y = 0; y < o.r; y++) {
			if (p.x + x < 0 || p.x + x >= grid.length || p.y + y < 0 || p.y + y >= grid[p.x + x].length) return true;
			if (getBestSpeed({ x : p.x + x, y : p.y + y }, o, grid) == 0) return true;
			if (towMap[p.x + x][p.y + y] == "t" && o.fs == -1 && checkTowers) return true;
		}
	}
	return false;
};
	
let canMove = function(pos, move, grid, obj, checkTowers) {
	if (move.x != 0 && move.y != 0)
		if (!canMove(pos, { x : move.x, y : 0 }, grid, obj) || !canMove(pos, { x : 0, y : move.y }, grid, obj)) return false;
	let nobj = { x : pos.x + move.x, y : pos.y + move.y };
	return !isColliding(nobj, obj, grid, checkTowers);
};

let mdist = function(a, b) {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

let dist = function(a, b) {
	return Math.sqrt((a.x-b.x) * (a.x-b.x) + (a.y-b.y) * (a.y-b.y));
};

let omdist = function(posa, obja, posb, objb) {
	return Math.abs(posa.x + obja.r / 2 - posb.x - objb.r / 2)
		+ Math.abs(posa.y + obja.r / 2 - posb.y - objb.r / 2);
};

let odist = function(posa, obja, posb, objb) {
	let dx = posa.x + obja.r / 2 - posb.x - objb.r / 2,
		dy = posa.y + obja.r / 2 - posb.y - objb.r / 2;
	return Math.sqrt(dx * dx + dy * dy);
};

let isFinished = function(pos, obj) {
	return Math.abs(pos.x + obj.r * 0.5 - (end.x + 0.5)) < obj.r / 2
		&& Math.abs(pos.y + obj.r * 0.5 - (end.y + 0.5)) < obj.r / 2;
};

let getSpeed = function(p, o, grid) {
	let result = 0;
	for (let x = 0; x < o.r; x++)
		for (let y = 0; y < o.r; y++)
			result += UPS / getBestSpeed({ x : p.x + x, y : p.y + y }, o, grid)
	return result / (o.r * o.r);
};

let moveCost = function(p, o, np, grid, isrelative) {
	let newpos = isrelative ? { x : o.x + np.x, y : o.y + np.y } : np;
	return getSpeed(p, o, grid) * odist(p, o, np, o);
};

let avgSpeed = function(e) {
	let result = 0, count = 0;
	if (e.ls >= 0) count++, result += UPS / e.ls * tilecount.land;
	if (e.ss >= 0) count++, result += UPS / e.ss * tilecount.water;
	if (e.fs >= 0) count++, result += UPS / e.fs * tilecount.flight;
	return result / count / tilecount.total;
};

let possible = [{ x : 0, y : 1 }, { x : 0, y : -1 }, { x : 1, y : 0 }, { x : -1, y : 0 }, { x : 1, y : 1 }, { x : 1, y : -1 }, { x : -1, y : 1 }, { x : -1, y : -1 }];
let findPath = function(start, end, obj, grid, checkTowers) {
	if (checkTowers === undefined) checkTowers = true;
	
	let open = [{ x : start.x, y : start.y }];
	let openMap = new Array(grid.length);
	let closed = new Array(grid.length);
	for (let i = 0; i < closed.length; i++) {
		closed[i] = new Array(grid[i].length);
		openMap[i] = new Array(grid[i].length);
		for (let ii = 0; ii < closed[i].length; ii++) {
			closed[i][ii] = false;
			openMap[i][ii] = false;
			grid[i][ii].g = Infinity;
			grid[i][ii].p = undefined;
		}
	}
	openMap[start.x][start.y] = true;
	grid[start.x][start.y].g = 0;
	grid[start.x][start.y].f = odist(start, obj, end, { r : 1 }) * avgSpeed(obj);
	
	while (open.length > 0) {
        let current, fScore = Infinity;
        for (let i = 0; i < open.length; i++) {
            if (grid[open[i].x][open[i].y].f < fScore) {
                fScore = grid[open[i].x][open[i].y].f;
                current = open[i];
            }
        }
		
		if (isFinished(current, obj)) {
            let result = [];
            while (current !== undefined) {
                result.push({ x : current.x, y : current.y, type : "move" });
                current = grid[current.x][current.y].p;
            }
			result = result.reverse();
			if (!checkTowers) {
				let collisionsHad = [];
				for (let i = 0; i < result.length; i++) {
					if (result[i].type != "move") continue;
					let towerCollisions = getTowerCollisions(result[i], obj, towers);
					for (let ii = 0; ii < towerCollisions.length; ii++) {
						let towerCollision = towerCollisions[ii];
						if (towerCollision === undefined || collisionsHad.indexOf(towerCollision) != -1) continue;
						collisionsHad.push(towerCollision);
						result.splice(i, 0, { tow : towerCollision, type : "attack" });
					}
				}
			}
            return result;
		}
        
		let index = open.indexOf(current)
        open.splice(index, 1);
		openMap[current.x][current.y] = false;
        closed[current.x][current.y] = true;
        
        for (let i = 0; i < possible.length; i++) {
			if (!canMove(current, possible[i], grid, obj, checkTowers)) continue;
            if (closed[current.x + possible[i].x][current.y + possible[i].y])
				continue;
            let node = { x : current.x + possible[i].x, y : current.y + possible[i].y };
            if (!openMap[node.x][node.y]) {
				open.push(node);
				openMap[node.x][node.y] = true;
			}
            let gScore = grid[current.x][current.y].g + moveCost(current, obj, node, grid, false);
            if (gScore >= grid[node.x][node.y].g) continue;
            grid[node.x][node.y].p = current;
            grid[node.x][node.y].g = gScore;
            grid[node.x][node.y].f = gScore + odist(node, obj, end, { r : 1 }) * avgSpeed(obj);
        }
	}
	
	if (checkTowers) return findPath(start, end, obj, grid, false);
};

let updatePath = function(e) {
	if (e.path === undefined || e.pi + 1 >= e.path.length || e.path[e.pi + 1].type == "attack") e.path = findPath(e, end, e, grid);
	else {
		e.path = findPath(e.path[e.pi + 1], end, e, grid)
		e.path.unshift({ x : e.x, y : e.y, type : "move" });
	}
	e.pi = 0;
	return e;
};

let updatePaths = function() {
	for (let i = 0; i < enemies.length; i++)
		enemies[i] = updatePath(enemies[i]);
};
updatePaths();

let spawnAt = function(e, pos, com) {
	let et = enemyTypes[e];
	let enemy = spawnEnemy({ r : et.width, ls : et.landSpeed, ss : et.swimmingSpeed, fs : et.flyingSpeed, od : et.onDeath, dmg : et.damage, atkspd : UPS / et.attackSpeed,
		name : et.name, image : et.image, shp : et.hp, hp : et.hp, worth : et.worth, effects : [], fract : 0 }, pos, com === undefined ? "LT" : com);
	enemy = updatePath(enemy);
	enemies.push(enemy);
};

let canSpawnTower = function(t, pos) {
	let tt = towerTypes[t], first;
	for (let x = pos.x; x < pos.x + tt.width; x++) {
		if (x < 0 || x >= ldata.width) return false;
		for (let y = pos.y; y < pos.y + tt.height; y++) {
			if (y < 0 || y >= ldata.height) return false;
			if (!grid[x][y].canBuildTower || towMap[x][y] != "n" || (first !== undefined && grid[x][y].name != first))
				return false;
			first = grid[x][y].name;
		}
	}
	
	for (let i = 0; i < enemies.length; i++) {
		if (getTowerCollisions(enemies[i], enemies[i], [{ x : pos.x, y : pos.y, w : tt.width, h : tt.height }]).length > 0) return false;
		if (enemies[i].path[enemies[i].pi + 1].type == "move")
			if (getTowerCollisions(enemies[i].path[enemies[i].pi + 1], enemies[i], [{ x : pos.x, y : pos.y, w : tt.width, h : tt.height }]).length > 0) return false;
	}
	
	return true;
};

let spawnTower = function(t, pos) {
	if (!canSpawnTower(t, pos)) return false;
	let tt = towerTypes[t];
	for (let x = pos.x; x < pos.x + tt.width; x++)
		for (let y = pos.y; y < pos.y + tt.height; y++)
			towMap[x][y] = "t";
	let tow = { x : pos.x, y : pos.y, w : tt.width, h : tt.height, ra : tt.range, ammo : tt.ammo[0], hp : tt.hp,
		as : tt.attackSpeed, dlay : UPS / tt.attackSpeed, rot : 0, baseimage : tt.baseimage, gunimage : tt.gunimage, dmg : tt.damage };
	towers.push(tow);
	updatePaths();
	return true;
};

let canBuildTower = function(t, pos) {
	let tt = towerTypes[t];
	return coins >= tt.cost && canSpawnTower(t, pos);
};

let buildTower = function(t, pos) {
	if (canBuildTower(t, pos)) {
		let tt = towerTypes[t];
		coins -= tt.cost;
		return spawnTower(t, pos);
	} else return false;
};

let removeTower = function(t) {
	let tow = towers.splice(t, 1)[0];
	for (let x = tow.x; x < tow.x + tow.w; x++)
		for (let y = tow.y; y < tow.y + tow.h; y++)
			towMap[x][y] = "n";
};

let spawnBullet = function(b, t, a, e) {
	let bt = bulletTypes[b];
	let bul = { x : (t.x + t.w / 2) * 8, y : (t.y + t.h / 2) * 8, sx : (t.x + t.w / 2) * 8, sy : (t.y + t.h / 2) * 8, pierce : bt.pierce,
		ra : t.ra * bt.range, sp : bt.speed * 8 / UPS, a : a, dmg : bt.damage * t.dmg, image : bt.image, effects : bt.effects, homing : bt.homing };
	if (bt.pierce) bul.hitEnemies = [];
	if (bt.homing) bul.target = e;
	bullets.push(bul);
};

let spawnWave = function(index) {
	let startIndex = waveQueue.length;
	waveQueue = waveQueue.concat(clone(waves[index]));
	for (let i = startIndex; i < waveQueue.length; i++)
		if (waveQueue[i].type == "delay")
			waveQueue[i].delay *= UPS;
};

let killEnemy = function(index) {
	let enemy = enemies.splice(index, 1)[0];
	let spawnDelay = 0;
	for (let i = 0; i < enemy.od.length; i++)
		for (let ii = 0; ii < enemy.od[i].count; ii++)
			pendingSpawns.push({ name : enemy.od[i].name, pos : enemy, ticksLeft : ++spawnDelay * 5 });
	if (enemy.worth !== undefined)
		coins += enemy.worth;
};

let applyEffect = function(enemy, name, amp) {
	if (enemy[name] == -1) return enemy;
	let isFract = name.substring(0, 1) == "%";
	if (isFract) name = name.substring(1, name.length);
	
	if (isFract) enemy[name] *= amp;
	else enemy[name] += amp;
	return enemy;
};

let revertEffect = function(enemy, name, amp) {
	if (enemy[name] == -1) return enemy;
	let isFract = name.substring(0, 1) == "%";
	if (isFract) name = name.substring(1, name.length);
	
	if (isFract) enemy[name] /= amp;
	else enemy[name] -= amp;
	return enemy;
};

let giveEffect = function(enemy, effect, duration) {
	for (let i = enemies[enemy].effects.length - 1; i >= 0; i--) {
		if (effect == enemies[enemy].effects[i].name) {
			for (let eff in enemies[enemy].effects[i].effects.stats)
				enemies[enemy] = revertEffect(enemies[enemy], eff, enemies[enemy].effects[i].effects.stats[eff]);
			enemies[enemy].effects.splice(i, 1);
		}
	}
	let newEffect = clone(effectTypes[effect]);
	newEffect.tl = duration * UPS;
	newEffect.name = effect;
	for (let eff in newEffect.effects.stats)
		enemies[enemy] = applyEffect(enemies[enemy], eff, newEffect.effects.stats[eff]);
	enemies[enemy].effects.push(newEffect);
};

let _spawn = function(e) {
	spawnAt(e, start, ldata.spawn);
};

let _spawnrandom = function(e) {
	let et = enemyTypes[e];
	let enemy = { r : et.width, ls : et.landSpeed, ss : et.swimmingSpeed, fs : et.flyingSpeed, od : et.onDeath };
	let pos = { x : Math.floor(Math.random() * ldata.width), y : Math.floor(Math.random() * ldata.height) };
	while (isColliding(pos, enemy, grid))
		pos = { x : Math.floor(Math.random() * ldata.width), y : Math.floor(Math.random() * ldata.height) };
	spawnAt(e, pos);
};

let renderMap = function() {
	for (let x = 0; x < grid.length; x++) {
		for (let y = 0; y < grid[x].length; y++) {
			if (gridRenderCache[x][y] != grid[x][y].id) {
				updateMap[x][y] = true;
				if (INTERPOLATE) {
					if (x + 1 >= 0 && x + 1 < updateMap.length) updateMap[x + 1][y] = true;
					if (y + 1 >= 0 && y + 1 < updateMap[x].length) updateMap[x][y + 1] = true;
					if (x - 1 >= 0 && x - 1 < updateMap.length) updateMap[x - 1][y] = true;
					if (y - 1 >= 0 && y - 1 < updateMap[x].length) updateMap[x][y - 1] = true;
				}
				gridRenderCache[x][y] = grid[x][y].id;
			}
		}
	}
	for (let x = 0; x < grid.length; x++) {
		for (let y = 0; y < grid[x].length; y++) {
			if (updateMap[x][y]) {
				mapContext.drawImage(grid[x][y].image, x * 8, y * 8);
				if (INTERPOLATE) {
					let imageMap = {
						"u" : ((x - 1 >= 0 && x - 1 < updateMap.length) ? grid[x - 1][y].interdat : grid[x][y].interdat),
						"d" : ((x + 1 >= 0 && x + 1 < updateMap.length) ? grid[x + 1][y].interdat : grid[x][y].interdat),
						"l" : ((y - 1 >= 0 && y - 1 < updateMap[x].length) ? grid[x][y - 1].interdat : grid[x][y].interdat),
						"r" : ((y + 1 >= 0 && y + 1 < updateMap[x].length) ? grid[x][y + 1].interdat : grid[x][y].interdat)
					};
					for (let xx = 0; xx < 8; xx++) {
						for (let yy = 0; yy < 8; yy++) {
							if (inter[xx][yy] == ".") continue;
							mapContext.fillStyle = imageMap[inter[xx][yy]][xx][yy];
							mapContext.fillRect(x * 8 + xx, y * 8 + yy, 1, 1);
						}
					}
				}
				updateMap[x][y] = false;
			}
		}
	}
};

let addOffset = function(val, axis) {
	let o = (axis == "x") ? (OX * ZOOM - (256 - 256 / ZOOM) * ZOOM) : (OY * ZOOM - (192 - 192 / ZOOM) * ZOOM);
	return val * ZOOM + o;
};

let angleToPos = function(angle, spd) {
	return { x : Math.cos(angle) * spd, y : Math.sin(angle) * spd };
};

let getAngle = function(a, b) {
	return Math.atan2(b.y - a.y, b.x - a.x);
};

let refreshMap = function() {
	for (let x = 0; x < updateMap.length; x++)
		for (let y = 0; y < updateMap[y].length; y++)
			updateMap[x][y] = true;
};

let draw = function() {
	let mm = shift ? 8 : 4;
	if (A && OX + mm < 256) OX += mm / ZOOM;
	if (D && OX - mm > -ldata.width * 8 + 256) OX -= mm / ZOOM;
	if (W && OY + mm < 192) OY += mm / ZOOM;
	if (S && OY - mm > -ldata.height * 8 + 192) OY -= mm / ZOOM;
	
	omx = mx / ZOOM - OX + (256 - 256 / ZOOM), omy = my / ZOOM - OY + (192 - 192 / ZOOM);
	mtx = Math.floor(omx / 8), mty = Math.floor(omy / 8);
	mouseIsTile = mtx >= 0 && mtx < ldata.width && mty >= 0 && mty < ldata.height && my < 384;
	if (mouseIsTile) mouseTile = grid[mtx][mty];
	else mouseTile = undefined;
	
	renderMap();
	context.imageSmoothingEnabled = false;
	context.drawImage(mapCanvas, addOffset(0, "x"), addOffset(0, "y"), mapCanvas.width * ZOOM, mapCanvas.height * ZOOM);
	if (RENDERGRID) {
		context.globalAlpha = 0.25;
		context.drawImage(gridOverlayCanvas, addOffset(0, "x"), addOffset(0, "y"), mapCanvas.width * ZOOM, mapCanvas.height * ZOOM)
		context.globalAlpha = 1;
	}
	
	for (let i = 0; i < towers.length; i++) {
		context.drawImage(towers[i].baseimage, addOffset(towers[i].x * 8, "x"), addOffset(towers[i].y * 8, "y"), towers[i].w * 8 * ZOOM, towers[i].h * 8 * ZOOM);
		context.save();
		context.translate(addOffset(towers[i].x * 8, "x") + towers[i].w * 4 * ZOOM, addOffset(towers[i].y * 8, "y") + towers[i].h * 4 * ZOOM);
		context.rotate(towers[i].rot + Math.PI / 2);
		context.drawImage(towers[i].gunimage, -towers[i].w * 4 * ZOOM, -towers[i].h * 4 * ZOOM, towers[i].w * 8 * ZOOM, towers[i].h * 8 * ZOOM)
		context.restore();
	}
	
	for (let i = 0; i < enemies.length; i++)
		if (enemies[i].tx !== undefined && enemies[i].ty !== undefined)
			context.drawImage(enemies[i].image, addOffset(enemies[i].tx * 8, "x"), addOffset(enemies[i].ty * 8, "y"), 8 * enemies[i].r * ZOOM, 8 * enemies[i].r * ZOOM);
		
	context.fillStyle = "#ff0000";
	for (let i = 0; i < enemies.length; i++) {
		let len = enemies[i].hp / enemies[i].shp * enemies[i].r * 8;
		if (enemies[i].tx !== undefined && enemies[i].ty !== undefined)
			context.fillRect(addOffset(enemies[i].tx * 8, "x"), addOffset((enemies[i].ty + enemies[i].r) * 8, "y"), len * ZOOM, 2 * ZOOM);
	}
	context.fillStyle = "#7f0000";
	for (let i = 0; i < enemies.length; i++) {
		let len = enemies[i].hp / enemies[i].shp * enemies[i].r * 8;
		if (enemies[i].tx !== undefined && enemies[i].ty !== undefined)
			context.fillRect(addOffset(enemies[i].tx * 8 + len, "x"), addOffset((enemies[i].ty + enemies[i].r) * 8, "y"), (enemies[i].r * 8 - len) * ZOOM, 2 * ZOOM);
	}
	
	context.beginPath();
	context.globalAlpha = 0.25;
	context.strokeStyle = "#ff0000";
	context.lineWidth = 2 * ZOOM;
	let pathEnemies = SHOWALLPATHS ? enemies : mouseEnemies;
	for (let i = 0; i < pathEnemies.length; i++) {
		let en = pathEnemies[i];
		context.moveTo(addOffset(en.x * 8 + en.r * 4, "x"), addOffset(en.y * 8 + en.r * 4, "y"));
		for (let ii = en.pi; ii < en.path.length - 1; ii++)
			context.lineTo(addOffset(en.path[ii + 1].x * 8 + en.r * 4, "x"), addOffset(en.path[ii + 1].y * 8 + en.r * 4, "y"));
	}
	context.stroke();
	context.globalAlpha = 1;
	
	for (let i = 0; i < bullets.length; i++) {
		context.save();
		context.translate(addOffset(bullets[i].x - 4, "x") + 4 * ZOOM, addOffset(bullets[i].y - 4, "y") + 4 * ZOOM);
		context.rotate(bullets[i].a);
		context.drawImage(bullets[i].image, -4 * ZOOM, -4 * ZOOM, 8 * ZOOM, 8 * ZOOM);
		context.restore();
	}
	
	if (mouseIsTile && currentTower != "") {
		context.globalAlpha = 0.5;
		if (!canBuildTower(currentTower, { x : mtx, y : mty })) {
			context.fillStyle = "#ff0000";
			context.fillRect(addOffset(mtx * 8, "x"), addOffset(mty * 8, "y"), towerTypes[currentTower].width * 8 * ZOOM, towerTypes[currentTower].height * 8 * ZOOM);
		}
		context.drawImage(towerTypes[currentTower].baseimage, addOffset(mtx * 8, "x"), addOffset(mty * 8, "y"), towerTypes[currentTower].width * 8 * ZOOM, towerTypes[currentTower].height * 8 * ZOOM);
		context.globalAlpha = 1;
	}
	
	renderUI(context);
	cfps++;
};

let waveTick = function() {
	if (waveQueue.length > 0) {
		let obj = waveQueue[0];
		if (obj.type == "delay") {
			if (--obj.delay <= 0)
				waveQueue.splice(0, 1);
		} else if (obj.type == "spawn") {
			if (spawnDelay-- <= 0) {
				let enemy = obj.enemies[alt];
				spawnAt(enemy.name, start, ldata.spawn);
				if (--enemy.count <= 0)
					obj.enemies.splice(alt, 1);
				if (obj.enemies.length == 0) {
					alt = 0;
					waveQueue.splice(0, 1);
				} else {
					spawnDelay = obj.delay * UPS;
					if (obj.order == "alt")
						if (++alt >= obj.enemies.length) alt = 0;
				}
			}
		}
	}
};

let tick = function() {
	waveTick();
	
	for (let i = pendingSpawns.length - 1; i >= 0; i--) {
		if (--pendingSpawns[i].ticksLeft <= 0) {
			spawnAt(pendingSpawns[i].name, pendingSpawns[i].pos);
			pendingSpawns.splice(i, 1);
		}
	}
	
	for (let i = bullets.length - 1; i >= 0; i--) {
		if (bullets[i].homing && enemies.indexOf(bullets[i].target) == -1) {
			bullets.splice(i, 1);
			continue;
		}
		
		if (bullets[i].homing) bullets[i].a = getAngle(bullets[i], { x : bullets[i].target.tx * 8 + bullets[i].target.r * 4, y : bullets[i].target.ty * 8 + bullets[i].target.r * 4 });
		let offset = angleToPos(bullets[i].a, bullets[i].sp);
		bullets[i].x += offset.x, bullets[i].y += offset.y;
		
		let hitEnemy = false;
		for (let ii = 0; ii < enemies.length; ii++) {
			if (dist({ x : enemies[ii].tx * 8 + enemies[ii].r * 4, y : enemies[ii].ty * 8 + enemies[ii].r * 4 }, bullets[i]) < enemies[ii].r * 4) {
				if (!bullets[i].pierce || bullets[i].hitEnemies.indexOf(enemies[ii]) == -1) {
					enemies[ii].hp -= bullets[i].dmg;
					for (let iii = 0; iii < bullets[i].effects.length; iii++)
						giveEffect(ii, bullets[i].effects[iii].name, bullets[i].effects[iii].duration);
					if (bullets[i].pierce) bullets[i].hitEnemies.push(enemies[ii]);
				}
				
				if (!bullets[i].pierce) {
					bullets.splice(i, 1);
					hitEnemy = true;
					break;
				}
			}
		}
		if (hitEnemy) continue;
		
		if (dist(bullets[i], { x : bullets[i].sx, y : bullets[i].sy }) > bullets[i].ra * 8)
			bullets.splice(i, 1);
	}
	
	for (let i = enemies.length - 1; i >= 0; i--) {
		if (isFinished(enemies[i], enemies[i])) {
			lives -= enemies[i].dmg;
			enemies.splice(i, 1);
			continue;
		}
		
		let effects = enemies[i].effects;
		for (let ii = effects.length - 1; ii >= 0; ii--) {
			let tickEffects = effects[ii].effects.tick;
			let statEffects = effects[ii].effects.stats;
			for (let effect in tickEffects)
				enemies[i] = applyEffect(enemies[i], effect, effect.substring(0, 1) == "%" ? tickEffects[effect] : tickEffects[effect] / UPS);
			if (--effects[ii].tl <= 0) {
				for (let eff in statEffects)
					enemies[i] = revertEffect(enemies[i], eff, statEffects[eff]);
				effects.splice(ii, 1);
			}
		}
		
		let shouldUpdatePaths = false;
		if (enemies[i].path[enemies[i].pi + 1].type == "attack") enemies[i].fract += 1 / (UPS / enemies[i].atkspd);
		else enemies[i].fract += 1 / moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
		while (enemies[i].fract >= 1 && enemies[i].pi < enemies[i].path.length - 1) {
			if (enemies[i].path[enemies[i].pi + 1].type == "move") {
				let emc = moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
				enemies[i].x = enemies[i].path[++enemies[i].pi].x;
				enemies[i].y = enemies[i].path[enemies[i].pi].y;
				if (enemies[i].pi < enemies[i].path.length - 1) {
					enemies[i].fract--;
					if (enemies[i].path[enemies[i].pi + 1].type == "attack") enemies[i].fract *= emc / (UPS / enemies[i].atkspd);
					else enemies[i].fract *= emc / moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
				}
			} else if (enemies[i].path[enemies[i].pi + 1].type == "attack") {
				enemies[i].path[enemies[i].pi + 1].tow.hp -= enemies[i].dmg;
				let killedTower = enemies[i].path[enemies[i].pi + 1].tow.hp <= 0;
				enemies[i].fract--;
				if (killedTower) {
					removeTower(towers.indexOf(enemies[i].path[++enemies[i].pi].tow));
					let emc = UPS / enemies[i].atkspd;
					if (enemies[i].pi < enemies[i].path.length - 1) {
						if (enemies[i].path[enemies[i].pi + 1].type == "attack") enemies[i].fract *= emc / (UPS / enemies[i].atkspd);
						else enemies[i].fract *= emc / moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
					}
					shouldUpdatePaths = true;
				}
			}
		}
		if (shouldUpdatePaths) updatePaths();
		
		if (enemies[i].pi < enemies[i].path.length - 1 && enemies[i].path[enemies[i].pi + 1].type == "move") {
			let nextMove = { x : enemies[i].path[enemies[i].pi + 1].x - enemies[i].x, y : enemies[i].path[enemies[i].pi + 1].y - enemies[i].y };
			enemies[i].tx = enemies[i].x + nextMove.x * enemies[i].fract, enemies[i].ty = enemies[i].y + nextMove.y * enemies[i].fract;
		} else enemies[i].tx = enemies[i].x, enemies[i].ty = enemies[i].y;
		
		if (enemies[i].hp <= 0) killEnemy(i);
	}
	
	for (let i = towers.length - 1; i >= 0; i--) {
		if (--towers[i].dlay <= 0) {
			let enemy, ldist = Infinity;
			for (let ii = 0; ii < enemies.length; ii++) {
				let d = dist({ x : towers[i].x + towers[i].w / 2, y : towers[i].y + towers[i].h / 2 },
					{ x : enemies[ii].tx + enemies[ii].r / 2, y : enemies[ii].ty + enemies[ii].r / 2 });
				if (d < ldist) enemy = enemies[ii], ldist = d;
			}
			if (enemy !== undefined && ldist < bulletTypes[towers[i].ammo].range * towers[i].ra) {
				let a = getAngle({ x : towers[i].x + towers[i].w / 2, y : towers[i].y + towers[i].h / 2 },
					{ x : enemy.tx + enemy.r / 2, y : enemy.ty + enemy.r / 2 });
				spawnBullet(towers[i].ammo, towers[i], a, enemy);
				towers[i].rot = a;
				towers[i].dlay += UPS / towers[i].as;
			} else ++towers[i].dlay;
		}
	}
	
	mouseEnemies = [];
	for (let i = 0; i < enemies.length; i++) {
		let en = enemies[i];
		if (omx / 8 < en.tx || omx / 8 >= en.tx + en.r
			|| omy / 8 < en.ty || omy / 8 >= en.ty + en.r) continue;
		mouseEnemies.push(en);
	}
	
	cups++;
};

let getNext = function(object, current) {
	let isNext = current == undefined;
	for (let index in object) {
		if (isNext) return index;
		if (index == current) isNext = true;
	}
	if (isNext) for (let index in object) return index;
};

let dragging = false;
let current = getNext(tileMap, undefined);

let updateInterval;
let changeSpeedMultiplier = function(mult) {
	clearInterval(updateInterval);
	updateInterval = setInterval(tick, 1000 / (UPS * mult));
};

let mouseMove = function(e) {
	let rect = canvas.getBoundingClientRect();
	mx = e.clientX - rect.left, my = e.clientY - rect.top;
};

let scrollMove = function(e) {
	let delta = (-e.detail * 40 | e.wheelDelta) / 120;
	ZOOMPOW += delta;
	ZOOM = Math.round(Math.pow(Math.pow(2, 1 / 7), ZOOMPOW) * 256) / 256;
	if (ZOOM < ldata.minZoom) ZOOM = ldata.minZoom, ZOOMPOW -= delta;
	if (ZOOM > ldata.maxZoom) ZOOM = ldata.maxZoom, ZOOMPOW -= delta;
};

let run = function() {
	canvas = document.getElementById("game");
	context = canvas.getContext("2d");
	
	initUI();
	
	setInterval(function() {
		canvas.width = canvas.width;
		if (STARTED) draw();
		else renderStart(context);
	}, 1000 / 20);
	updateInterval = setInterval(function() {
		if (STARTED) tick();
	}, 1000 / UPS);
	setInterval(function() {
		fps = cfps, ups = cups;
		cups = 0, cfps = 0;
	}, 1000 / 1);

	canvas.addEventListener("mousemove", function(e) {
		mouseMove(e);
		
		if (dragging && EDITOR && STARTED) {
			let omx = mx / ZOOM - OX + (256 - 256 / ZOOM), omy = my / ZOOM - OY + (192 - 192 / ZOOM);
			let mtx = Math.floor(omx / 8), mty = Math.floor(omy / 8);
			let mouseIsTile = mtx >= 0 && mtx < ldata.width && mty >= 0 && mty < ldata.height;
			if (mouseIsTile) setGridTile({ x : mtx, y : mty }, current);
		}
	}, false);
	
	canvas.addEventListener("mousedown", function(e) {
		dragging = true;
		if (EDITOR) {
			if (mouseIsTile) {
				setGridTile({ x : mtx, y : mty }, current);
			}
		}
		
		if (STARTED && mouseIsTile && currentTower != "")
			buildTower(currentTower, { x : mtx, y : mty });
	}, false);
	
	canvas.addEventListener("mouseup", function(e) {
		dragging = false;
	}, false);
	
	window.addEventListener("keypress", function(e) {
		shift = e.shiftKey;
		if (EDITOR) {
			if (e.charCode == 32) {
				current = getNext(tileMap, current);
			} else if (e.charCode == 112) {
				console.log(getMapString());
			}
		}
	}, false);
	
	window.addEventListener("keydown", function(e) { shift = e.shiftKey; }, false);
	window.addEventListener("keyup", function(e) { shift = e.shiftKey; }, false);
	
	window.onkeydown = function(e) {
		if (e.keyCode == 65) A = true;
		else if (e.keyCode == 68) D = true;
		else if (e.keyCode == 87) W = true;
		else if (e.keyCode == 83) S = true;
		else if (e.keyCode == 27) currentTower = "";
	};
	
	window.onkeyup = function(e) {
		if (e.keyCode == 65) A = false;
		else if (e.keyCode == 68) D = false;
		else if (e.keyCode == 87) W = false;
		else if (e.keyCode == 83) S = false;
	};
	
	window.addEventListener("mousewheel", scrollMove, false);
	window.addEventListener("DOMMouseScroll", scrollMove, false);
};

let winLoaded = false;
window.onload = function() { winLoaded = true; };
let checkLoaded = function() {
	let tilesLoaded = true;
	for (let i in tileMap)
		if (!tileMap[i].loaded)
			tilesLoaded = false;
	if (winLoaded && tilesLoaded) run();
	else setTimeout(checkLoaded, 50);
};
checkLoaded();