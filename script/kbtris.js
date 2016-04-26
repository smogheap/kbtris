function KBTRIS(canvas, controls, pausemenu) {
	var SHOWNEXT = 6;
	var TETRAD = ['o', 'j', 's', 'z', 'i', 'l', 't'];
	var COLOR = [ "blue", "gold", "orange",
				  "darkturquoise", "red", "fuchsia", "limegreen"];

	var GPX = document.createElement("canvas");
	var GPXctx = GPX.getContext("2d");
	var IMG = {
		"img/block.png": null,
		"img/pivot.png": null,
		"img/empty.png": null,
		"img/space.png": null
	};
	var run = false;
	var firstkey = null;
	var autodrop = false;
	var scoot = true;
	var grid = [];
	var next = [];
	var tetrad = {
		shape: null,
		x: 0,
		y: 0,
		rot: 0
	};
	var lines = 0;
	var fixoffset = 0;
	var timer = null;
	var fall = 0;
	var times = [];
	var lps = 0;
	var max = 0;
	var keys = {};
	var labels = [];
	var ctx = canvas.getContext("2d");
	var elm = {
		controls: controls
	};
	var self = this;


	function parse_controls() {
		var rows = [ "flip", "ccw", "move", "cw" ]
		var col = 0;
		var input = null;
		keys = {};
		labels = [];
		rows.every(function(row) {
			for(col = 0; col < 10; ++col) {
				if((input = elm.controls.querySelector("#" +row + col))) {
					keys[input.value] = {
						col: col,
						rot: row
					}
					if(row === "move") {
						labels[col] = input.value;
					}
				}
			}
			return true;
		});
		autodrop = elm.controls.querySelector("#autodrop").checked;
		scoot = elm.controls.querySelector("#scoot").checked;
	}

	function resize() {
		var parent = canvas.parentElement;
		var size = Math.min(parent.clientWidth, parent.clientHeight);
		canvas.width = canvas.height = size;
	}

	function build_tetrad(shape) {
		var piece = null;
		var color = null;
		switch(TETRAD[shape]) {
		case 'o':
			piece = [{x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}];
			break;
		case 'j':
			piece = [{x: 1, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
			break;
		case 's':
			piece = [{x: 0, y: 1}, {x: -1, y: 1}, {x: 1, y: 0}];
			break;
		case 'z':
			piece = [{x: 1, y: 1}, {x: 0, y: 1}, {x: -1, y: 0}];
			break;
		case 'i':
			piece = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}];
			break;
		case 'l':
			piece = [{x: -1, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
			break;
		case 't':
			piece = [{x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
			break;
		default:
			break;
		}
		return {
			piece: piece,
			color: shape, //COLOR[shape],
			x: 4,
			y: 0,
			rot: 0
		};
	}

	function draw_empty(x, y) {
		var offx = (canvas.width / 22) * 6;
		var offy = (canvas.height / 22);
		ctx.drawImage(GPX, 128 * 8, 128, 128, 128,
					  x * canvas.width/22 + offx, y * canvas.height/22 + offy,
					  canvas.width / 22, canvas.height / 22);
	}
	function draw_block(x, y, color, pivot) {
		var offx = (canvas.width / 22) * 6;
		var offy = (canvas.height / 22);
		var alpha = ctx.globalAlpha;
		if(y < 0) {
			ctx.globalAlpha /= 2;
		}
		ctx.drawImage(GPX, 128 * color, pivot ? 128 : 0, 128, 128,
					  x * canvas.width/22 + offx, y * canvas.height/22 + offy,
					  canvas.width / 22, canvas.height / 22);
		ctx.globalAlpha = alpha;
	}

	function seek_down(tetrad) {
		var i = 0;
		var j = 0;
		var quit = false;
		for(i = tetrad.y + 1; i < 20; ++i) {
			if(grid[i][tetrad.x]) {
				break;
			}
			for(j = 0; j < 3; ++j) {
				if(i + tetrad.piece[j].y > 19 ||
				   (i + tetrad.piece[j].y >= 0 &&
					grid[i + tetrad.piece[j].y][tetrad.x + tetrad.piece[j].x])) {
					quit = true;
				}
			}
			if(quit) {
				break;
			}
		}
		if(i - 1 > tetrad.y) {
			return i - 1;
		}
		return 0;
	}

	function game_over() {
		if(run) {
			run = false;
			self.halt = true;
			alert("GAME OVER");
			pausemenu.classList.toggle("hidden", true);
			if(mode) {
				mode("title");
			}
		}
	}

	function clear_lines() {
		var y = 0;
		var x = 0;
		var arr = null;
		for(y = 19; y >= 0; --y) {
			for(x = 0; x < 10; ++x) {
				if(!grid[y][x]) {
					break;
				}
			}
			if(x >= 10) {
				++lines;
				times.push(timer);
				arr = [];
				for(x = 0; x < 10; ++x) {
					arr.push(null);
				}
				grid.splice(y, 1);
				grid.splice(0, 0, arr);
				++y;
			}
		}
	}

	function drop_piece() {
		tetrad.y = seek_down(tetrad) || tetrad.y;
	}
	function land_piece() {
		var down = seek_down(tetrad) || tetrad.y;
		var i = 0;
		grid[down][tetrad.x] = tetrad.color + 1;
		for(i = 0; i < 3; ++i) {
			if(tetrad.piece[i].y + down > 19) {
				game_over();
				return;
			}
			grid[tetrad.piece[i].y + down][tetrad.x + tetrad.piece[i].x] = tetrad.color + 1;
		}
	}

	function draw_tetrad(shape, x, y, clear, shadow) {
		var i = 0;
		var down = null;
		var tet = null;
		if(shape === undefined) {
			x = tetrad.x;
			y = shadow ? y : tetrad.y;
			tet = tetrad;
			if(!shadow && (down = seek_down(tetrad))) {
				draw_tetrad(undefined, x, down, clear, true);
			}
		} else {
			tet = build_tetrad(shape);
		}
		var piece = tet.piece;
		var color = clear ? null : (shadow ? COLOR.length : tet.color);
		draw_block(x, y, color, !clear);
		for(i = 0; i < 3; ++i) {
			draw_block(x + piece[i].x, y + piece[i].y, color);
		}
	}

	function draw_next() {
		var i = 0;
		for(i = 0; i < SHOWNEXT; ++i) {
			draw_tetrad(next[i], 12, (i * 3) + 2);
		}
	}

	function next_piece() {
		fall = 0;
		tetrad = build_tetrad(next.shift());
		next.push(Math.floor(Math.random() * 7));
		if(!move_piece(tetrad.x)) {
			game_over();
			return;
		}
	}

	function move_piece(col) {
		var i = 0;
		var block = null;
		var cell = null;
		if(grid[tetrad.y][col]) {
			return false;
		}
		for(i = 0; i < 3; ++i) {
			block = tetrad.piece[i];
			if(col + block.x < 0 || col + block.x > 9 ||
			   (tetrad.y + block.y >= 0 &&
				grid[tetrad.y + block.y][col + block.x])) {
				return false;
			}
		}
		tetrad.x = col;
		return true;
	}
	function rotate_piece(amt) {
		var i = 0;
		var tmp = null;
		var block = null;
		var rot = tetrad.rot || 0;
		var piece = [];
		for(i = 0; i < 3; ++i) {
			piece[i] = {
				x: tetrad.piece[i].x,
				y: tetrad.piece[i].y
			};
		}

		// hack: row per orientation
		var map = [
			{move: "move", cw: "cw", flip: "flip", ccw: "ccw"},
			{move: "ccw", cw: "move", flip: "cw", ccw: "flip"},
			{move: "flip", cw: "ccw", flip: "move", ccw: "cw"},
			{move: "cw", cw: "flip", flip: "ccw", ccw: "move"}
		];
		var rotmap = [
			{move: 0, cw: 1, flip: 2, ccw: 3},
			{move: 1, cw: 2, flip: 3, ccw: 0},
			{move: 2, cw: 3, flip: 0, ccw: 1},
			{move: 3, cw: 0, flip: 1, ccw: 2}
		];
		amt = map[rot][amt];
		rot = rotmap[rot][amt];

		switch(amt) {
		case "ccw":
			for(i = 0; i < 3; ++i) {
				tmp = piece[i].x;
				piece[i].x = piece[i].y;
				piece[i].y = tmp * -1;
			}
			break;
		case "cw":
			for(i = 0; i < 3; ++i) {
				tmp = piece[i].x;
				piece[i].x = piece[i].y * -1;
				piece[i].y = tmp;
			}
			break;
		case "flip":
			for(i = 0; i < 3; ++i) {
				piece[i].x *= -1;
				piece[i].y *= -1;
			}
			break;
		default:
			break;
		}
		for(i = 0; i < 3; ++i) {
			block = piece[i];
			if(tetrad.x + block.x < 0 || tetrad.x + block.x > 9 ||
			   tetrad.y + block.y > 19 ||
			   (tetrad.y + block.y >= 0 &&
				grid[tetrad.y + block.y][tetrad.x + block.x])) {
				return false;
			}
		}
		tetrad.piece = piece;
		tetrad.rot = rot;
		return true;
	}

	function pause() {
		var i = 0;
		run = !run;
		pausemenu.classList.toggle("hidden", run);
		if(run) {
			fixoffset = new Date() - fixoffset;
			for(i = 0; i < times.length; ++i) {
				times[i] += fixoffset;
			}
			fall += fixoffset;
		} else {
			fixoffset = new Date();
		}
	}
	self.pause = pause;

	function keydown(e) {
		var key = e.key || String.fromCharCode(e.keyCode).toLowerCase();
		if(!run && e.keyCode !== 27) {
			return;
		}
		var cmd = null;
		if(e.keyCode === 27) {
			pause();
			return;
		} else if(key === " ") {
			drop_piece();
			firstkey = key;
		} else if(key && (cmd = keys[key])) {
			if(!firstkey) {
				firstkey = key;
			} else if(!scoot) {
				return;
			}
			rotate_piece(cmd.rot);
			if(!move_piece(cmd.col)) {
				if(cmd.col < 1) {
					move_piece(cmd.col + 1);
				} else if(cmd.col > 7) {
					if(!move_piece(cmd.col - 1)) {
						move_piece(cmd.col - 2);
					}
				}
			}
			if(autodrop) {
				drop_piece();
			}
		} else {
			firstkey = null;
			return;
		}
		if(autodrop && !scoot) {
			land_piece();
			clear_lines();
			next_piece();
			firstkey = null;
		}
		e.preventDefault();
	}
	function keyup(e) {
		var key = e.key || String.fromCharCode(e.keyCode).toLowerCase();
		if(!run && !scoot) {
			return;
		}
		if((autodrop && firstkey === key) ||
		   (key === " " && firstkey === key)) {
			land_piece();
			clear_lines();
			next_piece();
			firstkey = null;
		}
	}

	function reset() {
		parse_controls();

		lines = 0;
		times = [];
		lpm = max = 0;
		fall = 0;
		grid = [];
		var row = null;
		var i = 0;
		var j = 0;
		for(j = 0; j < 20; ++j) {
			row = [];
			for(i = 0; i < 10; ++i) {
				row.push(null);
			}
			grid.push(row);
		}

		next = [];
		for(i = 0; i < SHOWNEXT; ++i) {
			next.push(Math.floor(Math.random() * 7));
		}
		tetrad = build_tetrad(Math.floor(Math.random() * 7));

		resize();
		run = true;
		pausemenu.classList.toggle("hidden", run);

		self.halt = false;
		requestAnimationFrame(render);
	}
	self.reset = reset;

	function pad(val) {
		var str = "" + val;
		while(str.length < 7) {
			str = " " + str;
		}
		return str;
	}

	function gravity() {
		if(self.practice) {
			return;
		}
		if(seek_down(tetrad)) {
			++(tetrad.y);
		} else {
			land_piece();
			clear_lines();
			next_piece();
			firstkey = null;
		}
	}

	function nexttime() {
		return 1000 - ((Math.min(200, lines) / 200) * 900);
	}

	function tick() {
		if(!fall) {
			fall = timer + nexttime();
		}
		while(fall && timer > fall) {
			fall += nexttime();
			gravity();

			// calculate lines per minute
			times = times.filter(function(item) {
				return timer - item <= (1000 * 60);
			});
			lpm = times.length;
			if(max < lpm) {
				max = lpm;
			}
		}
	}

	function render(time) {
		var x;
		var y;

		timer = time;
		canvas.height = canvas.height;
		if(!self.halt) {
			requestAnimationFrame(render);
		}

		ctx.fillStyle = "black";
		ctx.globalAlpha = 0.66;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		//main area
		ctx.fillRect(canvas.width / 22 * 6, 0,
					 canvas.width / 22 * 10, canvas.height);

		//next
		ctx.fillRect(canvas.width / 22 * 17, canvas.height / 22 * 1,
					 canvas.width / 22 * 4, canvas.height / 22 * 20);

		//stats
		ctx.fillRect(canvas.width / 22 * 1, canvas.height / 22 * 1,
					 canvas.width / 22 * 4, canvas.height / 22 * 2);
		ctx.fillRect(canvas.width / 22 * 1, canvas.height / 22 * 4,
					 canvas.width / 22 * 4, canvas.height / 22 * 2);
		ctx.fillRect(canvas.width / 22 * 1, canvas.height / 22 * 7,
					 canvas.width / 22 * 4, canvas.height / 22 * 2);

		ctx.globalAlpha = 1;
		ctx.textBaseline = "bottom";
		ctx.textAlign = "center";
		ctx.fillStyle = "white";
		ctx.font = ((canvas.height / 24) +
					"px monospace, Monaco, 'Lucida Console'");
		ctx.fillText("NEXT", canvas.width / 22 * 19, canvas.height / 22 * 2);

		ctx.textAlign = "left";
		ctx.fillText("LINES", canvas.width / 22, canvas.height / 22 * 2);
		ctx.fillText(pad(lines), canvas.width / 22, canvas.height / 22 * 3);

		ctx.fillText("LPM", canvas.width / 22, canvas.height / 22 * 5);
		ctx.fillText(pad(lpm), canvas.width / 22, canvas.height / 22 * 6);

		ctx.fillText("MAX LPM", canvas.width / 22, canvas.height / 22 * 8);
		ctx.fillText(pad(max), canvas.width / 22, canvas.height / 22 * 9);

		ctx.textAlign = "center";
		for(x = 0; x < 10; ++x) {
			ctx.fillText(labels[x],
						 canvas.width / 22 * (6.5 + x), canvas.height / 22);
			ctx.fillText(labels[x],
						 canvas.width / 22 * (6.5 + x), canvas.height);
		}

		ctx.textAlign = "center";
		if(run) {
			//grid
			//ctx.globalAlpha = 0.8;
			for(y = 0; y < 20; ++y) {
				for(x = 0; x < 10; ++x) {
					if(grid[y][x]) {
						draw_block(x, y, grid[y][x] - 1);
					} else {
						draw_empty(x, y);
					}
				}
			}
			//ctx.globalAlpha = 1;

			//active tetrad
			draw_tetrad();

			//next
			draw_next();

			tick();

			if(self.practice) {
				ctx.fillText("PRACTICE", canvas.width / 2, canvas.height / 2);
			}
		} else {
			ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
		}
	}

	function load(cb) {
		var load_image = function(src) {
			var img = document.createElement("img");
			img.src = src;
			img.addEventListener("load", function(e) {
				IMG[src] = img;
				if(loaded_all() && cb) {
					cb();
				}
			}, false);
		};
		var loaded_all = function() {
			var all = true;
			Object.keys(IMG).every(function(key) {
				if(!IMG[key]) {
					all = false;
				}
				return true;
			});
			return all;
		};
		Object.keys(IMG).every(function(key) {
			load_image(key);
			return true;
		});
	}

	function init() {
		GPX.width = 128 * 9; // 0-6 colors, 7 trans, 8 empty/space
		GPX.height = 128 * 2; // 0 block/empty, 1 pivot/space
		var i = 0;
		for(i = 0; i < 7; ++i) {
			GPXctx.fillStyle = COLOR[i];
			GPXctx.fillRect(128 * i, 0, 128, 128 * 2);
		}
		load(function() {
			var i = 0;
			for(i = 0; i < 8; ++i) {
				GPXctx.drawImage(IMG["img/block.png"], 0, 0, 128, 128,
								 i * 128, 0, 128, 128);
				GPXctx.drawImage(IMG["img/pivot.png"], 0, 0, 128, 128,
								 i * 128, 128, 128, 128);
			}
			GPXctx.drawImage(IMG["img/empty.png"], 0, 0, 128, 128,
							 8 * 128, 0, 128, 128);
			GPXctx.drawImage(IMG["img/space.png"], 0, 0, 128, 128,
							 8 * 128, 128, 128, 128);
		});
	}

	// init
	init();
	reset();

	window.addEventListener("resize", resize, false);
	document.addEventListener("keydown", keydown, false);
	document.addEventListener("keyup", keyup, false);
}