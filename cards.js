/**
	NDeck is a simple container for a deck of variable size (52 by default)
**/

function NDeck(size) {
	if (size == undefined) {
		size = 52;
	}
	
	checkValue(size, isNumberCheck, isInRangeCheck(0, undefined, false))
	
	var cardIndices = new Array();
	for(var index = 0; index < size; ++index) {
		cardIndices[index] = index % 52;
	}
	
	this.indices = cardIndices;
	
	return this;
}

// methods
NDeck.prototype.shuffle = function() {
	var cards = this.indices;
	var sz = 100 * cards.length;
	
	var swap_left, swap_right, temp;
	
	for (var iter = 0; iter < 8192; ++iter) {
		swap_left  = Math.floor(Math.random() * sz) % 52;
		swap_right = Math.floor(Math.random() * sz) % 52;
		
		temp = cards[swap_left];
		
		cards[swap_left]  = cards[swap_right];
		cards[swap_right] = temp;
	}
}

NDeck.prototype.getCardAtIndex = function(index) {
	return this.indices[index];
}



/**
	NCard is a class that stores data about a given card in a deck of 52 cards.
	
	Card indices are assumed to be within the range of [0,51]
**/
function NCard(cardIndex) {
	this._body = NCard.cardTemplate.body.clone();
	this._face = NCard.cardTemplate.face.clone();
	this._back = NCard.cardTemplate.back.clone();
	
	// default to showing the back
	this._back.prependTo(this._body.children('.card'));
	
	this._cardIndex = cardIndex;				// the index of the card [0,51]
	this._suit = Math.floor(cardIndex / 13);	// the card suit, [0,3], e.g., spade, club, heart, diamond
	this._red = this._suit > 1;					// whether or not the suit is red
	this._number = cardIndex % 13;				// the card's number in the suit, [0..12] going ace, 2, 3, 4, .., 10, jack, queen, king
	this._facing = false;						// whether or not the card face is visible
	this._enabled = false;						// whether or not the card is enabled (disables event handling)
	
	// yay, circular references
	// keeping this ref because the event handlers won't have
	// access to the instance of the card as a closure variable
	this._body.data('card', this);
	
	return this;
}

NCard.TITLES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

NCard.cardTemplate = {
	body: $('<div class="cardContainer"><div class="card"></div></div>'),
	face: $('<div class="front"><div class="number topLeft"></div><div class="center"></div><div class="number botRight"></div></div>'),
	back: $('<div class="back"></div>'),
};

NCard.eventHandlers = {
	card_mousedown: function(event) {
		var card_jq = $(this);
		var card = card_jq.data('card');
		
		
	},
	
	table_mouseup: function(event) {
		
	},
	
	table_mousemove: function(event) {
		
	}
}

// methods
NCard.prototype.getCardBody = function() {
	return this._body;
};


NCard.prototype.enabled = function(enable) {
	if (enabled == undefined) {
		return this._enabled;
	}
	
	checkValue(enable, isBooleanCheck)
	
	this._enabled = enable;
	if (enable) {
		
	}
	
	return this;
}

NCard.prototype.canBePickedUp = function() {
	if (!this._enabled) {
		return false;
	}
	
	var card_jq = this._body;
	var parent = card_jq.closest('.cardContainer, .repository, .column, #deck, #spawn');
	
	if (parent.is('.repository')) {
		
	}
}

NCard.prototype.isStack = function() {
	var card_jq = this._body;
	
	if (card_jq.children('.cardContainer')) {
		
	}
}

/**
	Determines whether or not the card is a valid stack (i.e., can be picked up)
	
	validator = function(below, above)
	validator function must return either true or false
	If the below card is allowed to follow the above card in a stack,
	the validator must return true - if the card cannot follow, it
	must return false.
	
	If this card is not beneath other cards, then this method will return true;
**/
NCard.prototype.validateStack = function(validator) {
	checkValue(validator, isFunctionCheck);
	
	if (!this.isStack()) {
		return true;
	}
	
	var below = this._body;
	var above = below.children('.cardContainer');
	while (below.is('.cardContainer') && above.is('.cardContainer')) {
		var valid = validator(below, above);
		checkValue(valid, isBooleanCheck);
		
		if (!res) {
			return false;
		}
		
		below = above;
		above = below.children('.cardContainer');
	}
	
	return true;
}

NCard.prototype.facing = function(facing) {
	if (facing == undefined) {
		return this._facing;
	}
	
	checkValue(facing, isBooleanCheck);
	
	var changed = (facing == this._facing);
	if (changed) {
		this._facing = facing;
		
		var detach, attach;
		
		if (facing) {
			detach = this._back;
			attach = this._front;
		} else {
			attach = this._back;
			detach = this._front;
		}
		
		detach.detach();
		attach.prependTo(this._body.children('.card'));
	}
}


// layout functions
function sizeColumns() {
	var COLUMN_WIDTH=106;
	var colContainer = $('#columns');
	var columns = colContainer.children('.column');
	var width = Math.floor((colContainer.width() - (COLUMN_WIDTH * 7)) / 8);
	columns.each(function(index, column) {
		var col = $(column);
		var moveTo = {
			left: width * (index + 1) + index * COLUMN_WIDTH,
			top: 0
		};
		col.css('left', moveTo.left+'px')
			.css('top', '0px');
	});
}


// document

$(document).ready(function() {
	sizeColumns();
	$(window).resize(sizeColumns);
	
	var deck = new NDeck();
	
	var deckIndex = 0;
	
	$('.column').each(function(index, columnDOM) {
		var column = $(columnDOM);
		
		var top = column;
		for (var count = 0; count <= index; ++count, ++deckIndex) {
			var card = new NCard(deck.getCardAtIndex(deckIndex));
			var card_jq = card.getCardBody();
			
			top = card_jq.appendTo(top);
		}
	});
});
