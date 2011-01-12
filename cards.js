var RULES={
	name: 'Klondike',
	
	stackValidator: function(below, above) {
		return (
			below.getNumber() == (above.getNumber() + 1)
			&& below.isRed() != above.isRed()
		);
	}
}

/**
	NDeck is a simple container for a deck of variable size (52 by default)
**/

function NDeck(size) {
	if (size == undefined) {
		size = 52;
	}
	
	assert(
		checkValue(size, isNumberCheck, isInRangeCheck(0, undefined, false)),
		"Size out of range"
	);
	
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
	{
		var body = NCard.cardTemplate.body.clone();
		this.divs = {
			body: body,
			card: body.children('.card'),
			front: NCard.cardTemplate.front.clone(),
			back: NCard.cardTemplate.back.clone()
		};
	}
	
	// default to showing the back
	this.divs.card.prepend(this.divs.back);
	
	this._cardIndex = cardIndex;				// the index of the card [0,51]
	this._suit = Math.floor(cardIndex / 13);	// the card suit, [0,3], e.g., spade, club, heart, diamond
	this._red = this._suit > 1;					// whether or not the suit is red
	this._number = cardIndex % 13;				// the card's number in the suit, [0..12] going ace, 2, 3, 4, .., 10, jack, queen, king
	this._facing = false;						// whether or not the card front is visible
	this._enabled = false;						// whether or not the card is enabled (disables event handling)
	
	// yay, circular references
	// keeping this ref because the event handlers won't have
	// access to the instance of the card as a closure variable
	this.divs.body.data('card', this);
	
	return this;
}

NCard.TITLES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

NCard.cardTemplate = {
	body: $('<div class="cardContainer flipped"><div class="card"></div></div>'),
	front: $('<div class="front"><div class="number topLeft"></div><div class="center"></div><div class="number botRight"></div></div>'),
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
	return this.divs.body;
};


NCard.prototype.enabled = function(enable) {
	if (enabled == undefined) {
		return this._enabled;
	}
	
	assert(
		checkValue(enable, isBooleanCheck),
		"Argument is not a boolean"
	);
	
	this._enabled = enable;
	if (enable) {
		
	}
	
	return this;
}

NCard.prototype.canBePickedUp = function() {
	if (!this._enabled) {
		return false;
	}
	
	var card_jq = this.getCardBody();
	var parent = card_jq.closest('.cardContainer, .repository, .column, #deck, #spawn');
	
	if (parent.is('.repository')) {
		
	}
}

NCard.prototype.isStack = function() {
	var card_jq = this.getCardBody();
	
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
	assert(
		checkValue(validator, isFunctionCheck),
		"Validator is not a function"
	);
	
	if (!this.isStack()) {
		return true;
	}
	
	var below = this.getCardBody();
	var above = below.children('.cardContainer');
	while (below.is('.cardContainer') && above.is('.cardContainer')) {
		var valid = validator(below, above);
		assert(
			checkValue(valid, isBooleanCheck),
			"Validator returned non-boolean value"
		);
		
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
	
	assert(
		checkValue(facing, isBooleanCheck),
		"Argument is not a boolean"
	);
	
	var body = this.divs.body;
	
	var changed = (facing != this._facing);
	if (changed) {
		var detach, attach;
		
		this._facing = facing;
		
		if (facing) {
			detach = this.divs.back;
			attach = this.divs.front;
			body.removeClass('flipped');
		} else {
			attach = this.divs.back;
			detach = this.divs.front;
			body.addClass('flipped');
		}
		
		detach.detach();
		attach.prependTo(this.divs.card);
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

function loadDeck(deck) {
	var deckIndex = 0;
	
	$('.column').each(function(index, columnDOM) {
		var column = $(columnDOM);
		
		var top = column;
		for (var count = 0; count <= index; ++count, ++deckIndex) {
			var card = new NCard(deck.getCardAtIndex(deckIndex));
			var card_jq = card.getCardBody();
			
			top = card_jq.appendTo(top);
			
			if (count == index) {
				card.facing(true);
			}
		}
	});
}

// document

$(document).ready(function() {
	sizeColumns();
	$(window).resize(sizeColumns);
	
	var deck = new NDeck();
	
	loadDeck(deck);
});
