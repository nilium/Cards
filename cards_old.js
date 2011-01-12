/****
	TODO: Delete this pile of crap once it's done being rewritten
****/

/*
// ye olde deck script
var prev = $('#waste>#spawn .cardContainer');
if (prev.length) {
	// TODO: recreate deck in background while wasting current deck
	prev.detach().each(function(index, elem) {
		if (wastedDeck == null) {
			wastedDeck = $(elem);
		} else {
			wastedDeck = $(elem).append(wastedDeck);
		}
	});
}
var attach = $('#waste>#spawn');
var above = null;
for (var count = 0; count < 3 && elem.parent('.cardContainer').length != 0; ++count) {
	above = elem.parent('.cardContainer');
	elem.detach().toggleClass('flipped').data('enabled', true).appendTo(attach);
	attach = elem;
	elem = above;
}
if (above.length == 1) {
	above.data('enabled', true);
}
*/

var CARD_Z_INDEX = 300;

var getCardTemplate = null;
getCardTemplate = function() {
	var cardTemplate = $('<div class="cardContainer"><div class="card"><div class="front"><div class="number topLeft"></div><div class="center"></div><div class="number botRight"></div></div><div class="back"></div></div></div>');
	cardTemplate.data('enabled', true);
	
	{
		var activeCard = null;
		var relativeCoords = {left:0, top:0};
		var table = $('#table');
		var wastedDeck = null;
		
		cardTemplate.mousedown(function(event) {
			// if (event.button != 1) {
			// 	return;
			// }
			
			var elem = $(this);
			
			if (activeCard != null || !elem.data('enabled')) {
				return;
			}
			
			if (elem.hasClass('flipped')) {
				if (elem.children('.cardContainer').length == 0) {
					elem.toggleClass('flipped');
					// REMOVED UNTIL GPU COMPOSITING IS ENABLED BY DEFAULT
					// IN ALL STABLE BUILDS OF CHROME
//					elem.addClass('flipAnimation');
//					setTimeout(function() {
//						elem.removeClass('flipAnimation');
//					}, 550);
				}
				event.stopPropagation();
				return;
			}
			
			var children = elem.find('.cardContainer');
			if (children.length != 0) {
				if (elem.closest('#waste').length != 0) {
					event.stopPropagation();
					return;
				}
				
				var valid = true;
				var last = elem;
				children.each(function(index, subcard) {
					subcard = $(subcard);
					if (subcard.data('red') == last.data('red') 
						|| subcard.data('number') != (last.data('number') - 1)) {
						valid = false;
						return false;
					}
					last = subcard;
				});
				
				if (valid == false) {
					event.stopPropagation();
					return;
				}
			}
			
			var offset = elem.offset();
			var cardRect = new NRect(offset, elem.width(), elem.height());
			var contains = cardRect.contains(event.pageX, event.pageY);
			if ( !contains ) {
				return;
			}
			
			activeCard = elem;
			activeCard.parent('.cardContainer').data('enabled', false);
			activeCard.data('lastPosition', activeCard.offset());
			activeCard.data('anchor', activeCard.parent());
			
			relativeCoords.left = (event.pageX - offset.left);
			relativeCoords.top = (event.pageY - offset.top);
			activeCard.toggleClass('selected');
			
			var z = parseInt(activeCard.css('z-index'));
			$('#table > .cardContainer').each(function (index, elem) {
				elem = $(elem);
				var cz = parseInt(elem.css('z-index'));
				if (z < cz) {
					elem.css('z-index', cz - 1);
				}
			});
			activeCard.css('z-index', CARD_Z_INDEX+51)
				.detach()
				.appendTo(table)
				.offset(offset);
			var children = activeCard.children('div.card');
			children.css('border-color', '#f00');
			
			event.stopPropagation();
		});
					
		table.mouseup(function(event) {
			if (activeCard == null) {
				return;
			}
			
			var card = activeCard;
			activeCard = null;
			
			var cardRect = new NRect(card.offset(), card.width(), card.height());
			var time = 200;
			var prevArea = 400;
			var anchor = card.data('anchor');
			var prevParent = anchor;
			var moveTo = card.data('lastPosition');
			var otherCards = $('#columns > .column, #repositories > .repository').map(
					function(index, elem) {
						elem = $(elem);
						var lastCard = elem.find('.cardContainer').last();
						if (lastCard.length != 0) {
							return lastCard;
						}
						return elem;
					}
				).not(card);
				
			otherCards.each(function(index, elem) {
					elem = $(elem);
					if (elem.length == 0) {
						return;
					}
					var offset = elem.offset();
					var rect = null;
					if (elem.hasClass('column')) {
						offset.left += 2;
						offset.top += 2;
						
						rect = new NRect(offset, card.width(), card.height());
					} else {
						rect = new NRect(offset, elem.width(), elem.height());
					}
					
					if ( rect.intersects(cardRect) ) {
						var area = rect.intersection(cardRect).area();
						if (area < prevArea) {
							return true;
						}
						
						if (elem.hasClass('repository')) {
							// EMPTY DEPOSIT RULES
							if (card.data('number') != 0) {
								return true;
							}
						} else if (elem.closest('.repository').length != 0) {
							// USED DEPOSIT RULES
							if (card.children('.cardContainer').length != 0) {
								return true;
							}
							
							if (card.data('number') != (elem.data('number') + 1)) {
								return true;
							}
							
							if (card.data('set') != elem.data('set')) {
								return true;
							}
						} else if ( (elem.hasClass('cardContainer') &&
							// COLUMN RULES
								(    elem.data('red') == card.data('red')
								     || card.data('number') != (elem.data('number') - 1) )
							 	)
							|| ( elem.hasClass('column') && card.data('number') != 12 )
							) {
							return true;
						}
						
						prevArea = area;
						anchor = elem;
						time = 100;
						moveTo.left = rect.left();
						moveTo.top = rect.top();
						
						if (anchor.hasClass('flipped')) {
							moveTo.top += 8;
						} else if (anchor.hasClass('cardContainer')) {
							moveTo.top += 18;
						}
					}
					
					return true;
				});
			
			moveTo.left = moveTo.left+'px';
			moveTo.top = moveTo.top+'px';
			
			card.offset({
					left:event.pageX - relativeCoords.left,
					top:event.pageY - relativeCoords.top
				})
				.toggleClass('selected');
			card.data('enabled', false)
				.animate(moveTo, time, 'swing', function() {
					card.detach()
						.css('left', 0)
						.css('top', 0)
						.appendTo(anchor)
						.data('enabled', true);
					if (prevParent.hasClass('cardContainer')) {
						prevParent.data('enabled', true);
					}
				})
				.children('div.card')
					.css('border-color', '#fff');
			
			event.stopPropagation();
		});
		
		var mouseMove = function(event) {
			if (activeCard == null) {
				event.stopPropagation();
				return;
			}
			
			activeCard.offset({left:event.pageX - relativeCoords.left, top:event.pageY - relativeCoords.top});
			event.stopPropagation();
		}
		table.mousemove(mouseMove);
		$("body").mousemove(mouseMove);
	}
	
	getCardTemplate = function() {
		return cardTemplate;
	}
	
	return cardTemplate;
}

