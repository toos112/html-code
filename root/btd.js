let canvas, context;
let grid = new Array(64);
let ldata;
for (let i = 0; i < grid.length; i++) {
	grid[i] = new Array(48);
	for (let ii = 0; ii < grid[i].length; ii++)
		grid[i][ii] = null;
}

let start, end;

let loadLevel = function(level, data) {
	for (let y = 0; y < level.length; y++) {
		let row = level[y].split("");
		for (let x = 0; x < row.length; x++) {
			if (row[x] == "S") {
				start = { x : x, y : y };
				grid[x][y] = { name : "start", water : true, land : true, flight : true };
			} else if (row[x] == "E") {
				end = { x : x, y : y };
				grid[x][y] = { name : "end", water : true, land : true, flight : true };
			} else if (row[x] == "#") {
				grid[x][y] = { name : "wall", water : false, land : false, flight : false };
			} else if (row[x] == ".") {
				grid[x][y] = { name : null, water : false, land : true, flight : true };
			} else if (row[x] == "w") {
				grid[x][y] = { name : "water", water : true, land : false, flight : true };
			} else if (row[x] == "^") {
				grid[x][y] = { name : "hill", water : false, land : false, flight : true };
			}
		}
	}
	ldata = data;
};
loadLevel("(js:
	_.I("_scripts/file.js");
	$file.read("data/btd/maps/level 1/level.txt").join("|");
:js)".split("|"), JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	$.replaceAll($file.read("data/btd/maps/level 1/data.txt").join(""), "\"", "\\\"");
:js)"));

let enemyTypes = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	$.replaceAll($file.read("data/btd/btdEnemy.txt").join(""), "\"", "\\\"");
:js)");

let enemies = [];

let spawnPos = function(r, start) {
	let pos = { x : start.x, y : start.y };
	if (ldata.spawn == "LB") {
		pos.x = start.x;
		pos.y = start.y - r + 1;
	} else if (ldata.spawn == "RB") {
		pos.x = start.x - r + 1;
		pos.y = start.y - r + 1;
	} else if (ldata.spawn == "LT") {
		pos.x = start.x;
		pos.y = start.y;
	} else if (ldata.spawn == "RT") {
		pos.x = start.x - r + 1;
		pos.y = start.y;
	}
	return pos;
}

let spawnEnemy = function(e, start) {
	if (ldata.spawn == "LB") {
		e.x = start.x;
		e.y = start.y - e.r + 1;
	} else if (ldata.spawn == "RB") {
		e.x = start.x - e.r + 1;
		e.y = start.y - e.r + 1;
	} else if (ldata.spawn == "LT") {
		e.x = start.x;
		e.y = start.y;
	} else if (ldata.spawn == "RT") {
		e.x = start.x - e.r + 1;
		e.y = start.y;
	}
	return e;
};

let getBestSpeed = function(p, o, grid) {
	let t = grid[p.x][p.y];
	let result = Infinity;
	if (o.ls != -1 && o.ls < result && t.land) result = o.ls;
	if (o.ss != -1 && o.ss < result && t.water) result = o.ss;
	if (o.fs != -1 && o.fs < result && t.flight) result = o.fs;
	return result;
}
	
let canMove = function(pos, move, grid, obj) {
	if (move.x != 0 && move.y != 0)
		if (!canMove(pos, { x : move.x, y : 0 }, grid, obj) || !canMove(pos, { x : 0, y : move.y }, grid, obj)) return false;
	let nobj = { x : pos.x + move.x, y : pos.y + move.y };
	for (let x = 0; x < obj.r; x++) {
		for (let y = 0; y < obj.r; y++) {
			if (nobj.x + x < 0 || nobj.x + x >= grid.length || nobj.y + y < 0 || nobj.y + y >= grid[nobj.x + x].length)
				return false;
			if (getBestSpeed({ x : nobj.x + x, y : nobj.y + y }, obj, grid) == Infinity)
				return false;
		}
	}
	return true;
}

let mdist = function(a, b) {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

let dist = function(a, b) {
	return Math.sqrt((a.x-b.x) * (a.x-b.x) + (a.y-b.y) * (a.y-b.y));
}

let omdist = function(posa, obja, posb, objb) {
	return Math.abs(posa.x + obja.r / 2 - posb.x - objb.r / 2)
		+ Math.abs(posa.y + obja.r / 2 - posb.y - objb.r / 2);
}

let odist = function(posa, obja, posb, objb) {
	let dx = posa.x + obja.r / 2 - posb.x - objb.r / 2,
		dy = posa.y + obja.r / 2 - posb.y - objb.r / 2;
	return Math.sqrt(dx * dx + dy * dy);
}

let isFinished = function(pos, obj) {
	return Math.abs(pos.x + obj.r * 0.5 - (end.x + 0.5)) < obj.r / 2
		&& Math.abs(pos.y + obj.r * 0.5 - (end.y + 0.5)) < obj.r / 2;
}

let getSpeed = function(p, o, grid) {
	let result = 0;
	for (let x = 0; x < o.r; x++)
		for (let y = 0; y < o.r; y++)
			result += getBestSpeed({ x : p.x + x, y : p.y + y }, o, grid)
	return Math.round(result / (o.r * o.r));
}

let moveCost = function(p, o, np, grid, isrelative) {
	let newpos = isrelative ? { x : o.x + np.x, y : o.y + np.y } : np;
	return Math.round(getSpeed(p, o, grid) * odist(p, o, np, o));
}

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
}

