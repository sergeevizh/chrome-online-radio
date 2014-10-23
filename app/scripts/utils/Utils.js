define(['models/DataStorage', 'utils/Translator'], function(DataStorage, Translator) {
  'use strict';

  /**
   * Update functions.
   * @private
   */
  var updates = {
    '1.7.0': function() {
      // Удаляем старые хоткеи, будем использовать системные
      localStorage.removeItem('_hotkeys');
    },
    '1.7.2': function() {
      // Сделаем из объекта массив
      var favorites = DataStorage.getFavorites(), newFavorites = [];
      for (var name in favorites) {
        if (favorites.hasOwnProperty(name)) {
          newFavorites.push(name);
        }
      }
      DataStorage.setFavorites(newFavorites);
    },
    '1.7.7': function() {
      var json = JSON.parse(localStorage.getItem('_stations')) || {};
      for (var name in json) {
        if (json.hasOwnProperty(name)) {
          DataStorage.addStation(json[name].title, [json[name].stream], json[name].url || '', json[name].image || '', name);
        }
      }
    },
    '2.0.0': function() {
      localStorage.removeItem('_version');
    }
  };

  /**
   * Check updates and run callbacks.
   * @param {{previousVersion: string, reason: string}} details
   */
  function checkUpdates(details) {
    var previousVersion = details.previousVersion,
        currentVersion = chrome.runtime.getManifest().version;

    if (previousVersion && currentVersion > previousVersion) {
      for (var version in updates) {
        if (updates.hasOwnProperty(version)) {
          if (version > previousVersion && version <= currentVersion) {
            updates[version].call();
            console.info('Update ' + version + ' installed');
          }
        }
      }
    }
  }

  /**
   * Show notification.
   * @param {string} message
   * @param {function=} callback
   */
  function showNotification(message, callback) {
    chrome.notifications.create('radio_online', {
      title: Translator.translate('name'),
      iconUrl: chrome.extension.getURL('images/80.png'),
      type: 'basic',
      message: message
    }, callback || function() {});
  }

  /**
   * Open options page.
   * @param {string} page
   */
  function openOptions(page) {
    var optionsUrl = chrome.runtime.getURL('options.html');
    var fullUrl = (typeof page === 'string') ? optionsUrl + '#' + page : optionsUrl;
    chrome.tabs.query({url: optionsUrl}, function(tabs) {
      if (tabs.length) {
        chrome.tabs.update(tabs[0].id, {active: true, url: fullUrl});
        chrome.tabs.reload(tabs[0].id);
      }
      else {
        chrome.tabs.create({url: fullUrl});
      }
    });
  }

  /**
   * @typedef {{}} Utils
   */
  return {
    checkUpdates: checkUpdates,
    showNotification: showNotification,
    openOptions: openOptions
  };
});