function spawnCard(forCard, z) {
	var TITLES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
	
	var title = TITLES[forCard % 13];
	var set = Math.floor(forCard / 13);
	var isRed = (set%2 == 1);
	var number = forCard % 13;
	
	var copy = getCardTemplate().clone(true);
	
	copy.css('z-index', CARD_Z_INDEX+z);
	
	var card = copy.children('.card');
	var face = card.children('.front');
	var back = card.chidren('.back');
	
	if (set%2 == 1) {
		face.addClass('red');
	}
	
	face.children('.number').html(title);
	
	var data = {
		'set' : set,
		'red' : (set > 1),
		'number' : forCard % 13,
		'title' : title,
		'face' : face,
		'back' : back,
		'enabled' : false
	}
	
	return copy;
}

function loadDeck(cards) {
	var current = 0;
	$('#columns > .column').each(function(index, elem) {
		var container = $(elem);
		for (var count = 0; count < (index+1); ++count) {
			var card = spawnCard(cards[current], current);
			if (count != index) {
				// TEST CODE
				card.addClass('flipped');
			}
			
			container.append(card);
			container = card;
			current += 1
		}
	});
	var waste = $('#waste > #deck');
	for(; current < 52; ++current) {
		waste = spawnCard(cards[current], current).addClass('flipped').data('enabled', current==51).appendTo(waste);
	}
}

function createDeck() {
	var cards = new Array();
	for (var index = 0; index < 52; ++index) {
		cards[index] = index;
	}
	return cards;
}

function shuffleDeck(cards) {
	for (var iter = 0; iter < 8192; ++iter) {
		var a, b;
		a = Math.floor(Math.random()*1000)%52;
		b = Math.floor(Math.random()*1000)%52;
		var c = cards[a];
		cards[a] = cards[b];
		cards[b] = c;
	}
}

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

$(document).ready(function() {
	var supported = true;
	jQuery.each(jQuery.browser, function(br) {
		var version = jQuery.browser.version;
		version = version.substring(0, version.indexOf('.'));
		if (br=="msie" && parseInt(version) < 9) {
			supported = false;
		}
	});
	
	$('body').keypress(function(event) {
		return;
	});
	
	if (!supported) {
		$('#table').detach();
		$('body').append($('<p>Please use a better browser.  Chrome, Safari, or Firefox 4 are good choices.</p>'));
		return;
	}
	
	var table = $('#table');
	
	var cards = createDeck();
	// shuffle deck
	shuffleDeck(cards);
	
	// set up columns
	sizeColumns();
	
	$(window).resize(function() {
		sizeColumns();
	});
	
	loadDeck(cards);
});