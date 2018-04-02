
var ContextMenuTitles = [
  'Edit Header',
  'Edit Help',
  'Reset',
]

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId == 'Edit Header') {
    chrome.tabs.query({ active: true }, function (tabs) {
      chrome.tabs.sendMessage(tab.id, { action: "open_header_edit_dialog" }, function (response) { });
    });
  }
  else if (info.menuItemId == 'Edit Help') {
    chrome.tabs.query({ active: true }, function (tabs) {
      chrome.tabs.sendMessage(tab.id, { action: "open_help_edit_dialog" }, function (response) { });
    });
  }
  else if (info.menuItemId == 'Reset') {
    chrome.tabs.query({ active: true }, function (tabs) {
      chrome.tabs.sendMessage(tab.id, { action: "reset" }, function (response) { });
    });
  }
  return true
});

chrome.runtime.onMessage.addListener(function (request) {
  if (request.cmd == "create_context_menu") {
    chrome.contextMenus.removeAll(function () {
      ContextMenuTitles.forEach(function (title) {
        chrome.contextMenus.create({
          title: title,
          type: 'normal',
          id: title,
          contexts: ['all'],
        });
      });
    });
  } else if (request.cmd == "delete_context_menu") {
    chrome.contextMenus.removeAll();
  }
  return true
});