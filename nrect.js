// BEGIN NRect

function NRect(left, top, width, height) {
	// el larger-than-needed constructor
	if (arguments.length == 1 && typeof left == 'object') {
		var obj = arguments[0];
		if (obj.constructor == this.constructor) {
			// copy
			this._left = obj.left();
			this._top = obj.top();
			this._width = obj.width();
			this._height = obj.height();
		} else {
			// assume offset
			this._left = obj.left;
			this._top = obj.top;
			this._width = 0;
			this._height = 0;
		}
	} else if (arguments.length == 2
			&& typeof left == 'object'
			&& typeof top == 'object') {
		// assume offset and size
		var obj = arguments[0];
		this._left = obj.left;
		this._top = obj.top;
		obj = arguments[1];
		this._width = obj.width;
		this._height = obj.height;
	} else if (arguments.length == 3
				&& typeof left == 'object'
				&& typeof top == 'number'
				&& typeof width == 'number') {
		// assume object and numbers for size
		var obj = arguments[0];
		this._left = obj.left;
		this._top = obj.top;
		this._width = arguments[1];
		this._height = arguments[2];
	} else if (arguments.length == 4
				&& typeof left == 'number'
				&& typeof top == 'number'
				&& typeof width == 'number'
				&& typeof height == 'number') {
		// assume all numbers
		this._left = left;
		this._top = top;
		this._width = width;
		this._height = height;
	} else {
		// identity
		this._left = 0;
		this._top = 0;
		this._width = 0;
		this._height = 0;
	}
	return this;
}

NRect.prototype.area = function() {
	return (this._width * this._height);
}

NRect.prototype.left = function(dimen) {
	if (dimen == undefined) {
		return this._left;
	} else if (typeof dimen == 'number') {
		this._left = dimen;
	} else {
		console.log('Non-number supplied for left');
	}
	
	return this;
}

NRect.prototype.right = function(dimen) {
	if (dimen == undefined) {
		return this._left + this._width;
	} else if (typeof dimen == 'number') {
		this._width = dimen - this._left;
	} else {
		console.log('Non-number supplied for right');
	}
	
	return this;
}

NRect.prototype.top = function(dimen) {
	if (dimen == undefined) {
		return this._top;
	} else if (typeof dimen == 'number') {
		this._top = dimen;
	} else {
		console.log('Non-number supplied for top');
	}
	
	return this;
}

NRect.prototype.bottom = function(dimen) {
	if (dimen == undefined) {
		return this._top + this._height;
	} else if (typeof dimen == 'number') {
		this._height = dimen - this._top;
	} else {
		console.log('Non-number supplied for bottom');
	}
	
	return this;
}

NRect.prototype.width = function(dimen) {
	if (dimen == undefined) {
		return this._width;
	} else if (typeof dimen == 'number') {
		this._width = dimen;
	} else {
		console.log('Non-number supplied for width');
	}
	
	return this;
}

NRect.prototype.height = function(dimen) {
	if (dimen == undefined) {
		return this._height;
	} else if (typeof dimen == 'number') {
		this._height = dimen;
	} else {
		console.log('Non-number supplied for height');
	}
	
	return this;
}

NRect.prototype.intersects = function(other) {
	if (other == undefined
		||typeof other != 'object'
		|| other.constructor != this.constructor) {
		return undefined;
	}
	
	return !(
		this.right() < other.left()
		|| this.bottom() < other.top()
		|| other.right() < this.left()
		|| other.bottom() < this.top()
	);
}

NRect.prototype.intersection = function(other) {
	if (other == undefined
		||typeof other != 'object'
		|| other.constructor != this.constructor) {
		return undefined;
	}
	
	// note: if no intersection, the resulting width and height will be zero
	var left, top, width, height;
	left = Math.max(this._left, other.left());
	top = Math.max(this._top, other.top());
	width = Math.max(Math.min(this.right(), other.right()) - left, 0);
	height = Math.max(Math.min(this.bottom(), other.bottom()) - top, 0);
	return new NRect(left, top, width, height);
}

NRect.prototype.contains = function(x, y) {
	// if not a rect, assume it's a point
	if (arguments.length == 1 && typeof x == 'object' && x.constructor == this.constructor) {
		var other = arguments[0];
		return (
			this._left <= other.left()
			&& this._top <= other.top()
			&& other.right() <= this.right()
			&& other.bottom() <= this.bottom()
		);
	} else if (arguments.length == 2 && typeof x == 'number' && typeof y == 'number') {
		return (
			this._left <= x
			&& this._top <= y
			&& x <= this.right()
			&& y <= this.bottom()
		);
	}
	
	return undefined;
}

NRect.prototype.clone = function() {
	return new NRect(this);
}

// END NRect