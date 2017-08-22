"use strict";

let canvas, context;
let grid = new Array(64), gridChars = new Array(64), towMap = new Array(64);
for (let i = 0; i < grid.length; i++) {
	grid[i] = new Array(48);
	gridChars[i] = new Array(48);
	towMap[i] = new Array(48);
	for (let ii = 0; ii < grid[i].length; ii++) {
		grid[i][ii] = null;
		gridChars[i][ii] = ".";
		towMap[i][ii] = "n";
	}
}

let toHex = function(i) {
	let str = i.toString(16);
	return str.length == 1 ? ("0" + str) : str;
};

let imgcanvas = document.createElement("canvas");
imgcanvas.width = 8, imgcanvas.height = 8;
let imgcontext = imgcanvas.getContext("2d");
let tileMap = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	var result = $json.parse($file.read("data/towdef/tilemap.txt").join(""));
	for (var i in result)
		result[i].imgdata = "" + _.img(result[i].texture);
	$.replaceAll($json.stringify(result), "\"", "\\\"");
:js)");
for (let i in tileMap) {
	tileMap[i].image = new Image();
	tileMap[i].image.onload = function() {
		tileMap[i].loaded = true;
		imgcontext.drawImage(tileMap[i].image, 0, 0);
		let data = imgcontext.getImageData(0, 0, 8, 8).data;
		tileMap[i].interdat = new Array(64);
		for (let ii = 0; ii < tileMap[i].interdat.length; ii++)
			tileMap[i].interdat[ii] = new Array(48);
		for (let x = 0; x < 8; x++)
			for (let y = 0; y < 8; y++)
				tileMap[i].interdat[y][x] = "#" + toHex(data[(x * 8 + y) * 4 + 0])
					+ toHex(data[(x * 8 + y) * 4 + 1]) + toHex(data[(x * 8 + y) * 4 + 2]);
	};
	tileMap[i].loaded = false;
	tileMap[i].image.src = tileMap[i].imgdata;
}

let start, end;
let cups = 0, cfps = 0;
let ups = 0, fps = 0;
let coins = 0, lives = 2000;
let ldata, waves;
let tilecount = { water : 0, land : 0, flight : 0, total : 0 };

let UPS = 30;
let EDITOR = false;
let STARTED = false;
let ZOOM = 1;
let OX = 0, OY = 0;
let A = false, S = false, D = false, W = false;
let INTERPOLATE = true;

let mx, my, mtx, mty, omx, omy;
let mouseTile, mouseIsTile;
let mouseEnemies = [];
let spawnDelay = 0;
let alt = 0;

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
	let tt = tileMap[tile];
	let obj = { name : tt.name, water : tt.water, land : tt.land, flight : tt.flight, canBuildTower : tt.canBuildTower, texture : tt.texture, image : tt.image, interdat : tt.interdat };
	
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
	for (let y = 0; y < level.level.length; y++) {
		let row = level.level[y].split("");
		for (let x = 0; x < row.length; x++)
			setGridTile({ x : x, y : y }, row[x]);
	}
	calculateExits();
	ldata = level.data;
	waves = level.waves;
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
	$.replaceAll($file.read("data/towdef/bullets.txt").join(""), "\"", "\\\"");
:js)");

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

let isColliding = function(p, o, grid) {
	for (let x = 0; x < o.r; x++) {
		for (let y = 0; y < o.r; y++) {
			if (p.x + x < 0 || p.x + x >= grid.length || p.y + y < 0 || p.y + y >= grid[p.x + x].length) return true;
			if (getBestSpeed({ x : p.x + x, y : p.y + y }, o, grid) == 0) return true;
		}
	}
	return false;
};
	
let canMove = function(pos, move, grid, obj) {
	if (move.x != 0 && move.y != 0)
		if (!canMove(pos, { x : move.x, y : 0 }, grid, obj) || !canMove(pos, { x : 0, y : move.y }, grid, obj)) return false;
	let nobj = { x : pos.x + move.x, y : pos.y + move.y };
	return !isColliding(nobj, obj, grid);
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
let findPath = function(start, end, obj, grid) {
	let open = [start];
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
                result.push(current);
                current = grid[current.x][current.y].p;
            }
            return result.reverse();
		}
        
		let index = open.indexOf(current)
        open.splice(index, 1);
		openMap[current.x][current.y] = false;
        closed[current.x][current.y] = true;
        
        for (let i = 0; i < possible.length; i++) {
			if (!canMove(current, possible[i], grid, obj)) continue;
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
};

let updatePath = function(e) {
	e.path = findPath(e, end, e, grid);
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
	let enemy = spawnEnemy({ r : et.width, ls : et.landSpeed, ss : et.swimmingSpeed, fs : et.flyingSpeed, od : et.onDeath,
		name : et.name, image : et.image, shp : et.hp, hp : et.hp, worth : et.worth, effects : [] }, pos, com === undefined ? "LT" : com);
	enemy = updatePath(enemy);
	if (enemy.path.length > 1) enemy.dlay = moveCost(enemy, enemy, enemy.path[enemy.pi + 1], grid, false);
	else enemy.dlay = 0;
	enemies.push(enemy);
};

