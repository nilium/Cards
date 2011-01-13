var RULES={
	// name of the game type
	name: 'Klondike',
	
	// appends elements to the table, sets up the deck, and lays out
	// the cards
	setupTable: function(table) {
		// TODO: move index.html table setup into here, build columns
		// & deck in this method.
	},
	
	/**
		Determines if two cards follow one another in a given stack
		to decide whether or not the stack is valid and is therefore
		playable/can be lifted off the table.
		For example, in solitaire, the rule would be that each card
		above must be the number below it minus one, and that each
		card alternates between red and black, as in this implementation.
		
		Must return either true or false.
	**/
	stackValidator: function(below, above) {
		return (
			below.getNumber() == (above.getNumber() + 1)
			&& below.isRed() != above.isRed()
		);
	},
	
	/**
		Finds and returns all possible anchor points (jquery objects)
		for the given card.  In solitaire, this would be either one
		of the wells or a column that can take the card at the top
		of its stack.
		
		RETURN
			Should return a jQuery object with however many elements
			there are that can act as anchors for the card to be
			dropped onto.
	**/
	anchorsForCard: function(card) {
		var topMapping = function(index, domElem) {
			var top = $(this).find('.cardContainer').last();
			
			if (top.length == 1) {
				return top.get();
			}
			
			return this;
		};
		
		var num = card.getNumber();
		var suit = card.getSuit();
		var red = card.isRed();
		
		var columns = $('.column');
		
		var results = columns.map(topMapping).filter(
			function() {
				var anchor = $(this);
				if (anchor.is('.column')) {
					return num == 12;
				}
				
				var anchorCard = anchor.data('card');
				if (anchorCard.getNumber() == num + 1 && anchorCard.isRed() != red) {
					return true;
				}
				
				return false;
			}
		);
		
		if (!card.isStack()) {
			var repos = $('.repository');
			repos = repos.map(topMapping).filter(
				function() {
					var anchor = $(this);
					
					if (anchor.is('.repository')) {
						return num == 0;
					}
					
					var anchorCard = anchor.data('card');
					if (anchorCard.getNumber() == num - 1 && anchorCard.getSuit() == suit) {
						return true;
					}
					
					return false;
				}
			);
			results = results.add(repos);
		}
		
		return results;
	},
};

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
	
	// set up CSS for the card
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
		
		event.stopPropagation();
		
		if (card.getNextCard() != null) {
			return false;
		}
		
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
		
		var card = event.data.card;
		var body = event.data.cardBody;
		
		var possibleAnchors = RULES.anchorsForCard(event.data.card);
		anchor = card._pickIdealAnchor(possibleAnchors, event.data.anchor);
		
		if (anchor == event.data.anchor && event.data.prevCard != null) {
			card._anchorTo(anchor,
				function() {
					event.data.prevCard.enabled(true);
					}
				);
		} else {
			card._anchorTo(anchor);
			if (event.data.prevCard != null) {
				// enable the last card immediately
				event.data.prevCard.enabled(true);
			}
		}
		
		event.stopPropagation();
	},
	
	table_mousemove: function(event) {
		var data = event.data;
		var body = data.cardBody;
		
		body.offset({
			left: event.pageX + data.offset.left,
			top:  event.pageY + data.offset.top
		});
		
		event.stopPropagation();
	}
}

NCard._hookupDragging = function(forCard) {
	var body = forCard.divs.body;
	body.unbind('mousedown', NCard.eventHandlers.card_mousedown_front);
	
	var table = $('#table');
	
	var offset = body.offset();
	
	var data = {
		card: forCard,
		prevCard: forCard.getPreviousCard(),
		cardBody: body,
		anchor: body.parent(),
		offset: {
			left: offset.left - event.pageX,
			top: offset.top - event.pageY
		}
	};
	
	if (data.prevCard != null) {
		data.prevCard.enabled(false);
	}
	
	body.detach()
		.appendTo(table)
		.offset(offset);
	
	table.bind('mousemove', data, NCard.eventHandlers.table_mousemove)
		.bind('mouseup', data, NCard.eventHandlers.table_mouseup);
}

