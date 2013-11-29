(function(window, $) {
  'use strict';

  var sysCodeMap = {
    16: 'Shift', 17: 'Ctrl', 18: 'Alt'
  };
  var keyCodeMap = {
    8: 'Backspace', 9: 'Tab', 13: 'Return', 32: 'Space', 33: 'PageUp', 34: 'PageDown', 35: 'End', 36: 'Home',
    37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down', 43: '+', 45: 'Insert', 46: 'Delete',
    48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
    96: '0', 97: '1', 98: '2', 99: '3', 100: '4', 101: '5', 102: '6', 103: '7', 104: '8', 105: '9',
    65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M',
    78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z',
    59: ';', 61: '=', 106: '*', 107: '+', 109: '-', 110: '.', 111: '/', 186: ';', 187: '=',
    188: ',', 189: '-', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: '\''
  };

  var _renderStation = function(name, title, image, hidden) {
    var $station = $('<div/>', {'class': 'station' + (hidden ? ' hidden' : ''), 'data-name': name});
    $('<div/>', {'class': 'image'}).css('backgroundImage', image ? 'url('+ image +')' : '').appendTo($station);
    $('<i/>', {'class': 'icon icon-delete', 'title': chrome.i18n.getMessage('delete')}).appendTo($station);
    $('<i/>', {'class': 'icon icon-restore', 'title': chrome.i18n.getMessage('restore')}).appendTo($station);
    $('<h3/>', {'class': 'title', 'text': title}).appendTo($station);

    return $station;
  };

  var _renderHotkey = function(name, altKey, ctrlKey, shiftKey, keyCode) {
    var $item = $('.hotkey[data-hotkey="' + name + '"]');
    var $value = $item.find('.hotkey-value').empty();
    var $input = $item.find('.hotkey-change');
    if (+altKey) {
      $('<kbd/>', {text: sysCodeMap[18]}).appendTo($value);
      $('<span/>', {text: '+'}).appendTo($value);
      $input.data('altKey', 1);
    }
    if (+ctrlKey) {
      $('<kbd/>', {text: sysCodeMap[17]}).appendTo($value);
      $('<span/>', {text: '+'}).appendTo($value);
      $input.data('ctrlKey', 1);
    }
    if (+shiftKey) {
      $('<kbd/>', {text: sysCodeMap[16]}).appendTo($value);
      $('<span/>', {text: '+'}).appendTo($value);
      $input.data('shiftKey', 1);
    }
    if (keyCodeMap.hasOwnProperty(keyCode)) {
      $('<kbd/>', {text: keyCodeMap[keyCode]}).appendTo($value);
      $input.data('keyCode', keyCode);
    }
  };

  var Options = function() {
    this.Background = chrome.extension.getBackgroundPage();
    this.Storage = this.Background.Radio.Storage;

    // Open tab
    if (window.location.hash) {
      var hash = window.location.hash.substring(1);
      if (hash) {
        $('body').attr('data-page', hash);
      }
    }
  };

  Options.prototype = {
    renderStations: function() {
      var $container = $('#stations').empty();
      var stations = this.Storage.getStations();

      $.each(stations, function(name, station) {
        var rendered = _renderStation(name, station.title, station.image, station.hidden);
        $container.append(rendered);
      }.bind(this));
    },

    renderHotkeys: function() {
      var hotkeys = this.Storage.getHotkeys();
      for (var i in hotkeys) if (hotkeys.hasOwnProperty(i)) {
        _renderHotkey(i, hotkeys[i].altKey, hotkeys[i].ctrlKey, hotkeys[i].shiftKey, hotkeys[i].keyCode);
      }
    },

    initEvents: function() {
      var $page = this;

      $('ul.menu').on('click', 'li', function(e) {
        e.preventDefault();
        $('body').attr('data-page', $(this).data('page'));
      });

      $('#stations')
        .on('click', '.station > .icon-delete', function(e) {
          e.preventDefault();
          var $station = $(this).parent('.station'),
              name = $station.data('name');
          if (confirm(chrome.i18n.getMessage('reallyDelete'))) {
            $page.Storage.deleteStation(name);
            $page.renderStations();
          }
        })
        .on('click', '.station > .icon-restore', function(e) {
          e.preventDefault();
          var $station = $(this).parent('.station'),
              name = $station.data('name');
          $page.Storage.restoreStation(name);
          $page.renderStations();
        });

      $('#addStation').on('submit', function(e) {
        e.preventDefault();
        var $this = $(this);
        $page.Storage.addStation({
          title: $this.find('[name="title"]').val(),
          url: $this.find('[name="url"]').val(),
          image: $this.find('[name="image"]').val(),
          stream: $this.find('[name="stream"]').val()
        });
        $page.renderStations();
        $('body').attr('data-page', 'stations');
        $('#addStation').get(0).reset();
      });

      $('.hotkey-change')
        .on('focus', function(e) {
          e.preventDefault();
          var $this = $(this);
          var $hotkey = $this.parent('.hotkey').addClass('active');
          var name = $hotkey.data('hotkey');
          var data = $this.data();
          $this.data({
            altKeyOld: data['altKey'],
            altKey: 0,
            ctrlKeyOld: data['ctrlKey'],
            ctrlKey: 0,
            shiftKeyOld: data['shiftKey'],
            shiftKey: 0,
            keyCodeOld: data['keyCode'],
            keyCode: ''
          });
          _renderHotkey(name, false, false, false);
        })
        .on('keyup', function(e) {
          e.preventDefault();
          $(this).blur();
        })
        .on('keydown', function(e) {
          e.preventDefault();
          if (sysCodeMap.hasOwnProperty(e.which) || keyCodeMap.hasOwnProperty(e.which)) {
            _renderHotkey($(this).parent('.hotkey').data('hotkey'), e.altKey, e.ctrlKey, e.shiftKey, e.which);
          }
        })
        .on('blur', function(e) {
          e.preventDefault();
          var $this = $(this);
          var $hotkey = $this.parent('.hotkey').removeClass('active');
          var name = $hotkey.data('hotkey');
          if (!$this.data('keyCode')) {
            _renderHotkey(name, $this.data('altKeyOld'), $this.data('ctrlKeyOld'), $this.data('shiftKeyOld'), $this.data('keyCodeOld'));
          }
          $page.Storage.setHotkey(name, $this.data('altKey'), $this.data('ctrlKey'), $this.data('shiftKey'), $this.data('keyCode'));
        });
    }
  };

  $(function() {
    var Opened = new Options();
    Opened.renderStations();
    Opened.renderHotkeys();
    Opened.initEvents();
  });
})(window, jQuery);