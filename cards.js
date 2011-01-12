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
	
	return this;
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
	
	this.divs.front.find('.number').html(this.getTitle());
	this.divs.front.addClass('c'+this.getTitle())
					.addClass('s'+this._suit);
	
	if (this._red) {
		this.divs.front.addClass('red');
	}
	
	return this;
}

NCard.TITLES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

NCard.cardTemplate = {
	body: $('<div class="cardContainer flipped"><div class="card"></div></div>'),
	front: $('<div class="front"><div class="number topLeft"></div><div class="center"></div><div class="number botRight"></div></div>'),
	back: $('<div class="back"></div>'),
};

NCard.eventHandlers = {
	card_mousedown_back: function(event) {
		var card_jq = $(this);
		var card = card_jq.data('card');
		
		assert(
			checkValue(card, isObjectCheck),
			"Card not selected"
		);
		
		card.facing(true);
	},
	
	card_mousedown_front: function(event) {		
		var card_jq = $(this);
		var card = card_jq.data('card');
		
		event.stopPropagation();
		
		if (!card.canBePickedUp()) {
			return false;
		}
		
		NCard._hookupDragging(card);
		return true;
	},
	
	table_mouseup: function(event) {
		console.log('mouse released');
		
		$(this).unbind('mouseup')
			.unbind('mousemove');
	},
	
	table_mousemove: function(event) {
		var data = event.data;
		var body = data.cardBody;
		
		body.offset({
			left: event.pageX + data.offset.left,
			top:  event.pageY + data.offset.top
		});
	}
}

NCard._hookupDragging = function(forCard) {
	var body = forCard.divs.body;
	var table = $('#table');
	
	var offset = body.offset();
	
	var data = {
		card: forCard,
		anchor: body.parent(),
		cardBody: body,
		anchor: body.parent(),
		offset: {
			left: offset.left - event.pageX,
			top: offset.top - event.pageY
		}
	};
	
	body.detach()
		.appendTo(table)
		.offset(offset);
	
	table.bind('mousemove', data, NCard.eventHandlers.table_mousemove)
		.bind('mouseup', data, NCard.eventHandlers.table_mouseup);
}


// methods
NCard.prototype.getCardBody = function() {
	return this.divs.body;
};

NCard.prototype.getNumber = function() {
	return this._number;
};

NCard.prototype.getTitle = function() {
	return NCard.TITLES[this.getNumber()];
};

NCard.prototype.getSuit = function() {
	return this._suit;
};

NCard.prototype.isRed = function() {
	return this._red;
};

NCard.prototype.enabled = function(enable) {
	if (enable == undefined) {
		return this._enabled;
	}
	
	assert(
		checkValue(enable, isBooleanCheck),
		"Argument is not a boolean"
	);
	
	this._enabled = enable;
	this._checkCallback();
	
	return this;
}

// get the card above this card
NCard.prototype.getNextCard = function() {
	var card_jq = this.divs.body.children('.cardContainer');
	if (card_jq.length == 1) {
		return card_jq.data('card');
	}
	
	return null;
};

// get the card below this card
NCard.prototype.getPreviousCard = function() {
	var card_jq = this.divs.body.parent('.cardContainer');
	if (card_jq.length == 1) {
		return card_jq.data('card');
	}
	
	return null;
};

NCard.prototype.canBePickedUp = function() {
	if (!this._enabled) {
		return false;
	}
	
	var card_jq = this.getCardBody();
	var root = card_jq.closest('.repository, .column, #deck, #spawn');
	
	if (root.is('.repository, #spawn') && this.next() != null) {
		return false;
	}
	
	if (this.isStack() && !(root.is('.column')
		&& this.validateStack(RULES.stackValidator))) {
		return false;
	}
	
	return true;
}

NCard.prototype.isStack = function() {
	var card_jq = this.getCardBody();
	
	return (card_jq.children('.cardContainer').length > 0);
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
	
	var below = this;
	var above = below.getNextCard();
	while (below && above) {
		var valid = validator(below, above);
		assert(
			checkValue(valid, isBooleanCheck),
			"Validator returned non-boolean value"
		);
		
		if (!valid) {
			return false;
		}
		
		below = above;
		above = below.getNextCard();
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
		
		this._checkCallback();
	}
	
	return this;
}

NCard.prototype._checkCallback = function() {
	if (this._enabled) {
		this.divs.body.unbind('mousedown');
		if (this.facing()) {
			this.divs.body.bind('mousedown', NCard.eventHandlers.card_mousedown_front);
		} else {
			this.divs.body.bind('mousedown', NCard.eventHandlers.card_mousedown_back);
		}
	} else {
		this.divs.body.unbind('mousedown');
	}
};



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
				card.facing(true)
					.enabled(true);
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
