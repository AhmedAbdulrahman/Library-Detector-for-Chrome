/**
    description: Responds to notification from the Content Script and displays the icon
**/

var libraries, library, tabId;
var Libraries = d41d8cd98f00b204e9800998ecf8427e_LibraryDetectorTests;

/**
 * Parse the data from the meta tag
 */
function parseLibraries(libs) {
    if (libs.length === 0) return [];
    var libkeys = [];
    libs = libs.split(',');
    for (var i=0; i<libs.length; i++) {
        var libdata = libs[i].split(':');
        libkeys.push({
            name: libdata[0],
            version: libdata[1]
        });
    }
    return libkeys;
}

/**
 * Add in the static properties that go with the runtime library data
 */
function getLibraries(libs) {  //name, version, icon, url
    libraries = parseLibraries(libs);
    for (var i=0; i<libraries.length; i++) {
        lib = libraries[i];
        lib.url = Libraries[lib.name].url;
        lib.icon = Libraries[lib.name].icon;
    }
    return libraries;
}

/**
 * Set no icon
 */
function setNoIcon() {
    chrome.pageAction.hide(tabId);
}

/**
 * Dispatch the program
 */
function run(libs, tab) {
    tabId = tab;
    libraries = getLibraries(libs);
    if (libraries.length === 0) {
        setNoIcon();
        return;
    }
    library = libraries[0];
    getIcon(library.icon, libraries.length);
}

/**
 * Callback to finish rendering after canvases are done loading
 */
function dispatch(pixelData) {

    chrome.pageAction.setIcon({
        tabId: tabId,
        imageData: pixelData
    });

    chrome.pageAction.setTitle({
        tabId: tabId,
        title: libraries.length > 1 ? libraries.length + ' libraries detected' : library.name + ' ' + library.version
    });
    chrome.pageAction.setPopup({
        'tabId': tabId,
        'popup': '../popups/libraries.html'
    });

    localStorage.setItem('libraries_' + tabId, JSON.stringify(libraries));

    chrome.pageAction.show(tabId);
}

/**
 * Use a canvas to add an overlay to the icon, if necessary, return the pixel data
 */
function getIcon(iconName, count) {
    var image = document.createElement('canvas');
    image.width = 19;
    image.height = 19;
    var context = image.getContext('2d');
    var icon = new Image;
    icon.src = '../icons/'+iconName+'.png';
    icon.addEventListener('load', function() {
        context.drawImage(icon, 0, 0, 19, 19);
        if (count > 1) {
            // overlay circle
            var x = 13,
                y = 13,
                radius = 5.5,
                startAngle = 0,
                endAngle = 2 * Math.PI,
                counterClockwise = false,
                lineWidth = 1,
                lineColor = 'black',
                fillColor = 'white';
            context.beginPath();
            context.arc(x, y, radius, startAngle, endAngle, counterClockwise);
            context.closePath();
            context.lineWidth = lineWidth;
            context.strokeStyle = lineColor;
            context.stroke();
            context.fillStyle = fillColor;
            context.fill();
            // overlay number
            var txtX = 15.75,
                txtY = 19;
                txtFont = '10px Monospace',
                txtColor = 'black';
            if (count >= 10) {
                txtX = 17.75;
            }
            context.font = txtFont;
            context.fillStyle = txtColor;
            context.textBaseline = 'bottom';
            context.textAlign = 'right';
            context.fillText(count, txtX, txtY);
        }
        dispatch(context.getImageData(0, 0, 19, 19));
    }, false);
}

chrome.extension.onMessage.addListener(function(library, sender, sendResponse) {
    run(library, sender.tab.id);
});
