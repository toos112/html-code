let canvas, context;
let grid = new Array(64);
let ldata;
for (let i = 0; i < grid.length; i++) {
	grid[i] = new Array(48);
	for (let ii = 0; ii < grid[i].length; ii++)
		grid[i][ii] = null;
}

let start, end;
let cups = 0, cfps = 0;
let ups = 0, fps = 0;
let coins = 0, lives = 0;

let UPS = 30;

let tileMap = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	$.replaceAll($file.read("data/towdef/tilemap.txt").join(""), "\"", "\\\"");
:js)");

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

let setGridTile = function(pos, tile) {
	let obj = clone(tileMap[tile]);
	if (obj.name == "start") start = { x : pos.x, y : pos.y };
	else if (obj.name == "end") end = { x : pos.x, y : pos.y };
	grid[pos.x][pos.y] = obj;
};

let loadLevel = function(level, data) {
	for (let y = 0; y < level.length; y++) {
		let row = level[y].split("");
		for (let x = 0; x < row.length; x++)
			setGridTile({ x : x, y : y }, row[x]);
	}
	ldata = data;
};
loadLevel("(js:
	_.I("_scripts/file.js");
	$file.read("data/towdef/maps/level 1/level.txt").join("|");
:js)".split("|"), JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	$.replaceAll($file.read("data/towdef/maps/level 1/data.txt").join(""), "\"", "\\\"");
:js)"));

let enemyTypes = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	$.replaceAll($file.read("data/towdef/enemies.txt").join(""), "\"", "\\\"");
:js)");

let enemies = [];
let pendingSpawns = [];
let waves = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	$.replaceAll($file.read("data/towdef/maps/level 1/waves.txt").join(""), "\"", "\\\"");
:js)");
let waveQueue = [];

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
			if (p.x + x < 0 || p.x + x >= grid.length || p.y + y < 0 || p.y + y >= grid[p.x + x].length)
				return true;
			if (getBestSpeed({ x : p.x + x, y : p.y + y }, o, grid) == 0)
				return true;
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
			result += getBestSpeed({ x : p.x + x, y : p.y + y }, o, grid)
	return result / (o.r * o.r);
};

let moveCost = function(p, o, np, grid, isrelative) {
	let newpos = isrelative ? { x : o.x + np.x, y : o.y + np.y } : np;
	return (UPS / getSpeed(p, o, grid)) * odist(p, o, np, o);
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
			grid[i][ii].f = Infinity;
			grid[i][ii].p = undefined;
		}
	}
	openMap[start.x][start.y] = true;
	grid[start.x][start.y].g = 0;
	grid[start.x][start.y].f = odist(start, obj, end, { r : 1 });
	
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
        
        open.splice(open.indexOf(current), 1);
		openMap[current.x][current.y] = false;
        closed[current.x][current.y] = true;
        
        for (let i = 0; i < possible.length; i++) {
			if (!canMove(current, possible[i], grid, obj)) continue;
            if (closed[current.x + possible[i].x][current.y + possible[i].y]) continue;
            let node = { x : current.x + possible[i].x, y : current.y + possible[i].y };
            if (!openMap[node.x][node.y]) {
				open.push(node);
				openMap[node.x][node.y] = true;
			}
            let gScore = grid[current.x][current.y].g + moveCost(current, obj, node, grid, false);
            if (gScore >= grid[node.x][node.y].g) continue;
            grid[node.x][node.y].p = current;
            grid[node.x][node.y].g = gScore;
            grid[node.x][node.y].f = gScore + odist(node, obj, end, { r : 1 });
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
	et = enemyTypes[e];
	let enemy = spawnEnemy({ r : et.width, ls : et.landSpeed, ss : et.swimmingSpeed, fs : et.flyingSpeed, od : et.onDeath }, pos, com === undefined ? "LT" : com);
	enemy = updatePath(enemy);
	enemy.dlay = moveCost(enemy, enemy, enemy.path[enemy.pi + 1], grid, false);
	enemies.push(enemy);
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
};

let _spawn = function(e) {
	spawnAt(e, start, ldata.spawn);
};