let spawnTower = function(t, pos) {
	let tt = towerTypes[t];
	let first;
	for (let x = pos.x; x < pos.x + tt.width; x++) {
		for (let y = pos.y; y < pos.y + tt.height; y++) {
			if (!grid[x][y].canBuildTower || towMap[x][y] != "n" || (first !== undefined && grid[x][y].name != first))
				return false;
			first = grid[x][y].name;
		}
	}
	for (let x = pos.x; x < pos.x + tt.width; x++)
		for (let y = pos.y; y < pos.y + tt.height; y++)
			towMap[x][y] = "t";
	let tow = { x : pos.x, y : pos.y, w : tt.width, h : tt.height, ra : tt.range, ammo : tt.ammo[0],
		as : tt.attackSpeed, dlay : UPS / tt.attackSpeed, rot : 0, baseimage : tt.baseimage, gunimage : tt.gunimage };
	towers.push(tow);
	return true;
};

let spawnBullet = function(b, t, a) {
	let bt = bulletTypes[b];
	let bul = { x : (t.x + t.w / 2) * 8, y : (t.y + t.h / 2) * 8, sx : (t.x + t.w / 2) * 8, sy : (t.y + t.h / 2) * 8, ra : t.ra * bt.range, sp : bt.speed * 8 / UPS, a : a };
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
	let pos = { x : Math.floor(Math.random() * 64), y : Math.floor(Math.random() * 48) };
	while (isColliding(pos, enemy, grid))
		pos = { x : Math.floor(Math.random() * 64), y : Math.floor(Math.random() * 48) };
	spawnAt(e, pos);
};

