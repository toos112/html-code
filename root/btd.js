let canvas, context;
let grid = new Array(64);
let ldata;
for (let i = 0; i < grid.length; i++) {
	grid[i] = new Array(48);
	for (let ii = 0; ii < grid[i].length; ii++)
		grid[i][ii] = { name : null, solid : false };
}

let start, end;

let loadLevel = function(level, data) {
	for (let y = 0; y < level.length; y++) {
		let row = level[y].split("");
		for (let x = 0; x < row.length; x++) {
			if (row[x] == "S") {
				start = { x : x, y : y };
				grid[x][y] = { name : "start", solid : false };
			} else if (row[x] == "E") {
				end = { x : x, y : y };
				grid[x][y] = { name : "end", solid : false };
			} else if (row[x] == "#") {
				grid[x][y] = { name : "wall", solid : true };
			} else if (row[x] == ".") {
				grid[x][y] = { name : null, solid : false };
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

let spawnEnemy = function(e) {
	if (ldata.spawn == "LB") {
		e.x = start.x;
		e.y = start.y - e.r;
	} else if (ldata.spawn == "RB") {
		e.x = start.x - e.r;
		e.y = start.y - e.r;
	} else if (ldata.spawn == "LT") {
		e.x = start.x;
		e.y = start.y;
	} else if (ldata.spawn == "RT") {
		e.x = start.x - e.r;
		e.y = start.y;
	}
	enemies.push(e);
	return e;
};

let _spawn = function(e) {
	et = enemyTypes[e];
	let speed = et.flyingSpeed;
	if (speed == -1) speed = et.swimmingSpeed;
	if (speed == -1) speed = et.landSpeed;
	spawnEnemy({ r : et.width, s : speed, dlay : 0 });
}
	
let canMove = function(obj, move, radius, grid) {
	if (move.x != 0 && move.y != 0)
		if (!canMove(obj, { x : move.x, y : 0 }, radius, grid) || !canMove(obj, { x : 0, y : move.y }, radius, grid)) return false;
	let nobj = { x : obj.x + move.x, y : obj.y + move.y };
	for (let x = 0; x < radius; x++) {
		for (let y = 0; y < radius; y++) {
			if (nobj.x + x < 0 || nobj.x + x >= grid.length || nobj.y + y < 0 || nobj.y + y >= grid[nobj.x + x].length)
				return false;
			if (grid[nobj.x + x][nobj.y + y].solid)
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

let possible = [{ x : 0, y : 1 }, { x : 0, y : -1 }, { x : 1, y : 0 }, { x : -1, y : 0 }, { x : 1, y : 1 }, { x : 1, y : -1 }, { x : -1, y : 1 }, { x : -1, y : -1 }];
let findPath = function(start, end, radius, grid) {
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
	grid[start.x][start.y].f = mdist(start, end);
	
	while (open.length > 0) {
        let current, fScore = Infinity;
        for (let i = 0; i < open.length; i++) {
            if (grid[open[i].x][open[i].y].f < fScore) {
                fScore = grid[open[i].x][open[i].y].f;
                current = open[i];
            }
        }
		
		if (Math.abs(current.x - end.x) < radius && Math.abs(current.y - end.y) < radius) {
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
			if (!canMove(current, possible[i], radius, grid)) continue;
            if (closed[current.x + possible[i].x][current.y + possible[i].y]) continue;
            let node = { x : current.x + possible[i].x, y : current.y + possible[i].y };
            if (!openMap[node.x][node.y]) {
				open.push(node);
				openMap[node.x][node.y] = true;
			}
            let gScore = grid[current.x][current.y].g + dist(current, node);
            if (gScore >= grid[node.x][node.y].g) continue;
            grid[node.x][node.y].p = current;
            grid[node.x][node.y].g = gScore;
            grid[node.x][node.y].f = gScore + mdist(node, end);
        }
	}
};

window.onload = function() {
	canvas = document.getElementById("game");
	context = canvas.getContext("2d");
	
	setInterval(function() {
		for (let x = 0; x < grid.length; x++) {
			for (let y = 0; y < grid[x].length; y++) {
				if (grid[x][y].name == "start") {
					context.fillStyle = "#3f7f3f";
				} else if (grid[x][y].name == "end") {
					context.fillStyle = "#7f3f3f";
				} else if (grid[x][y].name == "wall") {
					context.fillStyle = "#1f1f1f";
				} else context.fillStyle = (x % 2 == y % 2) ? "#373737" : "#474747";
				context.fillRect(x * 8, y * 8, 8, 8);
			}
		}
		for (let i = 0; i < enemies.length; i++) {
			context.fillStyle = "#3f1f1f";
			context.fillRect(enemies[i].x * 8, enemies[i].y * 8, 8 * enemies[i].r, 8 * enemies[i].r);
		}
		renderUi(context);
	}, 50);
	
	setInterval(function() {
		for (let i = enemies.length - 1; i >= 0; i--) {
			if (Math.abs(enemies[i].x - end.x) < enemies[i].r && Math.abs(enemies[i].y - end.y) < enemies[i].r) {
				enemies.splice(i, 1);
				continue;
			}
			if (enemies[i].dlay++ >= enemies[i].s) {
				let path = findPath(enemies[i], end, enemies[i].r, grid);
				enemies[i].x = path[1].x;
				enemies[i].y = path[1].y;
				enemies[i].dlay = 0;
			}
		}
	}, 50);
};