let updatePaths = function() {
	for (let i = 0; i < enemies.length; i++)
		enemies[i] = updatePath(enemies[i]);
}
updatePaths();

let _spawn = function(e) {
	et = enemyTypes[e];
	let enemy = spawnEnemy({ r : et.width, ls : et.landSpeed, ss : et.swimmingSpeed, fs : et.flyingSpeed }, start);
	enemy = updatePath(enemy);
	enemy.dlay = moveCost(enemy, enemy, enemy.path[enemy.pi + 1], grid, false);
	enemies.push(enemy);
};

let _spawnrandom = function(e) {
	et = enemyTypes[e];
	let enemy = { r : et.width, ls : et.landSpeed, ss : et.swimmingSpeed, fs : et.flyingSpeed };
	let pos = { x : Math.floor(Math.random() * 64), y : Math.floor(Math.random() * 48) };
	while (getSpeed(pos, enemy, grid) == Infinity)
		pos = { x : Math.floor(Math.random() * 64), y : Math.floor(Math.random() * 48) };
	enemy = spawnEnemy(enemy, pos);
	enemy = updatePath(enemy);
	enemy.dlay = moveCost(enemy, enemy, enemy.path[enemy.pi + 1], grid, false);
	enemies.push(enemy);
}

window.onload = function() {
	canvas = document.getElementById("game");
	context = canvas.getContext("2d");
	
	setInterval(function() {
		canvas.width = canvas.width;
		for (let x = 0; x < grid.length; x++) {
			for (let y = 0; y < grid[x].length; y++) {
				if (grid[x][y].name == "start") {
					context.fillStyle = "#3f7f3f";
				} else if (grid[x][y].name == "end") {
					context.fillStyle = "#7f3f3f";
				} else if (grid[x][y].name == "wall") {
					context.fillStyle = "#1f1f1f";
				} else if (grid[x][y].name == "water") {
					context.fillStyle = "#3f3f7f";
				} else if (grid[x][y].name == "hill") {
					context.fillStyle = "#7f5f3f";
				} else context.fillStyle = (x % 2 == y % 2) ? "#373737" : "#474747";
				context.fillRect(x * 8, y * 8, 8, 8);
			}
		}
		for (let i = 0; i < enemies.length; i++) {
			context.fillStyle = "#3f1f1f";
			if (enemies[i].pi < enemies[i].path.length - 1) {
				let nextMove = { x : enemies[i].path[enemies[i].pi + 1].x - enemies[i].x, y : enemies[i].path[enemies[i].pi + 1].y - enemies[i].y };
				let fract = 1 - enemies[i].dlay / moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
				let tpos = { x : enemies[i].x + nextMove.x * fract, y : enemies[i].y + nextMove.y * fract };
				context.fillRect(Math.round(tpos.x * 8), Math.round(tpos.y * 8), 8 * enemies[i].r, 8 * enemies[i].r);
			} else {
				context.fillRect(enemies[i].x * 8, enemies[i].y * 8, 8 * enemies[i].r, 8 * enemies[i].r);
			}
		}
		for (let i = 0; i < enemies.length; i++) {
			context.beginPath();
			context.globalAlpha = 0.2;
			context.strokeStyle = "#ff0000";
			context.lineWidth = 2;
			context.moveTo(enemies[i].x * 8 + enemies[i].r * 4, enemies[i].y * 8 + enemies[i].r * 4);
			for (let ii = enemies[i].pi; ii < enemies[i].path.length - 1; ii++)
				context.lineTo(enemies[i].path[ii + 1].x * 8 + enemies[i].r * 4, enemies[i].path[ii + 1].y * 8 + enemies[i].r * 4);
			context.stroke();
			context.globalAlpha = 1;
		}
		renderUI(context);
	}, 1000 / 20);
	
	setInterval(function() {
		for (let i = enemies.length - 1; i >= 0; i--) {
			if (isFinished(enemies[i], enemies[i])) {
				enemies.splice(i, 1);
				continue;
			}
			if (--enemies[i].dlay <= 0) {
				enemies[i].x = enemies[i].path[++enemies[i].pi].x;
				enemies[i].y = enemies[i].path[enemies[i].pi].y;
				if (enemies[i].pi < enemies[i].path.length - 1)
					enemies[i].dlay = moveCost(enemies[i], enemies[i], enemies[i].path[enemies[i].pi + 1], grid, false);
			}
		}
	}, 1000 / 30);
};