﻿define(['models/Station'], function(Station) {
  'use strict';

  /**
   * Favorites.
   * @type {[]}
   */
  var _favorites = JSON.parse(localStorage.getItem('_favorites')) || [];

  /**
   * Last station name.
   * @type {string}
   */
  var _last = localStorage.getItem('_last') || '';

  /**
   * Core stations.
   * @type {{}}
   */
  var _coreStations = {};

  /**
   * User stations.
   * @type {{}}
   */
  var _userStations = {};

  /**
   * Hidden stations list.
   * @type {{}}
   */
  var _hidden = JSON.parse(localStorage.getItem('_hidden')) || {};

  /**
   * Volume.
   * @type {{current: number, last: number}}
   */
  var _volume = JSON.parse(localStorage.getItem('_volume')) || {current: 80, last: 80};

  /**
   * Extension version.
   * @type {string}
   */
  var _version = localStorage.getItem('_version') || null;

  /**
   * Save value to localStorage.
   * @param {string} name
   * @param {*} value
   * @private
   */
  function _save(name, value) {
    localStorage.setItem(name, value);
  }

  /**
   * Add a station to favorites.
   * @param {string} name Station name.
   * @public
   */
  function like(name) {
    if (!isFavorite(name)) {
      _favorites.push(name);
    }
    _save('_favorites', JSON.stringify(_favorites));
  }

  /**
   * Remove a station from favorites.
   * @param {string} name Station name.
   * @public
   */
  function dislike(name) {
    var index = _favorites.indexOf(name);
    if (index >= 0) {
      _favorites.splice(index, 1);
    }
    _save('_favorites', JSON.stringify(_favorites));
  }

  /**
   * Check station in favorites.
   * @param {string} name Station name.
   * @return {boolean}
   * @public
   */
  function isFavorite(name) {
    return _favorites.indexOf(name) >= 0;
  }

  /**
   * Get names of favorites.
   * @return {Object}
   * @public
   */
  function getFavorites() {
    return _favorites;
  }

  /**
   * Set all favorites.
   * @param {[]} favorites
   */
  function setFavorites(favorites) {
    _favorites = favorites;
    _save('_favorites', JSON.stringify(_favorites));
  }

  /**
   * Get saved extension version.
   * @return {string}
   * @public
   */
  function getVersion() {
    return _version;
  }

  /**
   * Save extension version.
   * @param {string} version
   * @public
   */
  function setVersion(version) {
    _version = version;
    _save('_version', _version);
  }

  /**
   * Get all stations.
   * @return {{}}
   * @public
   */
  function getStations() {
    var stations = {}, name;
    for (name in _coreStations) if (_coreStations.hasOwnProperty(name)) {
      stations[name] = _coreStations[name];
    }
    for (name in _userStations) if (_userStations.hasOwnProperty(name)) {
      stations[name] = _userStations[name];
    }
    return stations;
  }

  /**
   * Get station by name.
   * @param {string} name Station name.
   * @return {?Station}
   * @public
   */
  function getStationByName(name) {
    if (_coreStations.hasOwnProperty(name)) {
      return _coreStations[name];
    }
    if (_userStations.hasOwnProperty(name)) {
      return _userStations[name];
    }
    return null;
  }

  /**
   * Set the last played station.
   * @param {string} name Station name.
   * @public
   */
  function setLast(name) {
    _last = name;
    _save('_last', _last);
  }

  /**
   * Get the last played station name.
   * @return {string}
   * @public
   */
  function getLastName() {
    return _last;
  }

  /**
   * Get the last played station.
   * @return {Station}
   * @public
   */
  function getLastStation() {
    return getStationByName(_last);
  }

  /**
   * Get volume.
   * @return {number}
   * @public
   */
  function getVolume() {
    return typeof _volume.current == 'number' ? _volume.current : 0;
  }

  /**
   * Get last before current volume value.
   * @return {number}
   * @public
   */
  function getVolumeLast() {
    return typeof _volume.last == 'number' ? _volume.last : 0;
  }

  /**
   * Save volume value.
   * @param {number} volume Volume.
   * @public
   */
  function setVolume(volume) {
    var last = _volume.current;
    _volume = {current: volume, last: last};
    _save('_volume', JSON.stringify(_volume));
  }

  /**
   * Save users station.
   * @param {string} title Station title.
   * @param {string[]} streams Station streams.
   * @param {string=} url Station site url.
   * @param {string=} image Station image url.
   * @param {string|number=} name Station name for update station.
   * @public
   */
  function addStation(title, streams, url, image, name) {
    if (!name) { // Создаем новую станцию
      var keys = Object.keys(_userStations);
      name = keys.length > 0 ? parseInt(keys[keys.length - 1], 10) + 1 : 1;
    } else if (!_userStations[name]) { // Проверим, есть ли станция с таким именем
      return;
    }
    _userStations[name] = new Station(name, title, url, streams, image, true);
    _save('_stations', JSON.stringify(_userStations));
  }

  /**
   * Delete users station.
   * @param {string} name Station name.
   * @public
   */
  function deleteStation(name) {
    if (_userStations.hasOwnProperty(name)) {
      delete _userStations[name];
      _save('_stations', JSON.stringify(_userStations));
    }
    else if (_coreStations.hasOwnProperty(name)) {
      _coreStations[name].setHidden(true);
      _hidden[name] = 1;
      _save('_hidden', JSON.stringify(_hidden));
    }
  }

  /**
   * Restore deleted core station.
   * @param {string} name Station name.
   * @public
   */
  function restoreStation(name) {
    if (_hidden.hasOwnProperty(name)) {
      _coreStations[name].setHidden(false);
      delete _hidden[name];
      _save('_hidden', JSON.stringify(_hidden));
    }
  }

  // Load core stations list
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = (function() {
    if (xhr.readyState == 4) {
      var json = JSON.parse(xhr.responseText);
      for (var name in json) if (json.hasOwnProperty(name)) {
        _coreStations[name] = new Station(name, json[name].title, json[name].url, json[name].streams, json[name].image, false, _hidden.hasOwnProperty(name));
      }
    }
  });
  xhr.open('GET', chrome.extension.getURL('stations.json'), true);
  xhr.send();

  // Load users stations list
  var json = JSON.parse(localStorage.getItem('_stations')) || {};
  for (var name in json) if (json.hasOwnProperty(name)) {
    _userStations[name] = new Station(name, json[name].title, json[name].url, json[name].streams, json[name].image, true);
  }

  /**
   * @typedef {{}} DataStorage
   */
  return {
    like: like,
    dislike: dislike,
    isFavorite: isFavorite,
    getFavorites: getFavorites,
    setFavorites: setFavorites,
    getVersion: getVersion,
    setVersion: setVersion,
    getStations: getStations,
    getStationByName: getStationByName,
    setLast: setLast,
    getLastName: getLastName,
    getLastStation: getLastStation,
    getVolume: getVolume,
    getVolumeLast: getVolumeLast,
    setVolume: setVolume,
    addStation: addStation,
    deleteStation: deleteStation,
    restoreStation: restoreStation
  };
});