let _spawnrandom = function(e) {
	et = enemyTypes[e];
	let enemy = { r : et.width, ls : et.landSpeed, ss : et.swimmingSpeed, fs : et.flyingSpeed, od : et.onDeath };
	let pos = { x : Math.floor(Math.random() * 64), y : Math.floor(Math.random() * 48) };
	while (isColliding(pos, enemy, grid))
		pos = { x : Math.floor(Math.random() * 64), y : Math.floor(Math.random() * 48) };
	spawnAt(e, pos);
};

let mapCanvas = document.createElement("canvas");
mapCanvas.width = 64 * 8;
mapCanvas.height = 48 * 8;
mapContext = mapCanvas.getContext("2d");
mapContext.fillStyle = "#373737";
mapContext.fillRect(0, 0, 64 * 8, 48 * 8);
let gridRenderCache = new Array(64);
for (let i = 0; i < gridRenderCache.length; i++) {
	gridRenderCache[i] = new Array(48);
	for (let ii = 0; ii < gridRenderCache[i].length; ii++)
		gridRenderCache[i][ii] = "#373737";
}
let renderMap = function() {
	for (let x = 0; x < grid.length; x++) {
		for (let y = 0; y < grid[x].length; y++) {
			if (grid[x][y].color != "none") {
				if (gridRenderCache[x][y] != grid[x][y].color) {
					mapContext.fillStyle = grid[x][y].color;
					gridRenderCache[x][y] = grid[x][y].color;
					mapContext.fillRect(x * 8, y * 8, 8, 8);
				}
			} else {
				let color = x % 2 == y % 2 ? "#373737" : "#474747";
				if (gridRenderCache[x][y] != color) {
					mapContext.fillStyle = color;
					gridRenderCache[x][y] = color;
					mapContext.fillRect(x * 8, y * 8, 8, 8);
				}
			}
		}
	}
};

let draw = function() {
	canvas.width = canvas.width;
	renderMap();
	context.drawImage(mapCanvas, 0, 0);
	for (let i = 0; i < enemies.length; i++) {
		context.fillStyle = "#3f1f1f";
		if (enemies[i].pi < enemies[i].path.length - 1) {
			let nextMove = { x : enemies[i].path[enemies[i].pi + 1].x - enemies[i].x, y : enemies[i].path[enemies[i].pi + 1].y - enemies[i].y };
			let fract = 1 - enemies[i].dlay / moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
			let tpos = { x : enemies[i].x + nextMove.x * fract, y : enemies[i].y + nextMove.y * fract };
			context.fillRect(tpos.x * 8, tpos.y * 8, 8 * enemies[i].r, 8 * enemies[i].r);
		} else {
			context.fillRect(enemies[i].x * 8, enemies[i].y * 8, 8 * enemies[i].r, 8 * enemies[i].r);
		}
	}
	if (enemies.length > 0) {
		context.beginPath();
		context.globalAlpha = 0.2;
		context.strokeStyle = "#ff0000";
		context.lineWidth = 2;
		context.moveTo(enemies[0].x * 8 + enemies[0].r * 4, enemies[0].y * 8 + enemies[0].r * 4);
		for (let ii = enemies[0].pi; ii < enemies[0].path.length - 1; ii++)
			context.lineTo(enemies[0].path[ii + 1].x * 8 + enemies[0].r * 4, enemies[0].path[ii + 1].y * 8 + enemies[0].r * 4);
		context.stroke();
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
			enemy = obj.enemies[0];
			spawnAt(enemy.name, start, ldata.spawn);
			if (--enemy.count <= 0)
				obj.enemies.splice(0, 1);
			if (obj.enemies.length == 0)
				waveQueue.splice(0, 1);
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
		
		--enemies[i].dlay;
		while (enemies[i].dlay <= 0 && enemies[i].pi < enemies[i].path.length - 1) {
			enemies[i].x = enemies[i].path[++enemies[i].pi].x;
			enemies[i].y = enemies[i].path[enemies[i].pi].y;
			if (enemies[i].pi < enemies[i].path.length - 1)
				enemies[i].dlay += moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
		}
	}
	cups++;
};

window.onload = function() {
	canvas = document.getElementById("game");
	context = canvas.getContext("2d");
	
	setInterval(draw, 1000 / 20);
	setInterval(tick, 1000 / UPS);
	setInterval(function() {
		fps = cfps, ups = cups;
		cups = 0, cfps = 0;
	}, 1000 / 1);
};