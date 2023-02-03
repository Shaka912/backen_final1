const fs = require("fs");
const ffmpeg = require("ffmpeg");

const compressVideo = (fpath) => {
  try {
    let process = new ffmpeg(fpath);
    let cfpath = fpath + ".compress.avi";
    process.then(
      (video) => {
        video
          .setVideoSize("640x?", true, true, "#000")
          .setAudioCodec("libfaac")
          .setAudioChannels(2)
          .save(cfpath, (error, file) => {
            if (!error) console.log("Video file: " + file);
          });
        fs.rmSync(fpath);
        fs.renameSync(cfpath, fpath);
      },
      (err) => {
        console.log("Error: " + err);
      }
    );
  } catch (e) {
    console.log(e.code);
    console.log(e.msg);
  }
};

module.exports = compressVideo