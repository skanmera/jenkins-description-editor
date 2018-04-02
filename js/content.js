
$('body').append("<div id='header_element'><input id='header_text' type='text'></div>");
$('body').append("<div id='help_element'><textarea id='help_text'/></div>");

var BuildStep = function (id, index, header, help) {
  this.id = id;
  this.index = index;
  this.header = header;
  this.help = help;
};

var buildSteps = [];
var selectedIndex = -1;

const DialogSources = {
  EDIT_HEADER: {
    title: 'Edit Build Step Header',
    element: $('#header_element'),
    open: function () {
      this.element.dialog('open')
    },
    close: function () {
      var inputText = $('#header_text')[0].value;
      if (inputText && selectedIndex >= 0) {
        var buildStep = buildSteps.find(bs => bs.index == selectedIndex);
        if (buildStep) {
          buildStep.header = inputText;
        }
        else {
          var builder = getBuilder(selectedIndex);
          if (builder) {
            buildSteps.push(new BuildStep(builder.id, selectedIndex, inputText, ''));
          }
        }
        save();
        overwriteHeaders();
      }
      $(this).dialog('close');
    }
  },
  EDIT_HELP: {
    title: 'Edit Build Step Help',
    element: $('#help_element'),
    open: function () {
      this.element.dialog('open')
    },
    close: function () {
      var inputText = $('#help_text')[0].value;
      if (inputText && selectedIndex >= 0) {
        var buildStep = buildSteps.find(bs => bs.index == selectedIndex);
        if (buildStep) {
          buildStep.help = inputText;
        }
        else {
          var builder = getBuilder(selectedIndex);
          if (builder) {
            buildSteps.push(new BuildStep(selectedIndex, '', inputText));
          }
        }
        save();
        overwriteHelp();
      }
      $(this).dialog('close');
    }
  }
};

function createDialogs() {
  function create(source) {
    source.element.dialog({
      autoOpen: false,
      title: source.title,
      modal: true,
      resizable: true,
      buttons: {
        "Save": source.close
      }
    });
  };

  for (var key in DialogSources)
    create(DialogSources[key]);
}

function initializeEventListeners() {
  document.addEventListener('mousedown', function (event) {
    var element = event.srcElement;
    while (element != null) {
      if (element.getAttribute('name') == 'builder') {
        selectedIndex = getBuilderIndex(element);
        if (event.button == 2) {
          chrome.runtime.sendMessage({ cmd: "create_context_menu" });
        }
        else if (event.button == 0 && event.srcElement.className == "icon-help icon-sm") {
          overwriteHelp();
        }
        return;
      }
      element = element.parentElement;
    }

    chrome.runtime.sendMessage({ cmd: "delete_context_menu" });
  });

  document.addEventListener('mouseup', function (event) {
    reindex()
  });

  window.onload = function () {
    document.getElementsByName('Submit')[0].onclick = function () {
      save();
    }
    document.getElementsByName('Apply')[0].onclick = function () {
      save();
    }
  }

  chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action == 'open_header_edit_dialog') {
      DialogSources.EDIT_HEADER.open();
    }
    else if (msg.action == 'open_help_edit_dialog') {
      DialogSources.EDIT_HELP.open();
    }
    else if (msg.action == 'reset') {
      buildSteps = [];
      save();
    }
  });
}

function overwriteHeaders() {
  var builders = document.getElementsByName('builder');
  for (var i = 0; i < builders.length; i++) {
    var builder = builders[i];
    var buildStep = buildSteps.find(bs => bs.index == i);
    if (buildStep) {
      builder.getElementsByTagName('b')[0].innerText = buildStep.header;
    }
  }
};

function overwriteHelp() {
  builder = document.getElementsByName('builder')[selectedIndex];
  if (builder) {
    var buildStep = buildSteps.find(bs => bs.index == selectedIndex);
    if (buildStep && buildStep.help) {
      setTimeout(() => {
        var helpElement = builder.getElementsByClassName('help')[0].children[0];
        if (helpElement) {
          helpElement.innerText = buildStep.help;
        }
      }, 200);
    }
  }
};

function initializeId() {
  for (var key in buildSteps) {
    var buildStep = buildSteps[key];
    var builder = getBuilder(buildStep.index);
    if (builder) {
      buildStep.id = builder.id;
    }
    else {
      buildSteps.some(function (v, i) {
        if (v.id == buildStep.id) {
          buildSteps.splice(i, 1);
        }
      });
    }
  }
}

function reindex() {
  for (var key in buildSteps) {
    var buildStep = buildSteps[key];
    var builder = getBuilder(buildStep.index);
    if (!builder || builder.id != buildStep.id) {
      var b = findBuilder(buildStep.id);
      if (b) {
        buildStep.index = getBuilderIndex(b);
      }
      else {
        buildSteps.some(function (v, i) {
          if (v.id == buildStep.id) {
            buildSteps.splice(i, 1);
          }
        });
      }
    }
  }
}

function getJobName() {
  return document.URL.split('/').slice(-2, -1)[0];
}

function load() {
  var jobName = getJobName();
  chrome.storage.local.get(jobName, function (value) {
    try {
      buildSteps = JSON.parse(value[jobName]);
      initializeId();
      overwriteHeaders();
    }
    catch (e) {
      buildSteps = [];
    }
  })
};

function save() {
  var jobName = getJobName();
  chrome.storage.local.set({ [jobName]: JSON.stringify(buildSteps) });
}

function getBuilderIndex(builder) {
  var builders = document.getElementsByName('builder');
  for (var i = 0; i < builders.length; i++) {
    if (builder == builders[i]) {
      return i;
    }
  }

  return -1;
}

function getBuilder(index) {
  return document.getElementsByName('builder')[index];
}

function findBuilder(id) {
  return [].slice.call(document.getElementsByName('builder')).find(b => b.id == id);
}

createDialogs();
initializeEventListeners();
load();