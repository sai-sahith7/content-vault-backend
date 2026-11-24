const getType = (url) => {
  if (url.includes("youtube.com/watch?v=")) {
    return "YouTube";
  } else if (url.match(/youtu\.be\/([^?]+)/)) {
    return "YouTube";
  } else if (url.match(/youtube\.com\/shorts\/([^\/?#]+)/)) {
    return "YouTube";
  } else if (url.match(/instagram\.com\/reels?\/([^\/?#]+)/)) {
    return "Instagram";
  } else if (url.match(/(\/\/|\.)(twitter|x)\.com\/[^\/]+\/status\//)) {
    return "X";
  } else {
    return "Web";
  }
};

module.exports = getType;