// tweaks the offset for a given anchor - this is sort of a hack
// that depends on knowledge of how the cards are laid out in
// specific areas according to the CSS, and it could probably be
// done better
NCard._offsetForAnchor = function(anchor) {
	var offset = anchor.offset();
	var root = anchor.closest('.repository, .column, #deck, #spawn');
	
	if (root.is('#spawn')) {
		offset.left += 32;
	} else if (root.is('.column') && anchor.is('.cardContainer')) {
		var card = anchor.data('card');
		if (card.facing()) {
			offset.top += 18;
		} else {
			offset.top += 9;
		}
	}
	
	return offset;
};

NCard._rectForElem = function(elem) {
	return new NRect(elem.offset(), elem.width(), elem.height());
}


// methods

// iterates over a number of anchors (including its original anchor)
// and picks the one most ideal to be dropped on, or returns null if
// none work
NCard.prototype._pickIdealAnchor = function(anchors, _default) {
	if (_default == undefined) {
		_default = null;
	}
	
	var cardRect = NCard._rectForElem(this.divs.body);
	var rankingArea = 400;
	if (_default != null) {
		var defaultArea = NCard._rectForElem(_default).intersection(cardRect).area();
		rankingArea = Math.min(rankingArea, defaultArea);
	}
	var result = _default;
	
	anchors.each(function () {
		var anchor = $(this);
		var aRect = NCard._rectForElem(anchor);
		var area = aRect.intersection(cardRect).area();
		
		if (area > rankingArea) {
			rankingArea = area;
			result = anchor;
		}
	});
	
	return result;
}

// anchors a card to a specific element, where anchor is a jquery object,
// post is a function or null, and append is true to append and false to
// prepend the card to the element pointed to by the jquery object
// post takes no arguments, and is called once the animation to move the
// card into place has finished and the card has been re-anchored
//
// post = function() { ... }
NCard.prototype._anchorTo = function(anchor, post, append) {
	assert(
		checkValue(anchor, isObjectCheck),
		"anchor not provided"
	);
	
	if (append == undefined) {
		append = true;
	} else {
		assert(
			checkValue(append, isBooleanCheck),
			"Argument 'append' is not a boolean"
		);
	}
	
	if (post == undefined) {
		post = null;
	} else if (post != null) {
		assert(
			checkValue(post, isFunctionCheck),
			"Argument 'post' is not a function"
		);
	}
	
	var body = this.divs.body;
	var oldOffset = body.offset();
	var newOffset = NCard._offsetForAnchor(anchor);
	
	if (!body.parent().is('#table')) {
		// if the card isn't already appended to the table, detach it
		// and move it to the table to fix z-ordering
		body.detach()
			.appendTo($('#table'));
	}
	
	body.offset(oldOffset)
		.unbind('mousedown')
		.animate(newOffset, 100,
			function() {
				body.detach();
				
				if (append) {
					body.appendTo(anchor);
				} else {
					body.prependTo(anchor);
				}
				
				body.css('left', 0)
					.css('top', 0)
					.bind('mousedown', NCard.eventHandlers.card_mousedown_front);
				
				if (post != null) {
					post();
				}
			}
		);
};


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
	this._checkEventHandlers();
	
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
	
	It's an arbitrary use of the word 'valid', but in this case it means
	that the stack or cards are playable - so, if you cannot play a certain
	stack, then it's invalid.  Again, arbitrary.
**/
NCard.prototype.validateStack = function(validator) {
	assert(
		checkValue(validator, isFunctionCheck),
		"Validator is not a function"
	);
	
	var below = this;
	var above = below.getNextCard();
	while (below && above) {
		if (!(below.enabled() && above.enabled())) {
			// stacks with disabled cards in them are
			// not considered valid stacks
			return false;
		}
		
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
		
		this._checkEventHandlers();
	}
	
	return this;
}

// determines if a method should have event handlers applied to it
// and applies them where necessary
NCard.prototype._checkEventHandlers = function() {
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
			
			card.enabled(true);
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
