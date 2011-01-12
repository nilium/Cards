/** simple assert **/
function AssertFailedException(message) {
	this._msg = message;
	return this;
}
AssertFailedException.prototype.tostring = function() {return this._msg;}

function assert() {
	var message = arguments[arguments.length - 1];
	
	for (var index = 0; index < arguments.length - 1; ++index) {
		if (!arguments[index]) {
			throw new AssertFailedException(message);
		}
	}
}

/** argument checking code **/
function notEqualsCheck(to) {
	return function(value) {
		return value != to;
	};
}

function equalsCheck(to) {
	return function(value) {
		return (value == to);
	};
}

function isNumberCheck(value) {
	return (typeof value == 'number');
}

function isBooleanCheck(value) {
	return (typeof value == 'boolean');
}

function isObjectCheck(value) {
	return (typeof value == 'object');
}

function isFunctionCheck(value) {
	return (typeof value == 'function');
}

// defaults to left and right being inclusive.
// if either left or right is not supplied, it is assumed
// there is no bound on that side.
function isInRangeCheck(left, right, leftInclusive, rightInclusive) {
	if (leftInclusive == undefined) {
		leftInclusive = true;
	}
	if (rightInclusive == undefined) {
		rightInclusive = true;
	}
	
	return function(value) {
		if (left != undefined) {
			if (   ( leftInclusive && value <  left)
				|| (!leftInclusive && value <= left) ) {
				return false;
			}
		}
		
		if (right != undefined) {
			if (   ( rightInclusive && right <  value)
				|| (!rightInclusive && right <= value) ) {
				return false;
			}
		}
		
		return true;
	};
}

function checkValue(value) {
	if (arguments.length <= 1) {
		return undefined;
	}
	
	for (var check = 1; check < arguments.length; ++check) {
		if ( !arguments[check](value) ) {
			return false;
		}
	}
	
	return true;
}
