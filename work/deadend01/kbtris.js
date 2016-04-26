KBTRIS = {
	SHOWNEXT: 5,
	TETRAD: ['o', 'j', 's', 'z', 'i', 'l', 't'],
	run: false,
	grid: [],
	next: [],
	tetrad: {
		shape: null,
		x: 0,
		y: 0
	},
	keys: {},
	labels: [],
	elm: {
		display: null,
		controls: null,
		grid: null,
		next: null
	},


	parse_controls: function parse_controls() {
		var rows = [ "flip", "ccw", "move", "cw" ]
		var col = 0;
		var input = null;
		KBTRIS.keys = {};
		KBTRIS.labels = [];
		rows.every(function(row) {
			for(col = 0; col < 10; ++col) {
				if((input = KBTRIS.elm.controls.querySelector("#" +row +col))) {
					KBTRIS.keys[input.value] = {
						col: col,
						rot: row
					}
					if(row === "move") {
						KBTRIS.labels[col] = input.value;
					}
				}
			}
			return true;
		});
	},

	build_display: function build_display() {
		var i = 0;
		var j = 0;
		var table = null;
		var tbody = null;
		var tr = null;
		var td = null;
		var img = null;

		while(KBTRIS.elm.display.firstChild) {
			KBTRIS.elm.display.removeChild(KBTRIS.elm.display.firstChild);
		}

		// main play area
		table = document.createElement("table");
		tbody = document.createElement("tbody");
		tr = document.createElement("tr");
		for(i = 0; i < 10; ++i) {
			td = document.createElement("th");
			td.scope = "col";
			td.innerHTML = KBTRIS.labels[i];
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
		for(j = 0; j < 20; ++j) {
			tr = document.createElement("tr");
			for(i = 0; i < 10; ++i) {
				td = document.createElement("td");
				img = document.createElement("img");
				img.src = "img/space.png";
				td.appendChild(img);
				tr.appendChild(td);
				KBTRIS.grid[j][i].cell = td;
			}
			tbody.appendChild(tr);
		}
		tr = document.createElement("tr");
		for(i = 0; i < 10; ++i) {
			td = document.createElement("th");
			td.scope = "col";
			td.innerHTML = KBTRIS.labels[i];
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
		table.appendChild(tbody);
		KBTRIS.elm.display.appendChild(table);
		KBTRIS.elm.grid = table;

		// next-tetrads queue
		table = document.createElement("table");
		tbody = document.createElement("tbody");
		tr = document.createElement("tr");
		td = document.createElement("th");
		td.colSpan = 4;
		td.innerHTML = "NEXT";
		tr.appendChild(td);
		tbody.appendChild(tr);
		for(j = 0; j < 4 * KBTRIS.SHOWNEXT; ++j) {
			tr = document.createElement("tr");
			for(i = 0; i < 4; ++i) {
				td = document.createElement("td");
				img = document.createElement("img");
				img.src = "img/empty.png";
				td.appendChild(img);
				tr.appendChild(td);
				KBTRIS.grid[j][i].cell = td;
			}
			tbody.appendChild(tr);
		}
		tr = document.createElement("tr");
		tbody.appendChild(tr);
		table.appendChild(tbody);
		KBTRIS.elm.display.appendChild(table);
		KBTRIS.elm.next = table;
	},

	get_cell: function get_cell(table, x, y) {
		if(x < 0 || x > 9 || y < 0 || y > 19) {
			return null;
		}
		var rows = table.querySelectorAll("tr");
		if(y + 1 > rows.length) {
			return null;
		}
		var cells = rows.item(y + 1).querySelectorAll("td");
		if(x > cells.length) {
			return null;
		}
		return cells.item(x);
	},

	build_tetrad: function build_piece(shape) {
		var piece = null;
		var color = null;
		switch(KBTRIS.TETRAD[shape]) {
		case 'o':
			piece = [{x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}];
			color = "blue";
			break;
		case 'j':
			piece = [{x: 1, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
			color = "gold";
			break;
		case 's':
			piece = [{x: 0, y: 1}, {x: -1, y: 1}, {x: 1, y: 0}];
			color = "orange";
			break;
		case 'z':
			piece = [{x: 1, y: 1}, {x: 0, y: 1}, {x: -1, y: 0}];
			color = "darkturquoise";
			break;
		case 'i':
			piece = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}];
			color = "red";
			break;
		case 'l':
			piece = [{x: -1, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
			color = "fuchsia";
			break;
		case 't':
			piece = [{x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
			color = "limegreen";
		default:
			break;
		}
		return {
			piece: piece,
			color: color,
			x: 4,
			y: 0
		};
	},

	seek_down: function seek_down(tetrad) {
		var i = 0;
		var j = 0;
		var quit = false;
		for(i = tetrad.y + 1; i < 20; ++i) {
			if((cell = KBTRIS.get_cell(KBTRIS.elm.grid,
									   tetrad.x, tetrad.y + i))) {
				if(cell.classList.contains("stack")) {
					break;
				}
			} else {
				break;
			}
			for(j = 0; j < 3; ++j) {
				if((cell = KBTRIS.get_cell(KBTRIS.elm.grid,
										   tetrad.x + tetrad.piece[j].x,
										   tetrad.y + tetrad.piece[j].y + i))) {
					if(cell.classList.contains("stack")) {
						quit = true;
					}
				} else {
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
	},

	game_over: function game_over() {
		KBTRIS.run = false;
		alert("GAME OVER");
		KBTRIS.reset();
	},

	land_piece: function land_piece() {
		var tetrad = KBTRIS.tetrad;
		var down = KBTRIS.seek_down(tetrad);
		var cell = null;
		var i = 0;
		if(!down) {
			KBTRIS.game_over();
			return;
		}
		KBTRIS.draw_tetrad(undefined, null, null, null, true);
		KBTRIS.tetrad.y = down;
		KBTRIS.draw_tetrad();
		if((cell = KBTRIS.get_cell(KBTRIS.elm.grid, tetrad.x, tetrad.y))) {
			cell.firstChild.src = "img/block.png";
			cell.classList.add("stack");
		}
		for(i = 0; i < 3; ++i) {
			if((cell = KBTRIS.get_cell(KBTRIS.elm.grid,
									   tetrad.x + tetrad.piece[i].x,
									   tetrad.y + tetrad.piece[i].y))) {
				cell.classList.add("stack");
			}
		}
	},

	draw_tetrad: function draw_tetrad(shape, table, x, y, clear, shadow) {
		var i = 0;
		var cell = null;
		var tetrad = null;
		var down = null;
		if(shape === undefined) {
			tetrad = KBTRIS.tetrad;
			table = KBTRIS.elm.grid;
			x = tetrad.x;
			y = shadow ? y : tetrad.y;
			if(!shadow && (down = KBTRIS.seek_down(tetrad))) {
				console.log(down);
				KBTRIS.draw_tetrad(undefined, table, x, down, clear, true);
			}
		} else {
			tetrad = KBTRIS.build_tetrad(shape);
		}
		var piece = tetrad.piece;
		var color = clear ? null : (shadow ? "#333" : tetrad.color);
		if((cell = KBTRIS.get_cell(table, x, y))) {
			cell.style.backgroundColor = clear ? null : color;
			cell.firstChild.src = clear ? "img/space.png" : "img/pivot.png";
		}
		for(i = 0; i < 3; ++i) {
			if((cell = KBTRIS.get_cell(table, x+ piece[i].x, y+ piece[i].y))) {
				cell.style.backgroundColor = clear ? null : color;
				cell.firstChild.src = clear ? "img/space.png" : "img/block.png";
			}
		}
	},

	draw_next: function draw_next() {
		var i = 0;
		var elms = KBTRIS.elm.next.querySelectorAll("img");
		for(i = 0; i < elms.length; ++i) {
			elms.item(i).src = "img/empty.png";
		}
		elms = KBTRIS.elm.next.querySelectorAll("td");
		for(i = 0; i < elms.length; ++i) {
			elms.item(i).style.backgroundColor = null;
		}
		for(i = 0; i < KBTRIS.SHOWNEXT; ++i) {
			KBTRIS.draw_tetrad(KBTRIS.next[i], KBTRIS.elm.next, 1, (i * 4) + 1);
		}
	},

	next_piece: function next_piece() {
		KBTRIS.tetrad = KBTRIS.build_tetrad(KBTRIS.next.shift());
		KBTRIS.next.push(Math.floor(Math.random() * 7));
		KBTRIS.draw_next();
		KBTRIS.draw_tetrad();
		if(!KBTRIS.move_piece(KBTRIS.tetrad.x)) {
			game_over();
			return;
		}
	},

	move_piece: function move_piece(col) {
		var i = 0;
		var block = null;
		var cell = null;
		if((cell = KBTRIS.get_cell(KBTRIS.elm.grid, col, KBTRIS.tetrad.y))) {
			if(cell.classList.contains("stack")) {
				return false;
			}
		} else {
			return false;
		}
		for(i = 0; i < 3; ++i) {
			block = KBTRIS.tetrad.piece[i];
			if((cell = KBTRIS.get_cell(KBTRIS.elm.grid, col + block.x,
									   KBTRIS.tetrad.y +block.y))) {
				if(cell.classList.contains("stack")) {
					return false;
				}
			} else {
				return false;
			}
		}
		KBTRIS.draw_tetrad(undefined, null, null, null, true);
		KBTRIS.tetrad.x = col;
		KBTRIS.draw_tetrad();
		return true;
	},

	keydown: function keydown(e) {
		var cmd = null;
		if(e.key && (cmd = KBTRIS.keys[e.key])) {
			if(!KBTRIS.move_piece(cmd.col)) {
				if(cmd.col < 1) {
					KBTRIS.move_piece(cmd.col + 1);
				} else if(cmd.col > 7) {
					if(!KBTRIS.move_piece(cmd.col - 1)) {
						KBTRIS.move_piece(cmd.col - 2);
					}
				}
			}
		}
	},
	keyup: function keydown(e) {
		if(!KBTRIS.run) {
			return;
		}
		if(e.key === " ") {
			KBTRIS.land_piece();
			KBTRIS.next_piece();
		}
	},

	reset: function reset() {
		KBTRIS.grid = [];
		var row = null;
		var i = 0;
		var j = 0;
		for(j = 0; j < 20; ++j) {
			row = [];
			for(i = 0; i < 10; ++i) {
				row.push({});
			}
			KBTRIS.grid.push(row);
		}
		for(i = 0; i < KBTRIS.SHOWNEXT; ++i) {
			KBTRIS.next[i] = Math.floor(Math.random() * 7);
		}

		KBTRIS.build_display();

		KBTRIS.draw_next();
		KBTRIS.next_piece();
		KBTRIS.run = true;
	},

	init: function init(display, controls) {
		KBTRIS.elm.display = display;
		KBTRIS.elm.controls = controls;
		KBTRIS.parse_controls();

		KBTRIS.reset();
	}
};

document.addEventListener("keydown", KBTRIS.keydown);
document.addEventListener("keyup", KBTRIS.keyup);