let mapCanvas = document.createElement("canvas");
mapCanvas.width = 64 * 8;
mapCanvas.height = 48 * 8;
let mapContext = mapCanvas.getContext("2d");
let gridRenderCache = new Array(64), updateMap = new Array(64);
for (let i = 0; i < gridRenderCache.length; i++) {
	gridRenderCache[i] = new Array(48);
	updateMap[i] = new Array(48);
	for (let ii = 0; ii < gridRenderCache[i].length; ii++) {
		gridRenderCache[i][ii] = "#373737";
		updateMap[i][ii] = false;
	}
}
let renderMap = function() {
	for (let x = 0; x < grid.length; x++) {
		for (let y = 0; y < grid[x].length; y++) {
			if (gridRenderCache[x][y] != grid[x][y].texture) {
				updateMap[x][y] = true;
				if (INTERPOLATE) {
					if (x + 1 >= 0 && x + 1 < updateMap.length) updateMap[x + 1][y] = true;
					if (y + 1 >= 0 && y + 1 < updateMap[x].length) updateMap[x][y + 1] = true;
					if (x - 1 >= 0 && x - 1 < updateMap.length) updateMap[x - 1][y] = true;
					if (y - 1 >= 0 && y - 1 < updateMap[x].length) updateMap[x][y - 1] = true;
				}
				gridRenderCache[x][y] = grid[x][y].texture;
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
	let mm = 5;
	if (A && OX + mm < 64 / 2 * 8) OX += mm / ZOOM;
	if (D && OX - mm > -(64 / 2 * 8)) OX -= mm / ZOOM;
	if (W && OY + mm < 48 / 2 * 8) OY += mm / ZOOM;
	if (S && OY - mm > -(48 / 2 * 8)) OY -= mm / ZOOM;
	
	renderMap();
	context.imageSmoothingEnabled = false;
	context.drawImage(mapCanvas, addOffset(0, "x"), addOffset(0, "y"), mapCanvas.width * ZOOM, mapCanvas.height * ZOOM);
	
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
	
	for (let i = 0; i < towers.length; i++) {
		context.drawImage(towers[i].baseimage, addOffset(towers[i].x * 8, "x"), addOffset(towers[i].y * 8, "y"), towers[i].w * 8 * ZOOM, towers[i].h * 8 * ZOOM);
		context.save();
		context.translate(addOffset(towers[i].x * 8, "x") + towers[i].w * 4 * ZOOM, addOffset(towers[i].y * 8, "y") + towers[i].h * 4 * ZOOM);
		context.rotate(towers[i].rot + Math.PI / 2);
		context.drawImage(towers[i].gunimage, -towers[i].w * 4 * ZOOM, -towers[i].h * 4 * ZOOM, towers[i].w * 8 * ZOOM, towers[i].h * 8 * ZOOM)
		context.restore();
	}
	
	context.beginPath();
	context.globalAlpha = 0.25;
	context.strokeStyle = "#ff0000";
	context.lineWidth = 2 * ZOOM;
	for (let i = 0; i < mouseEnemies.length; i++) {
		let en = mouseEnemies[i];
		context.moveTo(addOffset(en.x * 8 + en.r * 4, "x"), addOffset(en.y * 8 + en.r * 4, "y"));
		for (let ii = en.pi; ii < en.path.length - 1; ii++)
			context.lineTo(addOffset(en.path[ii + 1].x * 8 + en.r * 4, "x"), addOffset(en.path[ii + 1].y * 8 + en.r * 4, "y"));
	}
	context.stroke();
	context.globalAlpha = 1;
	
	context.strokeStyle = "#7f7f00";
	context.lineWidth = 1 * ZOOM;
	for (let i = 0; i < bullets.length; i++) {
		context.beginPath();
		context.arc(addOffset(bullets[i].x, "x"), addOffset(bullets[i].y, "y"), 2 * ZOOM, 0, 2 * Math.PI);
		context.stroke();
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
	
	for (let i = enemies.length - 1; i >= 0; i--) {
		if (isFinished(enemies[i], enemies[i]) || isColliding(enemies[i], enemies[i], grid)) {
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
		
		--enemies[i].dlay;
		while (enemies[i].dlay <= 0 && enemies[i].pi < enemies[i].path.length - 1) {
			enemies[i].x = enemies[i].path[++enemies[i].pi].x;
			enemies[i].y = enemies[i].path[enemies[i].pi].y;
			if (enemies[i].pi < enemies[i].path.length - 1)
				enemies[i].dlay += moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
		}
		
		if (enemies[i].pi < enemies[i].path.length - 1) {
			let nextMove = { x : enemies[i].path[enemies[i].pi + 1].x - enemies[i].x, y : enemies[i].path[enemies[i].pi + 1].y - enemies[i].y };
			let fract = 1 - enemies[i].dlay / moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
			enemies[i].tx = enemies[i].x + nextMove.x * fract, enemies[i].ty = enemies[i].y + nextMove.y * fract;
		} else enemies[i].tx = enemies[i].x, enemies[i].ty = enemies[i].y;
		
		if (enemies[i].hp <= 0) killEnemy(i);
	}
	
	for (let i = towers.length - 1; i>= 0; i--) {
		if (--towers[i].dlay <= 0) {
			let enemy, ldist = Infinity;
			for (let ii = 0; ii < enemies.length; ii++) {
				let d = dist({ x : towers[i].x + towers[i].w / 2, y : towers[i].y + towers[i].h / 2 },
					{ x : enemies[ii].x + enemies[ii].r / 2, y : enemies[ii].y + enemies[ii].r / 2 });
				if (d < ldist) enemy = enemies[ii], ldist = d;
			}
			if (enemy !== undefined && ldist < bulletTypes[towers[i].ammo].range * towers[i].ra) {
				let a = getAngle({ x : towers[i].x + towers[i].w / 2, y : towers[i].y + towers[i].h / 2 },
					{ x : enemy.x + enemy.r / 2, y : enemy.y + enemy.r / 2 });
				spawnBullet(towers[i].ammo, towers[i], a);
				towers[i].dlay += UPS / towers[i].as;
			} else ++towers[i].dlay;
		}
	}
	
	for (let i = bullets.length - 1; i >= 0; i--) {
		let offset = angleToPos(bullets[i].a, bullets[i].sp);
		bullets[i].x += offset.x, bullets[i].y += offset.y;
		if (dist(bullets[i], { x : bullets[i].sx, y : bullets[i].sy }) > bullets[i].ra * 8)
			bullets.splice(i, 1);
	}
	
	mtx = Math.floor(omx / 8), mty = Math.floor(omy / 8);
	mouseIsTile = mtx >= 0 && mtx < 64 && mty >= 0 && mty < 48
	if (mouseIsTile) mouseTile = grid[mtx][mty];
	else mouseTile = undefined;
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
	omx = mx / ZOOM - OX + (256 - 256 / ZOOM), omy = my / ZOOM - OY + (192 - 192 / ZOOM);
};

let scrollMove = function(e) {
	let delta = -e.detail * 40 | e.wheelDelta;
	if (delta > 0) ZOOM *= (1 + delta / 500);
	else if (delta < 0) ZOOM /= (1 + -delta / 500);
	if (ZOOM < ldata.minZoom) ZOOM = ldata.minZoom;
	if (ZOOM > ldata.maxZoom) ZOOM = ldata.maxZoom;
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
		if (dragging) {
			if (EDITOR) {
				if (mouseIsTile) {
					setGridTile({ x : mtx, y : mty }, current);
				} 
			}
		}
	}, false);
	
	canvas.addEventListener("mousedown", function(e) {
		dragging = true;
		if (EDITOR) {
			if (mouseIsTile) {
				setGridTile({ x : mtx, y : mty }, current);
			}
		}
	}, false);
	
	canvas.addEventListener("mouseup", function(e) {
		dragging = false;
	}, false);
	
	window.addEventListener("keypress", function(e) {
		if (EDITOR) {
			if (e.charCode == 32) {
				current = getNext(tileMap, current);
			} else if (e.charCode == 112) {
				console.log(getMapString());
			}
		}
	}, false);
	
	window.onkeydown = function(e) {
		if (e.keyCode == 65) A = true;
		else if (e.keyCode == 68) D = true;
		else if (e.keyCode == 87) W = true;
		else if (e.keyCode == 83) S = true;
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