// Get the id of the <path> element and the length of <path>
var rsmt = document.getElementById("rsmtSvgPath");
var length = rsmt.getTotalLength();

// The start position of the drawing
rsmt.style.strokeDasharray = length;

// Hide the triangle by offsetting dash. Remove this line to show the triangle before scroll draw
rsmt.style.strokeDashoffset = length;

function myFunction() {
    var scrollThreshold = document.documentElement.scrollHeight - document.documentElement.clientHeight - window.innerHeight;
    var scrollpercent = Math.max(0, (document.body.scrollTop + document.documentElement.scrollTop - scrollThreshold) / (window.innerHeight));
    
    var draw = length * scrollpercent;
  
    // Reverse the drawing (when scrolling upwards)
    rsmt.style.strokeDashoffset = length - draw;
  }

// Find scroll percentage on scroll (using cross-browser properties), and offset dash same amount as percentage scrolled
window.addEventListener("scroll", myFunction);

